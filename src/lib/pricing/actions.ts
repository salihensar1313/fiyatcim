"use server";

import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { revalidatePath } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { PriceSourceStatus, PricingJob, PricingRule, PricingRoundingStrategy } from "@/types";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const execFileAsync = promisify(execFile);
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type JsonObject = Record<string, unknown>;
type DbClient = SupabaseClient;

interface ActionResult<T = null> {
  data: T | null;
  error: string | null;
}

interface PricingCheckResult {
  sourceId: string;
  productId: string;
  selectedPriceSourceId: string | null;
  sourceStatus: string;
  confidenceScore: number;
  matchScore: number;
  productPriceUpdated: boolean;
  pricingDecisionId: string | null;
  fallbackCandidateId: string | null;
  logsCreated: number;
  checkedAt: string;
}

const sourceStatusSchema = z.enum([
  "active",
  "fallback_candidate",
  "blocked",
  "not_found",
  "invalid_match",
  "manual_review",
  "disabled",
]);

const sourceInputSchema = z.object({
  product_id: z.string().uuid(),
  source_site_id: z.string().uuid(),
  source_url: z.string().url(),
  source_sku: z.string().trim().optional().nullable(),
  source_brand: z.string().trim().optional().nullable(),
  source_title: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  check_interval_hours: z.number().int().positive().max(720).optional(),
  custom_selectors: z.record(z.string(), z.any()).optional(),
});

const sourceUpdateSchema = z.object({
  source_url: z.string().url().optional(),
  source_sku: z.string().trim().optional().nullable(),
  source_brand: z.string().trim().optional().nullable(),
  source_title: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  check_interval_hours: z.number().int().positive().max(720).optional(),
  custom_selectors: z.record(z.string(), z.any()).optional(),
});

const verifySchema = z.object({
  approved: z.boolean(),
  reason: z.string().trim().optional().nullable(),
});

const pricingRuleSchema = z.object({
  name: z.string().min(2),
  rule_type: z.enum(["global", "brand", "category", "product"]),
  target_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
  margin_percent: z.number().min(0).optional().nullable(),
  min_margin_amount: z.number().min(0).optional().nullable(),
  max_price: z.number().min(0).optional().nullable(),
  min_price: z.number().min(0).optional().nullable(),
  rounding_strategy: z.enum(["none", "round_99", "round_nearest_10"]) as z.ZodType<PricingRoundingStrategy>,
  priority: z.number().int().min(0).max(9999),
  is_active: z.boolean().optional(),
});

const sourceSiteUpdateSchema = z.object({
  is_active: z.boolean().optional(),
  priority: z.number().int().min(0).max(9999).optional(),
  rate_limit_ms: z.number().int().min(0).max(60000).optional(),
  selectors: z.record(z.string(), z.any()).optional(),
  extractor_config: z.record(z.string(), z.any()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  notes: z.string().trim().optional().nullable(),
});

const productPricingSettingsSchema = z.object({
  price_locked: z.boolean().optional(),
  manual_price: z.number().min(0).optional(),
  note: z.string().trim().optional().nullable(),
});

const batchJobSchema = z.object({
  type: z.enum(["batch_scrape", "batch_price_update"]).default("batch_price_update"),
  filters: z.object({
    siteId: z.string().uuid().optional(),
    status: z.string().optional(),
    productId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    manualReviewRequired: z.boolean().optional(),
    selectedOnly: z.boolean().optional(),
    confidenceMin: z.number().min(0).max(100).optional(),
    confidenceMax: z.number().min(0).max(100).optional(),
    checkedBeforeHours: z.number().int().min(1).max(24 * 90).optional(),
  }).default({}),
});

function createServiceRoleSupabaseClient(): DbClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function writePricingAuditLog(input: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("audit_logs").insert({
    user_id: input.userId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
  });
}

function revalidatePricingSurfaces() {
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/fiyatlandirma");
}

function normalizeBatchFilters(filters: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function getBatchRunnerScriptPath() {
  return path.join(process.cwd(), "tools", "pricing", "jobs", "run-batch.mjs");
}

function spawnDetachedPricingJob(jobId: string) {
  const scriptPath = getBatchRunnerScriptPath();
  const child = spawn("node", [scriptPath, "--job-id", jobId], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: "ignore",
  });

  child.unref();
}

async function runPricingScript(args: string[]): Promise<PricingCheckResult> {
  const scriptPath = path.join(process.cwd(), "tools", "pricing", "check-source.mjs");
  const { stdout, stderr } = await execFileAsync("node", [scriptPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 1024 * 8,
    timeout: 120_000,
  });

  if (stderr?.trim()) {
    logger.warn("pricing_cli_stderr", { fn: "runPricingScript", stderr });
  }

  const output = stdout.trim();
  if (!output) {
    throw new Error("Pricing script empty output");
  }

  return JSON.parse(output) as PricingCheckResult;
}

export async function checkPricingSourceAction(sourceId: string): Promise<ActionResult<PricingCheckResult>> {
  if (IS_DEMO) {
    return { data: null, error: "Demo modda fiyat scrape devre dışı" };
  }

  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) {
    return { data: null, error: "Yetkiniz yok" };
  }

  try {
    const result = await runPricingScript(["--source-id", sourceId, "--triggered-by", user.id]);

    await writePricingAuditLog({
      userId: user.id,
      action: "pricing.source.check",
      entityType: "price_source",
      entityId: sourceId,
      newValue: {
        confidence_score: result.confidenceScore,
        match_score: result.matchScore,
        source_status: result.sourceStatus,
        product_price_updated: result.productPriceUpdated,
        pricing_decision_id: result.pricingDecisionId,
        fallback_candidate_id: result.fallbackCandidateId,
        checked_at: result.checkedAt,
      },
    });

    revalidatePricingSurfaces();
    return { data: result, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pricing check failed";
    logger.error("pricing_source_check_failed", {
      fn: "checkPricingSourceAction",
      sourceId,
      error: message,
    });

    await writePricingAuditLog({
      userId: user?.id ?? null,
      action: "pricing.source.check_failed",
      entityType: "price_source",
      entityId: sourceId,
      newValue: { error: message },
    });

    return { data: null, error: message };
  }
}

export async function createPricingSourceAction(input: unknown): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = sourceInputSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const payload = parsed.data;

  const { data, error } = await supabase
    .from("price_sources")
    .insert({
      ...payload,
      status: "manual_review",
      match_verified: false,
      manual_review_required: true,
      confidence_score: 0,
      failure_count: 0,
      check_interval_hours: payload.check_interval_hours ?? 24,
      custom_selectors: payload.custom_selectors ?? {},
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.source.create",
    entityType: "price_source",
    entityId: data.id,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function updatePricingSourceAction(id: string, updates: unknown): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = sourceUpdateSchema.safeParse(updates);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("price_sources").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("price_sources")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.source.update",
    entityType: "price_source",
    entityId: id,
    oldValue: (existing as JsonObject | null) ?? null,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function setPricingSourceStatusAction(
  id: string,
  status: PriceSourceStatus
): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = sourceStatusSchema.safeParse(status);
  if (!parsed.success) return { data: null, error: "Geçersiz kaynak durumu" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("price_sources").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("price_sources")
    .update({
      status: parsed.data,
      manual_review_required: parsed.data === "manual_review",
      review_reason: parsed.data === "disabled" ? "Admin tarafından kapatıldı" : existing?.review_reason ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.source.status",
    entityType: "price_source",
    entityId: id,
    oldValue: { status: existing?.status },
    newValue: { status: parsed.data },
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function verifyPricingSourceAction(id: string, input: unknown): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("price_sources").select("*").eq("id", id).single();

  const nextState = parsed.data.approved
    ? {
        match_verified: true,
        verification_method: "manual",
        manual_review_required: false,
        review_reason: parsed.data.reason ?? null,
        status: existing?.status === "disabled" ? "disabled" : "active",
      }
    : {
        match_verified: false,
        verification_method: null,
        manual_review_required: true,
        review_reason: parsed.data.reason ?? "Admin eşleşmeyi reddetti",
        status: "invalid_match",
      };

  const { data, error } = await supabase
    .from("price_sources")
    .update(nextState)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: parsed.data.approved ? "pricing.source.verify" : "pricing.source.reject",
    entityType: "price_source",
    entityId: id,
    oldValue: (existing as JsonObject | null) ?? null,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function createPricingRuleAction(input: unknown): Promise<ActionResult<PricingRule>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = pricingRuleSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_rules")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.rule.create",
    entityType: "pricing_rule",
    entityId: data.id,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as PricingRule, error: null };
}

export async function updatePricingRuleAction(id: string, input: unknown): Promise<ActionResult<PricingRule>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = pricingRuleSchema.partial().safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("pricing_rules").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("pricing_rules")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.rule.update",
    entityType: "pricing_rule",
    entityId: id,
    oldValue: (existing as JsonObject | null) ?? null,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as PricingRule, error: null };
}

export async function setPricingRuleStatusAction(id: string, isActive: boolean): Promise<ActionResult<PricingRule>> {
  return updatePricingRuleAction(id, { is_active: isActive });
}

export async function resolvePriceAlertAction(id: string, resolutionNote?: string | null): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("price_alerts").select("*").eq("id", id).single();
  const metadata = {
    ...((existing?.metadata as JsonObject | null) ?? {}),
    resolution_note: resolutionNote ?? null,
  };

  const { data, error } = await supabase
    .from("price_alerts")
    .update({
      is_resolved: true,
      is_read: true,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      metadata,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.alert.resolve",
    entityType: "price_alert",
    entityId: id,
    oldValue: (existing as JsonObject | null) ?? null,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function updateSourceSiteAction(id: string, input: unknown): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = sourceSiteUpdateSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase.from("source_sites").select("*").eq("id", id).single();
  const { data, error } = await supabase
    .from("source_sites")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.site.update",
    entityType: "source_site",
    entityId: id,
    oldValue: (existing as JsonObject | null) ?? null,
    newValue: data as JsonObject,
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function updateProductPricingSettingsAction(
  productId: string,
  input: unknown
): Promise<ActionResult<JsonObject>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = productPricingSettingsSchema.safeParse(input);
  if (!parsed.success) return { data: null, error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };

  const supabase = createServiceRoleSupabaseClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { data: null, error: "Ürün bulunamadı" };
  }

  const updates: JsonObject = {};
  const explicitPriceLocked = typeof parsed.data.price_locked === "boolean";
  const resolvedPriceLocked =
    parsed.data.manual_price != null && !explicitPriceLocked
      ? true
      : parsed.data.price_locked;

  if (typeof resolvedPriceLocked === "boolean") {
    updates.price_locked = resolvedPriceLocked;
  }

  if (parsed.data.manual_price != null) {
    const decisionInsert = {
      product_id: productId,
      selected_source_id: product.price_source_id ?? null,
      source_price: product.cost_price ?? null,
      source_currency: product.cost_currency ?? null,
      applied_rule_id: null,
      margin_percent_applied: null,
      calculated_price: parsed.data.manual_price,
      final_price: parsed.data.manual_price,
      decision_type: "manual_override",
      confidence_at_decision: null,
      rejection_reasons: [],
      was_price_locked: Boolean(product.price_locked),
      price_actually_updated: true,
      decided_by: user.id,
      metadata: { note: parsed.data.note ?? null },
    };

    const { data: decision } = await supabase
      .from("pricing_decisions")
      .insert(decisionInsert)
      .select("id")
      .single();

    await supabase.from("price_history").insert({
      product_id: productId,
      source_id: product.price_source_id ?? null,
      price_type: "manual_override",
      old_price: product.price,
      new_price: parsed.data.manual_price,
      currency: "TRY",
      change_percent: product.price > 0 ? Number((((parsed.data.manual_price - product.price) / product.price) * 100).toFixed(2)) : 0,
      change_reason: parsed.data.note ?? "manual_override",
      changed_by: user.id,
      metadata: { pricing_decision_id: decision?.id ?? null },
    });

    updates.price = parsed.data.manual_price;
    updates.last_price_update = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.product.settings",
    entityType: "product",
    entityId: productId,
    oldValue: {
      price_locked: product.price_locked,
      price: product.price,
    },
    newValue: {
      price_locked: data.price_locked,
      price: data.price,
    },
  });

  revalidatePricingSurfaces();
  return { data: data as JsonObject, error: null };
}

export async function createPricingJobReadRecord(job: Partial<PricingJob>): Promise<ActionResult<PricingJob>> {
  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("pricing_jobs")
    .insert({
      type: job.type ?? "batch_scrape",
      status: job.status ?? "pending",
      total_items: job.total_items ?? 0,
      processed_items: job.processed_items ?? 0,
      success_count: job.success_count ?? 0,
      failure_count: job.failure_count ?? 0,
      skipped_count: job.skipped_count ?? 0,
      triggered_by: user.id,
      filters: job.filters ?? {},
      metadata: job.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as PricingJob, error: null };
}

export async function startBatchPricingJobAction(input: unknown): Promise<ActionResult<PricingJob>> {
  if (IS_DEMO) {
    return { data: null, error: "Demo modda batch pricing devre disi" };
  }

  const { user, isAdmin } = await requireAdmin();
  if (!user || !isAdmin) return { data: null, error: "Yetkiniz yok" };

  const parsed = batchJobSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? "Gecersiz batch verisi" };
  }

  const supabase = createServiceRoleSupabaseClient();
  const normalizedFilters = normalizeBatchFilters(parsed.data.filters);
  const dedupeKey = `${parsed.data.type}:${JSON.stringify(normalizedFilters)}`;

  const { data: existingJobs } = await supabase
    .from("pricing_jobs")
    .select("*")
    .eq("type", parsed.data.type)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(10);

  const duplicateJob = (existingJobs ?? []).find((job) => {
    const existingDedupe = typeof job.metadata?.dedupe_key === "string" ? job.metadata.dedupe_key : null;
    return existingDedupe === dedupeKey;
  });

  if (duplicateJob) {
    return {
      data: null,
      error: `Benzer bir batch job zaten calisiyor: ${duplicateJob.id}`,
    };
  }

  const { data: job, error } = await supabase
    .from("pricing_jobs")
    .insert({
      type: parsed.data.type,
      status: "pending",
      total_items: 0,
      processed_items: 0,
      success_count: 0,
      failure_count: 0,
      skipped_count: 0,
      triggered_by: user.id,
      filters: normalizedFilters,
      metadata: {
        dedupe_key: dedupeKey,
        requested_at: new Date().toISOString(),
      },
    })
    .select("*")
    .single();

  if (error || !job) {
    return { data: null, error: error?.message ?? "Batch job olusturulamadi" };
  }

  try {
    spawnDetachedPricingJob(job.id);
  } catch (spawnError) {
    await supabase
      .from("pricing_jobs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        metadata: {
          ...(job.metadata ?? {}),
          dedupe_key: dedupeKey,
          error_summary: spawnError instanceof Error ? spawnError.message : "Worker baslatilamadi",
        },
      })
      .eq("id", job.id);

    return {
      data: null,
      error: spawnError instanceof Error ? spawnError.message : "Worker baslatilamadi",
    };
  }

  await writePricingAuditLog({
    userId: user.id,
    action: "pricing.job.start",
    entityType: "pricing_job",
    entityId: job.id,
    newValue: {
      type: parsed.data.type,
      filters: normalizedFilters,
      dedupe_key: dedupeKey,
    },
  });

  revalidatePricingSurfaces();
  return { data: job as PricingJob, error: null };
}
