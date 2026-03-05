// ==========================================
// mutations.ts — Admin Write Operations
// DEMO_MODE: kapalı (hata döner)
// ==========================================

import type { Product } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

// ==========================================
// ENVIRONMENT
// ==========================================

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ==========================================
// TYPES
// ==========================================

interface MutationResult<T = null> {
  data: T;
  error: string | null;
}

type ProductInput = Omit<Product, "id" | "created_at" | "updated_at" | "category" | "brand">;
type ProductUpdate = Partial<ProductInput>;

// ==========================================
// SUPABASE CLIENT
// ==========================================

function getSupabase() {
  return createClient();
}

// ==========================================
// DEMO GUARD
// ==========================================

const DEMO_ERROR = "Demo modda DB yazma devre dışı";

// ==========================================
// PRODUCT MUTATIONS
// ==========================================

export async function createProduct(input: ProductInput): Promise<MutationResult<Product | null>> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.warn("mutation_blocked", { fn: "createProduct", demo: true, ms: performance.now() - start });
    return { data: null, error: DEMO_ERROR };
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select("*, category:categories(*), brand:brands(*)")
    .single();

  if (error) {
    logger.error("mutation_failed", { fn: "createProduct", error: error.message, ms: performance.now() - start });
    return { data: null, error: error.message };
  }

  logger.info("mutation_ok", { fn: "createProduct", ms: performance.now() - start });
  return { data: data as unknown as Product, error: null };
}

export async function updateProduct(id: string, updates: ProductUpdate): Promise<MutationResult> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.warn("mutation_blocked", { fn: "updateProduct", demo: true, ms: performance.now() - start });
    return { data: null, error: DEMO_ERROR };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "updateProduct", error: error.message, ms: performance.now() - start });
    return { data: null, error: error.message };
  }

  logger.info("mutation_ok", { fn: "updateProduct", ms: performance.now() - start });
  return { data: null, error: null };
}

export async function softDeleteProduct(id: string): Promise<MutationResult> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.warn("mutation_blocked", { fn: "softDeleteProduct", demo: true, ms: performance.now() - start });
    return { data: null, error: DEMO_ERROR };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) {
    logger.error("mutation_failed", { fn: "softDeleteProduct", error: error.message, ms: performance.now() - start });
    return { data: null, error: error.message };
  }

  logger.info("mutation_ok", { fn: "softDeleteProduct", ms: performance.now() - start });
  return { data: null, error: null };
}
