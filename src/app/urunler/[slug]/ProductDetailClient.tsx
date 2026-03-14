"use client";

import { useState, useEffect, useRef } from "react";
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
import BoughtAlsoViewed from "@/components/product/BoughtAlsoViewed";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, getEffectivePrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface Props {
  initialProduct: Product | null;
}

export default function ProductDetailClient({ initialProduct }: Props) {
  const [product] = useState<Product | null>(initialProduct);
  const { addViewed } = useRecentlyViewed();
  const { addItem, isInCart } = useCart();
  const { showToast } = useToast();
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    if (product) {
      addViewed(product.id);
      recordPrice(product);
      incrementViewCount(product.id);
    }
  }, [product, addViewed]);

  // IntersectionObserver: sticky CTA'yı ana buton görünmezken göster
  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCTA(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product]);

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
            {/* Sentinel div — IntersectionObserver hedefi */}
            <div ref={ctaRef} />
            <div className="mt-4">
              <AlertButtons product={product} />
            </div>
          </div>
        </div>

        <div id="product-tabs" className="mt-8 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-4 sm:mt-12 sm:p-6">
          <ProductTabs product={product} />
        </div>

        <RelatedProducts productId={product.id} categoryId={product.category_id} />
      </div>

      <BoughtAlsoViewed productId={product.id} />
      <ProductAlternatives product={product} />
      <SmartRecommendations product={product} />

      <div className="container mx-auto px-4">
        <RecentlyViewed excludeId={product.id} />
      </div>

      {/* Mobil Sticky "Sepete Ekle" CTA */}
      {showStickyCTA && product.stock > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-3 shadow-lg lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-dark-900 dark:text-dark-50">{product.name}</p>
              <p className="text-sm font-bold text-primary-600">
                {formatPrice(getEffectivePrice(product.price, product.sale_price))}
              </p>
            </div>
            {isInCart(product.id) ? (
              <Link
                href="/sepet"
                className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-700"
              >
                <ShoppingCart size={16} />
                Sepete Git
              </Link>
            ) : (
              <button
                onClick={() => {
                  addItem(product);
                  showToast("Ürün sepete eklendi", "success");
                }}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-700 active:scale-95"
              >
                <ShoppingCart size={16} />
                Sepete Ekle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
