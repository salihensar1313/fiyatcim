import type { Category, Brand, Product, Testimonial, HeroSlide, BlogPost, FAQ } from "@/types";

// ==========================================
// CATEGORIES (Supabase fallback)
// ==========================================
export const categories: Category[] = [
  {
    id: "cat-1",
    name: "Alarm Sistemleri",
    slug: "alarm-sistemleri",
    image_url: "/images/categories/alarm.png",
    icon: "Shield",
    sort_order: 1,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-2",
    name: "Güvenlik Kameraları",
    slug: "guvenlik-kameralari",
    image_url: "/images/categories/kamera.png",
    icon: "Camera",
    sort_order: 2,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-3",
    name: "Akıllı Ev Sistemleri",
    slug: "akilli-ev-sistemleri",
    image_url: "/images/categories/akilli-ev.png",
    icon: "Home",
    sort_order: 3,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "cat-4",
    name: "Geçiş Kontrol Sistemleri",
    slug: "gecis-kontrol-sistemleri",
    image_url: "/images/categories/gecis-kontrol.png",
    icon: "Fingerprint",
    sort_order: 4,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// ==========================================
// BRANDS (Supabase fallback)
// ==========================================
export const brands: Brand[] = [
  { id: "brand-1", name: "Hikvision", slug: "hikvision", logo_url: "/images/brands/hikvision.png", created_at: "2024-01-01T00:00:00Z" },
  { id: "brand-2", name: "Dahua", slug: "dahua", logo_url: "/images/brands/dahua.png", created_at: "2024-01-01T00:00:00Z" },
  { id: "brand-3", name: "Ajax", slug: "ajax", logo_url: "/images/brands/ajax.png", created_at: "2024-01-01T00:00:00Z" },
  { id: "brand-4", name: "Paradox", slug: "paradox", logo_url: "/images/brands/paradox.png", created_at: "2024-01-01T00:00:00Z" },
  { id: "brand-5", name: "ZKTeco", slug: "zkteco", logo_url: "/images/brands/zkteco.png", created_at: "2024-01-01T00:00:00Z" },
  { id: "brand-6", name: "Samsung", slug: "samsung", logo_url: "/images/brands/samsung.png", created_at: "2024-01-01T00:00:00Z" },
];

// ==========================================
// Demo mode kapatıldı — aşağıdaki veriler boş
// Supabase'den gerçek veri çekildiği için demo veriye gerek yok
// ==========================================
export const products: Product[] = [];
export const heroSlides: HeroSlide[] = [];
export const testimonials: Testimonial[] = [];
export const blogPosts: BlogPost[] = [];
export const faqs: FAQ[] = [];

// ==========================================
// HELPER: Get products by category
// ==========================================
export function getProductsByCategory(categorySlug: string): Product[] {
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return products.filter((p) => p.category_id === category.id && p.is_active && !p.deleted_at);
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug && p.is_active && !p.deleted_at);
}

export function getFeaturedProducts(): Product[] {
  return products
    .filter((p) => p.is_active && !p.deleted_at && p.sale_price)
    .slice(0, 8);
}

export function getRelatedProducts(productId: string, categoryId: string, limit = 4): Product[] {
  return products
    .filter((p) => p.id !== productId && p.category_id === categoryId && p.is_active && !p.deleted_at)
    .slice(0, limit);
}
