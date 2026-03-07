"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import ProductCard from "./ProductCard";

interface BoughtAlsoViewedProps {
  productId: string;
  title?: string;
  subtitle?: string;
  limit?: number;
}

/**
 * "Bu Ürüne Bakanlar Bunları da İnceledi" — Satın alma verisine dayalı öneri
 *
 * Algoritma:
 * 1. Verilen ürünü içeren siparişleri bul
 * 2. Bu siparişlerdeki diğer ürünleri topla
 * 3. Birlikte satılma sıklığına göre sırala
 * 4. Son görüntülenen ürünlerle zenginleştir
 */
export default function BoughtAlsoViewed({
  productId,
  title = "Bu Ürüne Bakanlar Bunları da İnceledi",
  subtitle = "Diğer müşterilerin tercihleri",
  limit = 4,
}: BoughtAlsoViewedProps) {
  const { products } = useProducts();
  const { getAllOrders } = useOrders();

  const recommendations = useMemo(() => {
    const orders = getAllOrders();
    const activeProducts = products.filter((p) => p.is_active && !p.deleted_at && p.stock > 0);

    // 1. Bu ürünü içeren siparişleri bul
    const relatedOrders = orders.filter((o) =>
      o.items?.some((item) => item.product_id === productId)
    );

    // 2. Bu siparişlerdeki diğer ürünleri sıklıkla say
    const coOccurrence: Record<string, number> = {};
    relatedOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (item.product_id !== productId) {
          coOccurrence[item.product_id] = (coOccurrence[item.product_id] || 0) + item.qty;
        }
      });
    });

    // 3. Son görüntülenenlerle zenginleştir
    let recentIds: string[] = [];
    if (typeof window !== "undefined") {
      try {
        recentIds = JSON.parse(localStorage.getItem("fiyatcim_recently_viewed") || "[]");
      } catch { /* empty */ }
    }

    // 4. Aktif ürünleri skor ile sırala
    const currentProduct = products.find((p) => p.id === productId);
    const scored = activeProducts
      .filter((p) => p.id !== productId)
      .map((p) => {
        let score = 0;

        // Birlikte satılma sıklığı (en güçlü sinyal)
        if (coOccurrence[p.id]) score += coOccurrence[p.id] * 40;

        // Son görüntülenen ürünlerden olması
        if (recentIds.includes(p.id)) score += 15;

        // Aynı kategori
        if (currentProduct && p.category_id === currentProduct.category_id) score += 10;

        // İndirimli ürünler daha çekici
        if (p.sale_price && p.sale_price < p.price) score += 5;

        return { product: p, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.product);

    // Yetersiz sonuç varsa — popüler ürünlerle tamamla
    if (scored.length < limit && currentProduct) {
      const existingIds = new Set([productId, ...scored.map((p) => p.id)]);
      const fillers = activeProducts
        .filter((p) => !existingIds.has(p.id) && p.category_id === currentProduct.category_id)
        .sort((a, b) => b.stock - a.stock)
        .slice(0, limit - scored.length);
      scored.push(...fillers);
    }

    return scored;
  }, [productId, products, getAllOrders, limit]);

  if (recommendations.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="container-custom">
        <h2 className="flex items-center gap-2 section-title">
          <Users size={22} className="text-primary-600" />
          {title}
        </h2>
        <p className="section-subtitle">{subtitle}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {recommendations.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
