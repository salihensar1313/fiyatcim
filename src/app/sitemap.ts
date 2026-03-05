import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getCategories, getAllActiveProducts } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  const [categories, products] = await Promise.all([
    getCategories(),
    getAllActiveProducts(),
  ]);

  // Statik sayfalar
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/urunler`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/hizmetlerimiz`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/sss`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/gizlilik`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/iade-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/kargo-bilgileri`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
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

  // NOT: /admin/* sayfaları sitemap'e EKLENMEMELİ (Security Acceptance Test A5)
  return [...staticPages, ...categoryPages, ...productPages];
}
