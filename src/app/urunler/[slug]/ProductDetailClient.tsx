"use client";

import { useState, useEffect } from "react";
import type { Product } from "@/types";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductTabs from "@/components/product/ProductTabs";
import RelatedProducts from "@/components/product/RelatedProducts";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { recordPrice } from "@/hooks/usePriceHistory";
import { incrementViewCount } from "@/hooks/useTrendingProducts";
import AlertButtons from "@/components/product/AlertButtons";
import ProductAlternatives from "@/components/product/ProductAlternatives";
import SmartRecommendations from "@/components/product/SmartRecommendations";
import Link from "next/link";

interface Props {
  initialProduct: Product | null;
}

export default function ProductDetailClient({ initialProduct }: Props) {
  const [product] = useState<Product | null>(initialProduct);
  const { addViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product) {
      addViewed(product.id);
      recordPrice(product);
      incrementViewCount(product.id);
    }
  }, [product, addViewed]);

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ürün Bulunamadı</h1>
        <p className="mt-2 text-dark-500 dark:text-dark-400">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
        <Link href="/urunler" className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const category = product.category;

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
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
          <div>
            <ProductInfo product={product} />
            <div className="mt-4">
              <AlertButtons product={product} />
            </div>
          </div>
        </div>

        <div id="product-tabs" className="mt-12 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
          <ProductTabs product={product} />
        </div>

        <RelatedProducts productId={product.id} categoryId={product.category_id} />
      </div>

      <ProductAlternatives product={product} />
      <SmartRecommendations product={product} />

      <div className="container mx-auto px-4">
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
