"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { getAllActiveProducts } from "@/lib/queries";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface RecentlyViewedProps {
  excludeId?: string;
}

export default function RecentlyViewed({ excludeId }: RecentlyViewedProps) {
  const { viewedIds } = useRecentlyViewed();
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    getAllActiveProducts()
      .then(setAllProducts)
      .catch((err) => console.error("getAllActiveProducts failed:", err));
  }, []);

  const viewedProducts = viewedIds
    .filter((id) => id !== excludeId)
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.is_active && !p.deleted_at)
    .slice(0, 4);

  if (viewedProducts.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-center gap-2">
        <Clock size={20} className="text-dark-400" />
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
