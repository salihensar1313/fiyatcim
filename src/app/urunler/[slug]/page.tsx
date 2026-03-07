import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { SITE_NAME, SITE_URL, CATEGORY_IMAGES, CATEGORY_IMAGES_BY_SLUG } from "@/lib/constants";
import JsonLd, { buildProductSchema, buildBreadcrumbSchema } from "@/components/seo/JsonLd";
import ProductDetailClient from "./ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: `Ürün Bulunamadı | ${SITE_NAME}` };
  }

  const title = product.seo_title || `${product.name} | ${SITE_NAME}`;
  const description = product.seo_desc || product.short_desc || `${product.name} - En uygun fiyatlarla Fiyatcim.com'da`;

  return {
    title,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/urunler/${product.slug}`,
      type: "website",
    },
    alternates: {
      canonical: `${SITE_URL}/urunler/${product.slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  const category = product?.category;
  const productImage = product
    ? CATEGORY_IMAGES[product.category_id] ||
      (category ? CATEGORY_IMAGES_BY_SLUG[category.slug] : null) ||
      "/images/categories/alarm.png"
    : "";

  return (
    <>
      {product && (
        <>
          <JsonLd data={buildProductSchema({
            name: product.name,
            description: product.short_desc,
            slug: product.slug,
            sku: product.sku,
            price: product.price,
            salePrice: product.sale_price,
            stock: product.stock,
            brand: product.brand?.name || "Fiyatcim",
            imageUrl: `${SITE_URL}${productImage}`,
          })} />
          <JsonLd data={buildBreadcrumbSchema([
            { name: "Ürünler", href: "/urunler" },
            ...(category ? [{ name: category.name, href: `/kategori/${category.slug}` }] : []),
            { name: product.name },
          ])} />
        </>
      )}
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
