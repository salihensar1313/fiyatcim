"use client";

import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import ProductCard from "./ProductCard";

/**
 * Sepet sayfası önerileri — "Bunu Alanlar Şunları da Aldı"
 *
 * Sepetteki ürünlere göre:
 * 1. Birlikte satılma verisinden öneriler
 * 2. Aynı kategorideki popüler ürünler
 * 3. Tamamlayıcı ürünler (farklı kategori ama sık birlikte alınan)
 */
export default function CartRecommendations() {
  const { items } = useCart();
  const { products } = useProducts();
  const { getAllOrders } = useOrders();

  const recommendations = useMemo(() => {
    const activeProducts = products.filter(
      (p) => p.is_active && !p.deleted_at && p.stock > 0
    );

    // Sepet boşsa: indirimli / popüler ürünleri göster
    if (items.length === 0) {
      return activeProducts
        .filter((p) => p.sale_price && p.sale_price < p.price)
        .sort((a, b) => {
          const aDisc = (a.price - (a.sale_price || a.price)) / a.price;
          const bDisc = (b.price - (b.sale_price || b.price)) / b.price;
          return bDisc - aDisc;
        })
        .slice(0, 4);
    }

    const orders = getAllOrders();
    const cartProductIds = new Set(items.map((i) => i.product_id));
    const filteredProducts = activeProducts.filter(
      (p) => !cartProductIds.has(p.id)
    );

    // Sepetteki ürünleri içeren siparişleri bul
    const relatedOrders = orders.filter((o) =>
      o.items?.some((item) => cartProductIds.has(item.product_id))
    );

    // Bu siparişlerdeki diğer ürünlerin sıklığını hesapla
    const coOccurrence: Record<string, number> = {};
    relatedOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!cartProductIds.has(item.product_id)) {
          coOccurrence[item.product_id] = (coOccurrence[item.product_id] || 0) + item.qty;
        }
      });
    });

    // Sepetteki ürünlerin kategorilerini topla
    const cartCategories = new Set<string>();
    items.forEach((item) => {
      const p = products.find((pr) => pr.id === item.product_id);
      if (p) cartCategories.add(p.category_id);
    });

    const scored = filteredProducts.map((p) => {
      let score = 0;

      // Birlikte satılma verisi
      if (coOccurrence[p.id]) score += coOccurrence[p.id] * 50;

      // Aynı kategoriden
      if (cartCategories.has(p.category_id)) score += 15;

      // Farklı kategoriden (tamamlayıcı)
      if (!cartCategories.has(p.category_id) && coOccurrence[p.id]) score += 25;

      // İndirimli
      if (p.sale_price && p.sale_price < p.price) score += 10;

      return { product: p, score };
    });

    // Sıklık verisi yoksa kategoriye göre öner
    const hasCoData = scored.some((s) => s.score > 0);

    if (!hasCoData) {
      return filteredProducts
        .filter((p) => cartCategories.has(p.category_id))
        .sort((a, b) => {
          const aDisc = a.sale_price ? (a.price - a.sale_price) / a.price : 0;
          const bDisc = b.sale_price ? (b.price - b.sale_price) / b.price : 0;
          return bDisc - aDisc;
        })
        .slice(0, 4);
    }

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.product);
  }, [items, products, getAllOrders]);

  if (recommendations.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
        <ShoppingBag size={20} className="text-primary-600" />
        {items.length > 0 ? "Bunu Alanlar Şunları da Aldı" : "Öne Çıkan Ürünler"}
      </h2>
      <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
        {items.length > 0 ? "Sepetindeki ürünlere göre öneriler" : "En çok tercih edilen güvenlik ürünleri"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {recommendations.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
