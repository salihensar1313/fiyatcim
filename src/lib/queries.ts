// ==========================================
// queries.ts — Production-Grade Data Layer
// DEMO_MODE branching + environment-aware fallback
// ==========================================

import type {
  Category,
  Brand,
  Product,
  BlogPost,
  FAQ,
  HeroSlide,
  Testimonial,
  TrustBadge,
  Coupon,
  Review,
} from "@/types";
import {
  categories as seedCategories,
  brands as seedBrands,
  products as seedProducts,
  heroSlides as seedHeroSlides,
  testimonials as seedTestimonials,
  blogPosts as seedBlogPosts,
  faqs as seedFaqs,
} from "@/data/seed";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { PAGINATION } from "@/lib/constants";

// ==========================================
// ENVIRONMENT
// ==========================================

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const IS_PROD = process.env.NODE_ENV === "production" && !IS_DEMO;

// Deploy safety: loud warning if prod + demo
if (typeof window === "undefined" && process.env.NODE_ENV === "production" && IS_DEMO) {
  console.error("⚠️  CRITICAL: DEMO_MODE=true in production build!");
}

// ==========================================
// SUPABASE CLIENT (lazy)
// ==========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(client?: SupabaseClient<any, any, any>) {
  return client ?? createClient();
}

// ==========================================
// SEED TRUST BADGES (no export in seed.ts)
// ==========================================

const seedTrustBadges: TrustBadge[] = [
  { id: "tb-1", title: "Ücretsiz Kargo", description: "2.000₺ üzeri siparişlerde ücretsiz kargo", icon: "Truck", sort_order: 0 },
  { id: "tb-2", title: "Güvenli Ödeme", description: "256-bit SSL ile güvenli ödeme altyapısı", icon: "ShieldCheck", sort_order: 1 },
  { id: "tb-3", title: "7/24 Destek", description: "Teknik destek hattımız her zaman açık", icon: "Headphones", sort_order: 2 },
  { id: "tb-4", title: "2 Yıl Garanti", description: "Tüm ürünlerde minimum 2 yıl garanti", icon: "Award", sort_order: 3 },
];

// ==========================================
// MAPPERS — DB row → TypeScript type
// ==========================================

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    image_url: (row.image_url as string) ?? "",
    icon: (row.icon as string) ?? undefined,
    sort_order: (row.sort_order as number) ?? 0,
    created_at: (row.created_at as string) ?? (row.updated_at as string) ?? new Date().toISOString(),
    updated_at: row.updated_at as string | undefined,
  };
}

function mapBrand(row: Record<string, unknown>): Brand {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    logo_url: (row.logo_url as string) ?? "",
    created_at: (row.created_at as string) ?? (row.updated_at as string) ?? new Date().toISOString(),
    updated_at: row.updated_at as string | undefined,
  };
}

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
    cost_price: row.cost_price != null ? Number(row.cost_price) : null,
    cost_currency: (row.cost_currency as string | null) ?? null,
    price_source_id: (row.price_source_id as string | null) ?? null,
    price_locked: (row.price_locked as boolean) ?? false,
    last_price_update: (row.last_price_update as string | null) ?? null,
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
    // Joined fields
    category: row.category ? mapCategory(row.category as Record<string, unknown>) : undefined,
    brand: row.brand ? mapBrand(row.brand as Record<string, unknown>) : undefined,
  };
}

function mapBlogPost(row: Record<string, unknown>): BlogPost {
  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: (row.excerpt as string) ?? "",
    content: (row.content as string) ?? "",
    image: (row.image as string) ?? "",
    category: (row.category as string) ?? "",
    created_at: (row.created_at as string) ?? new Date().toISOString(),
  };
}

function mapFaq(row: Record<string, unknown>): FAQ {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
    category: (row.category as string) ?? "genel",
  };
}

function mapHeroSlide(row: Record<string, unknown>): HeroSlide {
  return {
    id: row.id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? "",
    image: (row.image as string) ?? "",
    cta_text: (row.cta_text as string) ?? "",
    cta_link: (row.cta_link as string) ?? "/urunler",
  };
}

function mapTestimonial(row: Record<string, unknown>): Testimonial {
  return {
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string) ?? "",
    comment: row.comment as string,
    rating: (row.rating as number) ?? 5,
    avatar: row.avatar as string | undefined,
  };
}

function mapTrustBadge(row: Record<string, unknown>): TrustBadge {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    icon: (row.icon as string) ?? "ShieldCheck",
    sort_order: (row.sort_order as number) ?? 0,
  };
}

function mapCoupon(row: Record<string, unknown>): Coupon {
  return {
    id: row.id as string,
    code: row.code as string,
    type: row.type as "percent" | "fixed",
    value: Number(row.value) || 0,
    min_cart: Number(row.min_cart) || 0,
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: (row.used_count as number) ?? 0,
    active: (row.active as boolean) ?? true,
    expiry: (row.expiry as string | null) ?? null,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: row.updated_at as string | undefined,
  };
}

// ==========================================
// SEED HELPERS (Demo mode filtering)
// ==========================================

function enrichSeedProduct(p: Product): Product {
  return {
    ...p,
    category: seedCategories.find((c) => c.id === p.category_id),
    brand: seedBrands.find((b) => b.id === p.brand_id),
  };
}

function activeSeedProducts(): Product[] {
  return seedProducts
    .filter((p) => p.is_active && !p.deleted_at && p.stock > 0)
    .map(enrichSeedProduct);
}

interface ProductQueryOpts {
  page?: number;
  limit?: number;
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
}

function filterSeedProducts(opts: ProductQueryOpts = {}): { data: Product[]; total: number } {
  const { page = 1, limit = PAGINATION.products_per_page, categorySlug, brandSlug, search, sort } = opts;

  let filtered = activeSeedProducts();

  if (categorySlug) {
    const cat = seedCategories.find((c) => c.slug === categorySlug);
    if (cat) filtered = filtered.filter((p) => p.category_id === cat.id);
  }

  if (brandSlug) {
    const brand = seedBrands.find((b) => b.slug === brandSlug);
    if (brand) filtered = filtered.filter((p) => p.brand_id === brand.id);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short_desc.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sort === "price_asc") {
    filtered.sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
  } else if (sort === "price_desc") {
    filtered.sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
  } else if (sort === "newest") {
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  // "popular" → default order

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);

  return { data, total };
}

// ==========================================
// QUERY FUNCTIONS
// ==========================================

// Client-side dedup cache: multiple components calling getCategories share one request
let _categoriesCache: { promise: Promise<Category[]>; ts: number } | null = null;
const CACHE_TTL = 30_000; // 30s

export async function getCategories(client?: SupabaseClient): Promise<Category[]> {
  // Server-side (with explicit client) always fetches fresh
  if (client) return _getCategoriesImpl(client);

  // Client-side dedup: reuse in-flight or recent result
  const now = Date.now();
  if (_categoriesCache && now - _categoriesCache.ts < CACHE_TTL) {
    return _categoriesCache.promise;
  }
  const promise = _getCategoriesImpl();
  _categoriesCache = { promise, ts: now };
  // Clear cache on error so next call retries
  promise.catch(() => { _categoriesCache = null; });
  return promise;
}

async function _getCategoriesImpl(client?: SupabaseClient): Promise<Category[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getCategories", demo: true, rows: seedCategories.length, ms: performance.now() - start });
    return seedCategories;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getCategories", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getCategories failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getCategories" });
    return seedCategories;
  }

  const result = (data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getCategories", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getBrands(client?: SupabaseClient): Promise<Brand[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getBrands", demo: true, rows: seedBrands.length, ms: performance.now() - start });
    return seedBrands;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getBrands", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getBrands failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getBrands" });
    return seedBrands;
  }

  const result = (data ?? []).map((row) => mapBrand(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getBrands", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getProducts(opts: ProductQueryOpts = {}): Promise<{ data: Product[]; total: number }> {
  const start = performance.now();
  const { page = 1, limit = PAGINATION.products_per_page, categorySlug, brandSlug, search, sort } = opts;

  if (IS_DEMO) {
    const result = filterSeedProducts(opts);
    logger.info("query_ok", { fn: "getProducts", demo: true, rows: result.data.length, total: result.total, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)", { count: "exact" })
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0);

  if (categorySlug) {
    // Subquery: category slug → filter by category_id
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", categorySlug).single();
    if (cat) query = query.eq("category_id", cat.id);
    else return { data: [], total: 0 };
  }

  if (brandSlug) {
    const { data: brand } = await supabase.from("brands").select("id").eq("slug", brandSlug).single();
    if (brand) query = query.eq("brand_id", brand.id);
    else return { data: [], total: 0 };
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,short_desc.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  // Sort
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else if (sort === "newest") query = query.order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    logger.error("query_failed", { fn: "getProducts", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getProducts failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getProducts" });
    return filterSeedProducts(opts);
  }

  const products = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  const total = count ?? 0;
  logger.info("query_ok", { fn: "getProducts", rows: products.length, total, ms: performance.now() - start });
  return { data: products, total };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const start = performance.now();

  if (IS_DEMO) {
    const found = seedProducts.find((p) => p.slug === slug && p.is_active && !p.deleted_at);
    const result = found ? enrichSeedProduct(found) : null;
    logger.info("query_ok", { fn: "getProductBySlug", demo: true, rows: result ? 1 : 0, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found — not a real error
      logger.info("query_ok", { fn: "getProductBySlug", rows: 0, ms: performance.now() - start });
      return null;
    }
    logger.error("query_failed", { fn: "getProductBySlug", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getProductBySlug failed: ${error.message}`);
    const fallback = seedProducts.find((p) => p.slug === slug && p.is_active && !p.deleted_at);
    return fallback ? enrichSeedProduct(fallback) : null;
  }

  const result = data ? mapProduct(data as Record<string, unknown>) : null;
  logger.info("query_ok", { fn: "getProductBySlug", rows: result ? 1 : 0, ms: performance.now() - start });
  return result;
}

export async function getProductsByCategory(
  categorySlug: string,
  opts: { page?: number; limit?: number } = {}
): Promise<{ data: Product[]; total: number }> {
  return getProducts({ ...opts, categorySlug });
}

export async function getFeaturedProducts(limit = 8, client?: SupabaseClient): Promise<Product[]> {
  const start = performance.now();

  if (IS_DEMO) {
    // Once is_featured urunler, yoksa sale_price fallback
    let result = seedProducts
      .filter((p) => p.is_active && !p.deleted_at && p.stock > 0 && p.is_featured)
      .slice(0, limit)
      .map(enrichSeedProduct);
    if (result.length === 0) {
      result = seedProducts
        .filter((p) => p.is_active && !p.deleted_at && p.stock > 0 && p.sale_price)
        .slice(0, limit)
        .map(enrichSeedProduct);
    }
    logger.info("query_ok", { fn: "getFeaturedProducts", demo: true, rows: result.length, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase(client);

  // Once is_featured=true urunleri dene
  const { data: featuredData, error: featuredError } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!featuredError && featuredData && featuredData.length > 0) {
    const result = featuredData.map((row) => mapProduct(row as Record<string, unknown>));
    logger.info("query_ok", { fn: "getFeaturedProducts", rows: result.length, featured: true, ms: performance.now() - start });
    return result;
  }

  // Fallback: sale_price olan urunler
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0)
    .not("sale_price", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("query_failed", { fn: "getFeaturedProducts", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getFeaturedProducts failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getFeaturedProducts" });
    return seedProducts.filter((p) => p.is_active && !p.deleted_at && p.stock > 0 && p.sale_price).slice(0, limit).map(enrichSeedProduct);
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getFeaturedProducts", rows: result.length, ms: performance.now() - start });
  return result;
}

/**
 * Rastgele ürünler — Ana sayfada "Keşfet" bölümü
 * Her sayfa yenilemesinde farklı ürünler gösterir
 */
export async function getRandomProducts(limit = 12, client?: SupabaseClient): Promise<Product[]> {
  const start = performance.now();

  if (IS_DEMO) {
    const active = seedProducts.filter((p) => p.is_active && !p.deleted_at && p.stock > 0);
    // Fisher-Yates shuffle
    const shuffled = [...active];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const result = shuffled.slice(0, limit).map(enrichSeedProduct);
    logger.info("query_ok", { fn: "getRandomProducts", demo: true, rows: result.length, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase(client);

  // Supabase doesn't have RANDOM(), so fetch more and shuffle client-side
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0)
    .limit(limit * 3); // fetch more for better randomness

  if (error || !data || data.length === 0) {
    logger.warn("query_fail", { fn: "getRandomProducts", error: error?.message });
    const active = seedProducts.filter((p) => p.is_active && !p.deleted_at && p.stock > 0);
    const shuffled = [...active].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit).map(enrichSeedProduct);
  }

  // Shuffle and take limit
  const all = data.map((row) => mapProduct(row as Record<string, unknown>));
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const result = shuffled.slice(0, limit);
  logger.info("query_ok", { fn: "getRandomProducts", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getTrendingProducts(limit = 8, client?: SupabaseClient): Promise<Product[]> {
  const start = performance.now();

  if (IS_DEMO) {
    const result = seedProducts
      .filter((p) => p.is_active && !p.deleted_at && p.stock > 0 && p.is_trending)
      .slice(0, limit)
      .map(enrichSeedProduct);
    logger.info("query_ok", { fn: "getTrendingProducts", demo: true, rows: result.length, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .gt("stock", 0)
    .eq("is_trending", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("query_failed", { fn: "getTrendingProducts", error: error.message, ms: performance.now() - start });
    return [];
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getTrendingProducts", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4): Promise<Product[]> {
  const start = performance.now();

  if (IS_DEMO) {
    const result = seedProducts
      .filter((p) => p.id !== productId && p.category_id === categoryId && p.is_active && !p.deleted_at)
      .slice(0, limit)
      .map(enrichSeedProduct);
    logger.info("query_ok", { fn: "getRelatedProducts", demo: true, rows: result.length, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .eq("category_id", categoryId)
    .neq("id", productId)
    .limit(limit);

  if (error) {
    logger.error("query_failed", { fn: "getRelatedProducts", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getRelatedProducts failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getRelatedProducts" });
    return seedProducts.filter((p) => p.id !== productId && p.category_id === categoryId && p.is_active && !p.deleted_at).slice(0, limit).map(enrichSeedProduct);
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getRelatedProducts", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getBlogPosts(client?: SupabaseClient): Promise<BlogPost[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getBlogPosts", demo: true, rows: seedBlogPosts.length, ms: performance.now() - start });
    return seedBlogPosts;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("query_failed", { fn: "getBlogPosts", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getBlogPosts failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getBlogPosts" });
    return seedBlogPosts;
  }

  const result = (data ?? []).map((row) => mapBlogPost(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getBlogPosts", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getBlogPostBySlug(slug: string, client?: SupabaseClient): Promise<BlogPost | null> {
  const start = performance.now();

  if (IS_DEMO) {
    const found = seedBlogPosts.find((p) => p.slug === slug) ?? null;
    logger.info("query_ok", { fn: "getBlogPostBySlug", demo: true, rows: found ? 1 : 0, ms: performance.now() - start });
    return found;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      logger.info("query_ok", { fn: "getBlogPostBySlug", rows: 0, ms: performance.now() - start });
      return null;
    }
    logger.error("query_failed", { fn: "getBlogPostBySlug", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getBlogPostBySlug failed: ${error.message}`);
    return seedBlogPosts.find((p) => p.slug === slug) ?? null;
  }

  const result = data ? mapBlogPost(data as Record<string, unknown>) : null;
  logger.info("query_ok", { fn: "getBlogPostBySlug", rows: result ? 1 : 0, ms: performance.now() - start });
  return result;
}

export async function getFaqs(client?: SupabaseClient): Promise<FAQ[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getFaqs", demo: true, rows: seedFaqs.length, ms: performance.now() - start });
    return seedFaqs;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getFaqs", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getFaqs failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getFaqs" });
    return seedFaqs;
  }

  const result = (data ?? []).map((row) => mapFaq(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getFaqs", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getHeroSlides(client?: SupabaseClient): Promise<HeroSlide[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getHeroSlides", demo: true, rows: seedHeroSlides.length, ms: performance.now() - start });
    return seedHeroSlides;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getHeroSlides", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getHeroSlides failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getHeroSlides" });
    return seedHeroSlides;
  }

  const result = (data ?? []).map((row) => mapHeroSlide(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getHeroSlides", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getTestimonials(client?: SupabaseClient): Promise<Testimonial[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getTestimonials", demo: true, rows: seedTestimonials.length, ms: performance.now() - start });
    return seedTestimonials;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getTestimonials", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getTestimonials failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getTestimonials" });
    return seedTestimonials;
  }

  const result = (data ?? []).map((row) => mapTestimonial(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getTestimonials", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getTrustBadges(client?: SupabaseClient): Promise<TrustBadge[]> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getTrustBadges", demo: true, rows: seedTrustBadges.length, ms: performance.now() - start });
    return seedTrustBadges;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("trust_badges")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    logger.error("query_failed", { fn: "getTrustBadges", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getTrustBadges failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getTrustBadges" });
    return seedTrustBadges;
  }

  const result = (data ?? []).map((row) => mapTrustBadge(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getTrustBadges", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const start = performance.now();

  if (IS_DEMO) {
    logger.info("query_ok", { fn: "getCouponByCode", demo: true, rows: 0, ms: performance.now() - start });
    return null; // Demo modda kupon doğrulama yok
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      logger.info("query_ok", { fn: "getCouponByCode", rows: 0, ms: performance.now() - start });
      return null;
    }
    logger.error("query_failed", { fn: "getCouponByCode", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getCouponByCode failed: ${error.message}`);
    return null;
  }

  const result = data ? mapCoupon(data as Record<string, unknown>) : null;
  logger.info("query_ok", { fn: "getCouponByCode", rows: result ? 1 : 0, ms: performance.now() - start });
  return result;
}

// ==========================================
// UTILITY: Tüm aktif ürünleri getir (ProductContext için)
// ==========================================

/**
 * Tüm aktif ürünleri getirir — LIMIT destekli.
 *
 * GÜVENLIK: Varsayılan limit 100. Limitsiz çağrı yapılmamalı.
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #5
 */
export async function getAllActiveProducts(client?: SupabaseClient, options?: { limit?: number; offset?: number }): Promise<Product[]> {
  const start = performance.now();
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  if (IS_DEMO) {
    const all = activeSeedProducts();
    const result = all.slice(offset, offset + limit);
    logger.info("query_ok", { fn: "getAllActiveProducts", demo: true, rows: result.length, ms: performance.now() - start });
    return result;
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error("query_failed", { fn: "getAllActiveProducts", error: error.message, ms: performance.now() - start });
    if (IS_PROD) throw new Error(`getAllActiveProducts failed: ${error.message}`);
    logger.warn("seed_fallback", { fn: "getAllActiveProducts" });
    return activeSeedProducts().slice(0, limit);
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getAllActiveProducts", rows: result.length, limit, offset, ms: performance.now() - start });
  return result;
}


/**
 * Server-side ürün arama — Supabase ilike ile.
 * Client-side arama 200 ürün limitiyle çalışmıyordu, bu fonksiyon
 * DB'den doğrudan arar ve tüm eşleşen ürünleri döner (max 100).
 */
export async function searchProductsServer(query: string, client?: SupabaseClient): Promise<Product[]> {
  const start = performance.now();
  if (!query || query.trim().length < 2) return [];

  if (IS_DEMO) {
    const q = query.toLowerCase();
    const results = activeSeedProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.short_desc?.toLowerCase().includes(q)
    );
    logger.info("query_ok", { fn: "searchProductsServer", demo: true, query, rows: results.length, ms: performance.now() - start });
    return results.slice(0, 100);
  }

  const supabase = getSupabase(client);
  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*), reviews:reviews!left(id, rating, is_approved)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm},short_desc.ilike.${searchTerm}`)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    logger.error("query_failed", { fn: "searchProductsServer", query, error: error.message, ms: performance.now() - start });
    return [];
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "searchProductsServer", query, rows: result.length, ms: performance.now() - start });
  return result;
}

/**
 * Belirli ID listesine göre ürünleri getirir.
 * RecentlyViewed gibi bileşenler için — tüm ürünleri çekmek yerine.
 */
export async function getProductsByIds(ids: string[], client?: SupabaseClient): Promise<Product[]> {
  const start = performance.now();
  if (ids.length === 0) return [];

  if (IS_DEMO) {
    return activeSeedProducts().filter((p) => ids.includes(p.id));
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), brand:brands(*)")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    logger.error("query_failed", { fn: "getProductsByIds", error: error.message, ms: performance.now() - start });
    return [];
  }

  const result = (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getProductsByIds", rows: result.length, ms: performance.now() - start });
  return result;
}

/**
 * Sitemap için minimal ürün bilgisi — sadece slug ve updated_at.
 * Tam ürün verisi çekmek yerine kullanılır.
 */
export async function getProductSlugs(client?: SupabaseClient): Promise<{ slug: string; updated_at: string }[]> {
  const start = performance.now();

  if (IS_DEMO) {
    return activeSeedProducts().map((p) => ({ slug: p.slug, updated_at: p.updated_at || p.created_at }));
  }

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    logger.error("query_failed", { fn: "getProductSlugs", error: error.message, ms: performance.now() - start });
    return [];
  }

  logger.info("query_ok", { fn: "getProductSlugs", rows: (data ?? []).length, ms: performance.now() - start });
  return (data ?? []).map((row) => ({ slug: row.slug as string, updated_at: (row.updated_at || new Date().toISOString()) as string }));
}

// ==========================================
// REVIEWS
// ==========================================

function mapReview(row: Record<string, unknown>): Review {
  const images = row.images;
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    user_id: row.user_id as string,
    rating: row.rating as number,
    comment: (row.comment as string) ?? "",
    images: Array.isArray(images) ? (images as string[]) : [],
    is_approved: (row.is_approved as boolean) ?? false,
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    helpful_yes: (row.helpful_yes as number) ?? 0,
    helpful_no: (row.helpful_no as number) ?? 0,
    profile: row.profile ? (row.profile as Review["profile"]) : undefined,
  };
}

export async function getProductReviews(productId: string, client?: SupabaseClient): Promise<Review[]> {
  const start = performance.now();
  if (IS_DEMO) return [];

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("query_failed", { fn: "getProductReviews", error: error.message, ms: performance.now() - start });
    return [];
  }

  const result = (data ?? []).map((row) => mapReview(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getProductReviews", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function getAllReviews(client?: SupabaseClient): Promise<Review[]> {
  const start = performance.now();
  if (IS_DEMO) return [];

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("query_failed", { fn: "getAllReviews", error: error.message, ms: performance.now() - start });
    return [];
  }

  const result = (data ?? []).map((row) => mapReview(row as Record<string, unknown>));
  logger.info("query_ok", { fn: "getAllReviews", rows: result.length, ms: performance.now() - start });
  return result;
}

export async function addReviewToDB(
  review: { product_id: string; user_id: string; rating: number; comment: string; images?: string[] },
  client?: SupabaseClient
): Promise<Review | null> {
  const start = performance.now();
  if (IS_DEMO) return null;

  const supabase = getSupabase(client);
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      product_id: review.product_id,
      user_id: review.user_id,
      rating: review.rating,
      comment: review.comment,
      images: review.images ?? [],
      is_approved: true,
    })
    .select()
    .single();

  if (error) {
    logger.error("query_failed", { fn: "addReviewToDB", error: error.message, ms: performance.now() - start });
    return null;
  }

  logger.info("query_ok", { fn: "addReviewToDB", ms: performance.now() - start });
  return mapReview(data as Record<string, unknown>);
}

export async function updateReviewApproval(
  reviewId: string,
  isApproved: boolean,
  client?: SupabaseClient
): Promise<boolean> {
  if (IS_DEMO) return true;

  const supabase = getSupabase(client);
  const { error } = await supabase
    .from("reviews")
    .update({ is_approved: isApproved })
    .eq("id", reviewId);

  if (error) {
    logger.error("query_failed", { fn: "updateReviewApproval", error: error.message });
    return false;
  }
  return true;
}

export async function deleteReviewFromDB(reviewId: string, client?: SupabaseClient): Promise<boolean> {
  if (IS_DEMO) return true;

  const supabase = getSupabase(client);
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    logger.error("query_failed", { fn: "deleteReviewFromDB", error: error.message });
    return false;
  }
  return true;
}

export async function upsertReviewVote(
  reviewId: string,
  userId: string,
  vote: "yes" | "no",
  client?: SupabaseClient
): Promise<boolean> {
  if (IS_DEMO) return true;

  const supabase = getSupabase(client);
  const { error } = await supabase
    .from("review_votes")
    .upsert(
      { review_id: reviewId, user_id: userId, vote },
      { onConflict: "review_id,user_id" }
    );

  if (error) {
    logger.error("query_failed", { fn: "upsertReviewVote", error: error.message });
    return false;
  }

  // Update helpful counts on the review
  const { data: votes } = await supabase
    .from("review_votes")
    .select("vote")
    .eq("review_id", reviewId);

  if (votes) {
    const yesCount = votes.filter((v) => v.vote === "yes").length;
    const noCount = votes.filter((v) => v.vote === "no").length;
    await supabase
      .from("reviews")
      .update({ helpful_yes: yesCount, helpful_no: noCount })
      .eq("id", reviewId);
  }

  return true;
}
