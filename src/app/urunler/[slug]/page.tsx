"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getProductBySlug } from "@/lib/queries";
import { CATEGORY_IMAGES, CATEGORY_IMAGES_BY_SLUG } from "@/lib/constants";
import type { Product } from "@/types";
import JsonLd, { buildProductSchema } from "@/components/seo/JsonLd";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductTabs from "@/components/product/ProductTabs";
import RelatedProducts from "@/components/product/RelatedProducts";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addViewed } = useRecentlyViewed();

  useEffect(() => {
    if (!slug) return;
    getProductBySlug(slug)
      .then(setProduct)
      .catch((err) => console.error("getProductBySlug failed:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product) addViewed(product.id);
  }, [product, addViewed]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-dark-900">Ürün Bulunamadı</h1>
        <p className="mt-2 text-dark-500">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Link href="/urunler" className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const category = product.category;
  const brand = product.brand;
  const productImage =
    CATEGORY_IMAGES[product.category_id] ||
    (category ? CATEGORY_IMAGES_BY_SLUG[category.slug] : null) ||
    "/images/categories/alarm.png";

  return (
    <div className="bg-dark-50 pb-16">
      <JsonLd data={buildProductSchema({
        name: product.name,
        description: product.short_desc,
        slug: product.slug,
        price: product.price,
        salePrice: product.sale_price,
        stock: product.stock,
        brand: brand?.name || "Fiyatcim",
        imageUrl: `https://www.fiyatcim.com${productImage}`,
      })} />
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: "Ürünler", href: "/urunler" },
            ...(category ? [{ label: category.name, href: `/kategori/${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images} productName={product.name} categoryId={product.category_id} />
          <ProductInfo product={product} />
        </div>

        <div className="mt-12 rounded-xl border border-dark-100 bg-white p-6">
          <ProductTabs product={product} />
        </div>

        <RelatedProducts productId={product.id} categoryId={product.category_id} />
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
