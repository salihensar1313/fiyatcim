// ============================================================
// CimBot V2 — Dynamic Product Query Engine
// Supabase-powered product search for chatbot
// ============================================================

import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";
import type { ProductFilters } from "../types";
import { logger } from "@/lib/logger";

function mapProduct(row: Record<string, unknown>): Product {
  const images = row.images;
  const specs = row.specs;
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
    stock: (row.stock as number) ?? 0,
    critical_stock: (row.critical_stock as number) ?? 5,
    tax_rate: Number(row.tax_rate) ?? 20,
    warranty_months: (row.warranty_months as number) ?? 24,
    shipping_type: (row.shipping_type as "kargo" | "kurulum") ?? "kargo",
    is_active: (row.is_active as boolean) ?? true,
    deleted_at: (row.deleted_at as string | null) ?? null,
    short_desc: (row.short_desc as string) ?? "",
    description: (row.description as string) ?? "",
    specs: (typeof specs === "object" && specs !== null ? specs : {}) as Record<string, string>,
    images: Array.isArray(images) ? (images as string[]) : [],
    seo_title: (row.seo_title as string) ?? "",
    is_featured: (row.is_featured as boolean) ?? false,
    is_trending: (row.is_trending as boolean) ?? false,
    seo_desc: (row.seo_desc as string) ?? "",
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: row.updated_at as string | undefined,
    category: row.category
      ? {
          id: (row.category as Record<string, unknown>).id as string,
          name: (row.category as Record<string, unknown>).name as string,
          slug: (row.category as Record<string, unknown>).slug as string,
          image_url: ((row.category as Record<string, unknown>).image_url as string) ?? "",
          sort_order: ((row.category as Record<string, unknown>).sort_order as number) ?? 0,
          created_at: ((row.category as Record<string, unknown>).created_at as string) ?? "",
        }
      : undefined,
    brand: row.brand
      ? {
          id: (row.brand as Record<string, unknown>).id as string,
          name: (row.brand as Record<string, unknown>).name as string,
          slug: (row.brand as Record<string, unknown>).slug as string,
          logo_url: ((row.brand as Record<string, unknown>).logo_url as string) ?? "",
          created_at: ((row.brand as Record<string, unknown>).created_at as string) ?? "",
        }
      : undefined,
  };
}

// ─── Query Products with Filters ───
export async function queryProducts(filters: ProductFilters): Promise<Product[]> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0);

  // Budget filter
  if (filters.budget) {
    const effectivePrice = filters.budget.max || filters.budget.exact;
    if (effectivePrice) {
      query = query.lte("price", effectivePrice);
    }
    if (filters.budget.min) {
      query = query.gte("price", filters.budget.min);
    }
  }

  // Category filter
  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  // Brand filter
  if (filters.brandSlug) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", filters.brandSlug)
      .single();
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }

  // On sale filter
  if (filters.onSale) {
    query = query.not("sale_price", "is", null);
  }

  // Text search (in name)
  if (filters.searchText) {
    query = query.ilike("name", `%${filters.searchText}%`);
  }

  // Exclude IDs
  if (filters.excludeIds && filters.excludeIds.length > 0) {
    for (const id of filters.excludeIds) {
      query = query.neq("id", id);
    }
  }

  // Offset (pagination)
  if (filters.offset && filters.offset > 0) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 4) - 1);
  }

  // Sorting
  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "best_value":
      query = query.order("sale_price", { ascending: true, nullsFirst: false })
        .order("price", { ascending: true });
      break;
    case "random": {
      // Fetch more, then shuffle client-side
      const limit = filters.limit || 4;
      query = query.limit(limit * 3); // fetch 3x, then pick random
      const { data, error } = await query;
      if (error || !data) return [];
      // Fisher-Yates shuffle
      const arr = data.map(mapProduct);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, limit);
    }
    default:
      query = query.order("created_at", { ascending: false });
  }

  query = query.limit(filters.limit || 4);

  const { data, error } = await query;

  if (error) {
    logger.error("cimbot_product_query_failed", { fn: "queryProducts", error: error.message });
    return [];
  }

  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

// ─── Get Products by Budget (Smart) ───
export async function getProductsByBudget(
  budget: number,
  categorySlug?: string,
  brandSlug?: string,
  limit = 4
): Promise<{ withinBudget: Product[]; slightlyAbove: Product[] }> {
  // Within budget
  const withinBudget = await queryProducts({
    budget: { max: budget },
    categorySlug,
    brandSlug,
    sort: "price_desc", // Most expensive within budget = best value
    limit,
  });

  // Slightly above budget (+30%) for upsell
  const slightlyAbove = await queryProducts({
    budget: { min: budget, max: budget * 1.3 },
    categorySlug,
    brandSlug,
    sort: "price_asc",
    limit: 2,
    excludeIds: withinBudget.map((p) => p.id),
  });

  return { withinBudget, slightlyAbove };
}

// ─── Get Discounted Products ───
export async function getDiscountedProducts(
  categorySlug?: string,
  limit = 4
): Promise<Product[]> {
  return queryProducts({
    onSale: true,
    categorySlug,
    sort: "best_value",
    limit,
  });
}

// ─── Get Popular Products ───
export async function getPopularProducts(
  categorySlug?: string,
  limit = 4
): Promise<Product[]> {
  return queryProducts({
    categorySlug,
    sort: "popular",
    limit,
  });
}

// ─── Get Cheaper Alternatives ───
export async function getCheaperAlternatives(
  currentProducts: Product[],
  categorySlug?: string,
  limit = 4
): Promise<Product[]> {
  if (currentProducts.length === 0) return [];
  const lowestPrice = Math.min(...currentProducts.map((p) => p.sale_price || p.price));
  return queryProducts({
    budget: { max: lowestPrice * 0.8 },
    categorySlug,
    sort: "price_desc",
    limit,
    excludeIds: currentProducts.map((p) => p.id),
  });
}

// ─── Get More Expensive Alternatives ───
export async function getExpensiveAlternatives(
  currentProducts: Product[],
  categorySlug?: string,
  limit = 4
): Promise<Product[]> {
  if (currentProducts.length === 0) return [];
  const highestPrice = Math.max(...currentProducts.map((p) => p.sale_price || p.price));
  return queryProducts({
    budget: { min: highestPrice * 1.1 },
    categorySlug,
    sort: "price_asc",
    limit,
    excludeIds: currentProducts.map((p) => p.id),
  });
}

// ─── Get Package Deal (camera+NVR, alarm+sensors) ───
export async function getPackageDeal(
  categorySlug: string,
  budget?: number,
  limit = 2
): Promise<{ main: Product[]; complementary: Product[] }> {
  const complementaryCategory = getComplementaryCategory(categorySlug);
  if (!complementaryCategory) return { main: [], complementary: [] };

  const mainBudget = budget ? budget * 0.7 : undefined; // 70% for main
  const compBudget = budget ? budget * 0.3 : undefined;  // 30% for complementary

  // For cameras, exclude NVR from main results
  const mainSearchExclude = categorySlug === "guvenlik-kameralari" ? undefined : undefined;
  const main = await queryProducts({
    categorySlug,
    budget: mainBudget ? { max: mainBudget } : undefined,
    sort: "random",
    limit,
    searchText: mainSearchExclude,
  });

  const complementary = await queryProducts({
    categorySlug: complementaryCategory.slug,
    budget: compBudget ? { max: compBudget } : undefined,
    sort: "random",
    limit,
    searchText: complementaryCategory.searchText,
    excludeIds: main.map((p) => p.id),
  });

  return { main, complementary };
}

function getComplementaryCategory(slug: string): { slug: string; searchText?: string } | null {
  // Complementary categories for package deals
  // NVR products are in "guvenlik-kameralari" category, so we use searchText to differentiate
  const map: Record<string, { slug: string; searchText?: string }> = {
    "guvenlik-kameralari": { slug: "guvenlik-kameralari", searchText: "NVR" }, // cameras + NVR
    "alarm-sistemleri": { slug: "akilli-kilit" },         // alarm + smart lock
    "akilli-kilit": { slug: "alarm-sistemleri" },         // smart lock + alarm
    "akilli-ev-sistemleri": { slug: "alarm-sistemleri" }, // smart home + alarm
    "yangin-algilama": { slug: "alarm-sistemleri" },      // fire detection + alarm
  };
  return map[slug] || null;
}

// ─── Check Stock by Product Name (fuzzy) ───
export async function checkStockByName(productName: string): Promise<{ product: Product | null; inStock: boolean }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .ilike("name", `%${productName}%`)
    .limit(1);

  if (!data || data.length === 0) return { product: null, inStock: false };
  const product = mapProduct(data[0] as Record<string, unknown>);
  return { product, inStock: product.stock > 0 };
}

// ─── Format Price ───
export function formatPriceTR(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace("TRY", "₺").trim();
}
