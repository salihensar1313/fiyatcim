"use client";

import { Sparkles } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { getRecommendations } from "@/lib/recommendations";
import ProductCard from "./ProductCard";
import type { Product } from "@/types";

interface SmartRecommendationsProps {
  product: Product;
}

export default function SmartRecommendations({ product }: SmartRecommendationsProps) {
  const { products } = useProducts();

  // Son görüntülenenler localStorage'dan
  let recentIds: string[] = [];
  if (typeof window !== "undefined") {
    try {
      recentIds = JSON.parse(localStorage.getItem("fiyatcim_recently_viewed") || "[]");
    } catch { /* empty */ }
  }

  const recommendations = getRecommendations(product, products, recentIds, 8);

  if (recommendations.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <h2 className="flex items-center gap-2 section-title">
          <Sparkles size={24} className="text-yellow-500" />
          Bunları da Beğenebilirsiniz
        </h2>
        <p className="section-subtitle">
          İlginizi çekebilecek benzer ürünler
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {recommendations.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
