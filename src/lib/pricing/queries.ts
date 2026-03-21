import type {
  PriceAlert,
  PriceHistoryRecord,
  PricingDecision,
  PricingJob,
  Product,
  PriceSource,
  PricingRule,
  SourceSite,
  SourceScrapeLog,
} from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type JsonObject = Record<string, unknown>;
type DbClient = SupabaseClient;

export interface PriceSourceWithRelations extends PriceSource {
  product?: Product;
  source_site?: SourceSite;
}

export interface PriceAlertWithRelations extends PriceAlert {
  product?: Product;
  source?: PriceSourceWithRelations;
}

export interface PricingHistoryRow extends PriceHistoryRecord {
  product?: Product;
  source?: PriceSourceWithRelations;
}

export interface PricingDecisionWithRelations extends PricingDecision {
  product?: Product;
  source?: PriceSourceWithRelations;
  applied_rule?: PricingRule | null;
}

export interface SourceScrapeLogWithRelations extends SourceScrapeLog {
  source?: PriceSourceWithRelations;
}

export interface PricingDashboardData {
  activeSourceCount: number;
  averageConfidence: number;
  manualReviewCount: number;
  activeAlertCount: number;
  lastUpdateAt: string | null;
  siteHealth: SourceSite[];
  recentJobs: PricingJob[];
  runningJobCount: number;
  lastBatchResult: PricingJob | null;
  lastFailedJob: PricingJob | null;
}

function mapSourceSite(row: JsonObject): SourceSite {
  return {
    id: row.id as string,
    name: row.name as string,
    base_url: row.base_url as string,
    is_active: (row.is_active as boolean) ?? true,
    priority: Number(row.priority) || 0,
    rate_limit_ms: Number(row.rate_limit_ms) || 0,
    selectors: (row.selectors as JsonObject | null) ?? {},
    extractor_config: (row.extractor_config as JsonObject | null) ?? {},
    headers: ((row.headers as JsonObject | null) ?? {}) as Record<string, string>,
    health_score: Number(row.health_score) || 0,
    last_success_at: (row.last_success_at as string | null) ?? null,
    last_failure_at: (row.last_failure_at as string | null) ?? null,
    failure_count: Number(row.failure_count) || 0,
    total_scrapes_30d: Number(row.total_scrapes_30d) || 0,
    successful_scrapes_30d: Number(row.successful_scrapes_30d) || 0,
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapProduct(row: JsonObject): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    sku: (row.sku as string) ?? "",
    category_id: row.category_id as string,
    brand_id: row.brand_id as string,
    price: Number(row.price) || 0,
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
    price_usd: Number(row.price_usd) || 0,
    sale_price_usd: row.sale_price_usd != null ? Number(row.sale_price_usd) : null,
    stock: Number(row.stock) || 0,
    critical_stock: Number(row.critical_stock) || 0,
    tax_rate: Number(row.tax_rate) || 0,
    warranty_months: Number(row.warranty_months) || 0,
    shipping_type: (row.shipping_type as "kargo" | "kurulum") ?? "kargo",
    is_active: (row.is_active as boolean) ?? true,
    deleted_at: (row.deleted_at as string | null) ?? null,
    short_desc: (row.short_desc as string) ?? "",
    description: (row.description as string) ?? "",
    specs: (row.specs as Record<string, string>) ?? {},
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    seo_title: (row.seo_title as string) ?? "",
    seo_desc: (row.seo_desc as string) ?? "",
    price_locked: (row.price_locked as boolean) ?? false,
    cost_price: row.cost_price != null ? Number(row.cost_price) : null,
    cost_currency: (row.cost_currency as string | null) ?? null,
    price_source_id: (row.price_source_id as string | null) ?? null,
    last_price_update: (row.last_price_update as string | null) ?? null,
    is_featured: (row.is_featured as boolean) ?? false,
    is_trending: (row.is_trending as boolean) ?? false,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | undefined) ?? undefined,
  };
}

function mapPriceSource(row: JsonObject): PriceSourceWithRelations {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    source_site_id: row.source_site_id as string,
    source_url: row.source_url as string,
    source_sku: (row.source_sku as string | null) ?? null,
    source_brand: (row.source_brand as string | null) ?? null,
    source_title: (row.source_title as string | null) ?? null,
    status: row.status as PriceSource["status"],
    match_verified: (row.match_verified as boolean) ?? false,
    verification_method: (row.verification_method as PriceSource["verification_method"]) ?? null,
    match_score: row.match_score != null ? Number(row.match_score) : null,
    manual_review_required: (row.manual_review_required as boolean) ?? false,
    review_reason: (row.review_reason as string | null) ?? null,
    last_price: row.last_price != null ? Number(row.last_price) : null,
    last_price_currency: (row.last_price_currency as string | null) ?? null,
    last_checked_at: (row.last_checked_at as string | null) ?? null,
    last_success_at: (row.last_success_at as string | null) ?? null,
    confidence_score: Number(row.confidence_score) || 0,
    failure_count: Number(row.failure_count) || 0,
    check_interval_hours: Number(row.check_interval_hours) || 24,
    custom_selectors: (row.custom_selectors as JsonObject | null) ?? {},
    notes: (row.notes as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    product: row.product ? mapProduct(row.product as JsonObject) : undefined,
    source_site: row.source_site ? mapSourceSite(row.source_site as JsonObject) : undefined,
  };
}

function mapPricingRule(row: JsonObject): PricingRule {
  return {
    id: row.id as string,
    name: row.name as string,
    rule_type: row.rule_type as PricingRule["rule_type"],
    target_id: (row.target_id as string | null) ?? null,
    product_id: (row.product_id as string | null) ?? null,
    margin_percent: row.margin_percent != null ? Number(row.margin_percent) : null,
    min_margin_amount: row.min_margin_amount != null ? Number(row.min_margin_amount) : null,
    max_price: row.max_price != null ? Number(row.max_price) : null,
    min_price: row.min_price != null ? Number(row.min_price) : null,
    rounding_strategy: row.rounding_strategy as PricingRule["rounding_strategy"],
    priority: Number(row.priority) || 0,
    is_active: (row.is_active as boolean) ?? true,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapPriceAlert(row: JsonObject): PriceAlertWithRelations {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    source_id: (row.source_id as string | null) ?? null,
    alert_type: row.alert_type as string,
    severity: row.severity as PriceAlert["severity"],
    message: row.message as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    is_read: (row.is_read as boolean) ?? false,
    is_resolved: (row.is_resolved as boolean) ?? false,
    resolved_by: (row.resolved_by as string | null) ?? null,
    resolved_at: (row.resolved_at as string | null) ?? null,
    created_at: row.created_at as string,
    product: row.product ? mapProduct(row.product as JsonObject) : undefined,
    source: row.source ? mapPriceSource(row.source as JsonObject) : undefined,
  };
}

function mapPriceHistory(row: JsonObject): PricingHistoryRow {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    source_id: (row.source_id as string | null) ?? null,
    price_type: row.price_type as PricingHistoryRow["price_type"],
    old_price: row.old_price != null ? Number(row.old_price) : null,
    new_price: Number(row.new_price) || 0,
    currency: (row.currency as string | null) ?? null,
    change_percent: row.change_percent != null ? Number(row.change_percent) : null,
    change_reason: (row.change_reason as string | null) ?? null,
    changed_by: (row.changed_by as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
    product: row.product ? mapProduct(row.product as JsonObject) : undefined,
    source: row.source ? mapPriceSource(row.source as JsonObject) : undefined,
  };
}

function mapPricingDecision(row: JsonObject): PricingDecisionWithRelations {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    selected_source_id: (row.selected_source_id as string | null) ?? null,
    source_price: row.source_price != null ? Number(row.source_price) : null,
    source_currency: (row.source_currency as string | null) ?? null,
    applied_rule_id: (row.applied_rule_id as string | null) ?? null,
    margin_percent_applied: row.margin_percent_applied != null ? Number(row.margin_percent_applied) : null,
    calculated_price: row.calculated_price != null ? Number(row.calculated_price) : null,
    final_price: row.final_price != null ? Number(row.final_price) : null,
    decision_type: row.decision_type as PricingDecision["decision_type"],
    confidence_at_decision: row.confidence_at_decision != null ? Number(row.confidence_at_decision) : null,
    rejection_reasons: Array.isArray(row.rejection_reasons) ? (row.rejection_reasons as string[]) : [],
    was_price_locked: (row.was_price_locked as boolean) ?? false,
    price_actually_updated: (row.price_actually_updated as boolean) ?? false,
    decided_by: (row.decided_by as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
    product: row.product ? mapProduct(row.product as JsonObject) : undefined,
    source: row.source ? mapPriceSource(row.source as JsonObject) : undefined,
    applied_rule: row.applied_rule ? mapPricingRule(row.applied_rule as JsonObject) : null,
  };
}

function mapPricingJob(row: JsonObject): PricingJob {
  return {
    id: row.id as string,
    type: row.type as PricingJob["type"],
    status: row.status as PricingJob["status"],
    started_at: (row.started_at as string | null) ?? null,
    finished_at: (row.finished_at as string | null) ?? null,
    total_items: Number(row.total_items) || 0,
    processed_items: Number(row.processed_items) || 0,
    success_count: Number(row.success_count) || 0,
    failure_count: Number(row.failure_count) || 0,
    skipped_count: Number(row.skipped_count) || 0,
    triggered_by: (row.triggered_by as string | null) ?? null,
    filters: (row.filters as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at as string,
  };
}

function mapSourceScrapeLog(row: JsonObject): SourceScrapeLogWithRelations {
  return {
    id: row.id as string,
    source_id: row.source_id as string,
    status: row.status as SourceScrapeLog["status"],
    http_status: row.http_status != null ? Number(row.http_status) : null,
    response_time_ms: row.response_time_ms != null ? Number(row.response_time_ms) : null,
    extractor_used: (row.extractor_used as string | null) ?? null,
    extracted_price: row.extracted_price != null ? Number(row.extracted_price) : null,
    extracted_title: (row.extracted_title as string | null) ?? null,
    extracted_brand: (row.extracted_brand as string | null) ?? null,
    extracted_sku: (row.extracted_sku as string | null) ?? null,
    title_match_score: row.title_match_score != null ? Number(row.title_match_score) : null,
    error_message: (row.error_message as string | null) ?? null,
    raw_html_snippet: (row.raw_html_snippet as string | null) ?? null,
    created_at: row.created_at as string,
    source: row.source ? mapPriceSource(row.source as JsonObject) : undefined,
  };
}

export async function getPricingSourceById(
  supabase: DbClient,
  sourceId: string
): Promise<PriceSourceWithRelations | null> {
  const { data, error } = await supabase
    .from("price_sources")
    .select(`
      *,
      product:products(*),
      source_site:source_sites(*)
    `)
    .eq("id", sourceId)
    .single();

  if (error || !data) return null;
  return mapPriceSource(data as JsonObject);
}

export async function getPricingSourcesByProduct(
  supabase: DbClient,
  productId: string
): Promise<PriceSourceWithRelations[]> {
  const { data, error } = await supabase
    .from("price_sources")
    .select(`
      *,
      product:products(*),
      source_site:source_sites(*)
    `)
    .eq("product_id", productId)
    .order("confidence_score", { ascending: false });

  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPriceSource);
}

export async function getApplicablePricingRule(
  supabase: DbClient,
  product: Pick<Product, "id" | "category_id" | "brand_id">
): Promise<PricingRule | null> {
  const { data, error } = await supabase
    .from("pricing_rules")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error || !data) return null;

  const rows = data as JsonObject[];
  const productRule = rows.find((row) => row.rule_type === "product" && row.product_id === product.id);
  if (productRule) return mapPricingRule(productRule);

  const categoryRule = rows.find((row) => row.rule_type === "category" && row.target_id === product.category_id);
  if (categoryRule) return mapPricingRule(categoryRule);

  const brandRule = rows.find((row) => row.rule_type === "brand" && row.target_id === product.brand_id);
  if (brandRule) return mapPricingRule(brandRule);

  const globalRule = rows.find((row) => row.rule_type === "global");
  return globalRule ? mapPricingRule(globalRule) : null;
}

export async function countRecentSuccessfulScrapes(
  supabase: DbClient,
  sourceId: string,
  days = 7
): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("source_scrape_logs")
    .select("id", { head: true, count: "exact" })
    .eq("source_id", sourceId)
    .eq("status", "success")
    .gte("created_at", cutoff);

  return count ?? 0;
}

export async function getFallbackCandidates(
  supabase: DbClient,
  productId: string,
  excludeSourceId?: string
): Promise<PriceSourceWithRelations[]> {
  let query = supabase
    .from("price_sources")
    .select(`
      *,
      product:products(*),
      source_site:source_sites(*)
    `)
    .eq("product_id", productId)
    .in("status", ["active", "fallback_candidate"])
    .eq("match_verified", true)
    .gte("confidence_score", 80)
    .lt("failure_count", 3)
    .order("confidence_score", { ascending: false });

  if (excludeSourceId) {
    query = query.neq("id", excludeSourceId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPriceSource);
}

export async function getManualFxRates(supabase: DbClient): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "pricing_fx_rates")
    .maybeSingle();

  const raw = (data?.value as Record<string, unknown> | null) ?? {};
  return {
    TRY: 1,
    USD: Number(raw.USD) || 1,
    EUR: Number(raw.EUR) || 1,
    GBP: Number(raw.GBP) || 1,
  };
}

export async function listPricingSources(
  supabase: DbClient,
  filters: {
    productId?: string;
    siteId?: string;
    status?: string;
    search?: string;
    selectedOnly?: boolean;
    manualReviewRequired?: boolean;
    verificationMethod?: string;
    confidenceMin?: number;
    confidenceMax?: number;
  } = {}
): Promise<PriceSourceWithRelations[]> {
  let query = supabase
    .from("price_sources")
    .select(`
      *,
      product:products(*),
      source_site:source_sites(*)
    `)
    .order("last_checked_at", { ascending: false, nullsFirst: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.siteId) query = query.eq("source_site_id", filters.siteId);
  if (filters.status) query = query.eq("status", filters.status);
  if (typeof filters.manualReviewRequired === "boolean") {
    query = query.eq("manual_review_required", filters.manualReviewRequired);
  }
  if (filters.verificationMethod) {
    query = query.eq("verification_method", filters.verificationMethod);
  }
  if (typeof filters.confidenceMin === "number") query = query.gte("confidence_score", filters.confidenceMin);
  if (typeof filters.confidenceMax === "number") query = query.lte("confidence_score", filters.confidenceMax);

  const { data, error } = await query;
  if (error || !data) return [];

  let rows = (data as JsonObject[]).map(mapPriceSource);

  if (filters.selectedOnly) {
    rows = rows.filter((row) => row.product?.price_source_id === row.id);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((row) =>
      row.product?.name.toLowerCase().includes(q) ||
      row.product?.sku.toLowerCase().includes(q) ||
      row.source_title?.toLowerCase().includes(q) ||
      row.source_site?.name.toLowerCase().includes(q)
    );
  }

  return rows;
}

export async function listSourceSites(supabase: DbClient): Promise<SourceSite[]> {
  const { data, error } = await supabase
    .from("source_sites")
    .select("*")
    .order("priority", { ascending: true });

  if (error || !data) return [];
  return (data as JsonObject[]).map(mapSourceSite);
}

export async function listPricingRules(
  supabase: DbClient,
  filters: { productId?: string; ruleType?: string; targetId?: string } = {}
): Promise<PricingRule[]> {
  let query = supabase.from("pricing_rules").select("*").order("priority", { ascending: false });
  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.ruleType) query = query.eq("rule_type", filters.ruleType);
  if (filters.targetId) query = query.eq("target_id", filters.targetId);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPricingRule);
}

export async function listPriceAlerts(
  supabase: DbClient,
  filters: { productId?: string; severity?: string; unresolvedOnly?: boolean; alertType?: string } = {}
): Promise<PriceAlertWithRelations[]> {
  let query = supabase
    .from("price_alerts")
    .select(`
      *,
      product:products(*),
      source:price_sources(*, product:products(*), source_site:source_sites(*))
    `)
    .order("created_at", { ascending: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.severity) query = query.eq("severity", filters.severity);
  if (filters.alertType) query = query.eq("alert_type", filters.alertType);
  if (filters.unresolvedOnly) query = query.eq("is_resolved", false);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPriceAlert);
}

export async function listPriceHistory(
  supabase: DbClient,
  filters: { productId?: string; priceType?: string } = {}
): Promise<PricingHistoryRow[]> {
  let query = supabase
    .from("price_history")
    .select(`
      *,
      product:products(*),
      source:price_sources(*, product:products(*), source_site:source_sites(*))
    `)
    .order("created_at", { ascending: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.priceType) query = query.eq("price_type", filters.priceType);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPriceHistory);
}

export async function listPricingDecisions(
  supabase: DbClient,
  filters: { productId?: string } = {}
): Promise<PricingDecisionWithRelations[]> {
  let query = supabase
    .from("pricing_decisions")
    .select(`
      *,
      product:products(*),
      source:price_sources(*, product:products(*), source_site:source_sites(*)),
      applied_rule:pricing_rules(*)
    `)
    .order("created_at", { ascending: false });

  if (filters.productId) query = query.eq("product_id", filters.productId);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPricingDecision);
}

export async function listPricingJobs(
  supabase: DbClient,
  filters: {
    status?: string;
    type?: string;
    limit?: number;
  } = {}
): Promise<PricingJob[]> {
  let query = supabase
    .from("pricing_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as JsonObject[]).map(mapPricingJob);
}

export async function getPricingJobById(
  supabase: DbClient,
  jobId: string
): Promise<PricingJob | null> {
  const { data, error } = await supabase
    .from("pricing_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) return null;
  return mapPricingJob(data as JsonObject);
}

export async function listSourceScrapeLogs(
  supabase: DbClient,
  sourceId: string
): Promise<SourceScrapeLogWithRelations[]> {
  const { data, error } = await supabase
    .from("source_scrape_logs")
    .select(`
      *,
      source:price_sources(*, product:products(*), source_site:source_sites(*))
    `)
    .eq("source_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return (data as JsonObject[]).map(mapSourceScrapeLog);
}

export async function getPricingDashboard(supabase: DbClient): Promise<PricingDashboardData> {
  const [sources, alerts, sites, jobs] = await Promise.all([
    listPricingSources(supabase),
    listPriceAlerts(supabase, { unresolvedOnly: true }),
    listSourceSites(supabase),
    listPricingJobs(supabase),
  ]);

  const activeSources = sources.filter((source) => source.status === "active");
  const averageConfidence =
    sources.length > 0
      ? Number(
          (
            sources.reduce((sum, source) => sum + Number(source.confidence_score || 0), 0) / sources.length
          ).toFixed(1)
        )
      : 0;

  const lastUpdateAt = sources
    .map((source) => source.last_checked_at)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return {
    activeSourceCount: activeSources.length,
    averageConfidence,
    manualReviewCount: sources.filter((source) => source.manual_review_required).length,
    activeAlertCount: alerts.length,
    lastUpdateAt,
    siteHealth: sites,
    recentJobs: jobs.slice(0, 10),
    runningJobCount: jobs.filter((job) => job.status === "running").length,
    lastBatchResult: jobs.find((job) => job.status === "completed") ?? null,
    lastFailedJob: jobs.find((job) => job.status === "failed") ?? null,
  };
}
