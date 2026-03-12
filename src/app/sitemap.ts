import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getCategories, getAllActiveProducts, getBlogPosts } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getAllActiveProducts>> = [];
  let blogPosts: Awaited<ReturnType<typeof getBlogPosts>> = [];

  try {
    [categories, products, blogPosts] = await Promise.all([
      getCategories(),
      getAllActiveProducts(),
      getBlogPosts(),
    ]);
  } catch {
    // Build sırasında DB bağlantısı yoksa sadece statik sayfaları döndür
  }

  // Statik sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/urunler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/kampanyalar`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/rehber`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/hizmetlerimiz`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sss`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/siparis-takip`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/iade-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kargo-bilgileri`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cerez-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/bilgi-guvenligi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/guvenli-alisveris`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/mesafeli-satis-sozlesmesi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/on-bilgilendirme`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Kategori sayfaları
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/kategori/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Ürün sayfaları
  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/urunler/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Blog yazıları
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.created_at || now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // NOT: /admin/* sayfaları sitemap'e EKLENMEMELİ (Security Acceptance Test A5)
  return [...staticPages, ...categoryPages, ...productPages, ...blogPages];
}
