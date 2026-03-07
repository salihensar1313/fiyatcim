import type { Metadata } from "next";
import { getCategories } from "@/lib/queries";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import JsonLd, { buildBreadcrumbSchema } from "@/components/seo/JsonLd";
import CategoryClient from "./CategoryClient";

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
