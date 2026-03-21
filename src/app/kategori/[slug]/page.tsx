import type { Metadata } from "next";
import { getCategories } from "@/lib/queries";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd, { buildBreadcrumbSchema } from "@/components/seo/JsonLd";
import CategoryClient from "./CategoryClient";

export const revalidate = 300; // 5 dakika

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: `Kategori Bulunamadı | ${SITE_NAME}` };
  }

  const title = `${category.name} | ${SITE_NAME}`;
  const description = `${category.name} kategorisindeki ürünleri keşfedin. En iyi fiyatlarla güvenlik sistemleri Fiyatcim.com'da.`;

  return {
    title,
    description,
    openGraph: {
      title: category.name,
      description,
      url: `${SITE_URL}/kategori/${category.slug}`,
      type: "website",
      images: [
        {
          url: "/images/og-default.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description,
      images: ["/images/og-default.png"],
    },
    alternates: {
      canonical: `${SITE_URL}/kategori/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema([
        { name: "Ürünler", href: "/urunler" },
        { name: slug },
      ])} />
      <CategoryClient slug={slug} />
    </>
  );
}
