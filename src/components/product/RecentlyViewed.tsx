"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { getProductsByIds } from "@/lib/queries";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";
import { logger } from "@/lib/logger";

interface RecentlyViewedProps {
  excludeId?: string;
}

/**
 * Son görüntülenen ürünler bileşeni.
 * GÜVENLIK: Tüm ürünleri çekmek yerine sadece viewed ID'lere göre sorgu yapar.
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #5
 */
export default function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const { viewedIds } = useRecentlyViewed();
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const idsToFetch = viewedIds
      .filter((id) => id !== excludeId)
      .slice(0, 4);

    if (idsToFetch.length === 0) return;

    getProductsByIds(idsToFetch)
      .then((products) => {
        // Sırayı viewedIds'e göre koru
        const ordered = idsToFetch
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is Product => !!p && p.is_active && !p.deleted_at);
        setViewedProducts(ordered);
      })
      .catch((err) => logger.error("recently_viewed_load_failed", { fn: "RecentlyViewed", error: err instanceof Error ? err.message : String(err) }));
  }, [viewedIds, excludeId]);

  if (viewedProducts.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-2">
        <Clock size={20} className="text-dark-500" />
        <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">Son Görüntülenen Ürünler</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {viewedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
