"use client";

import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { usePersonalization } from "@/hooks/usePersonalization";
import ProductCard from "@/components/product/ProductCard";

export default function BestSellers() {
  const { products } = useProducts();
  const { personalize } = usePersonalization();

  // İndirimli ürünler (sale_price olanlar), en yüksek indirim oranına göre sırala
  const discounted = products
    .filter((p) => p.stock > 0 && p.sale_price && p.sale_price < p.price)
    .sort((a, b) => {
      const discountA = (a.price - (a.sale_price || a.price)) / a.price;
      const discountB = (b.price - (b.sale_price || b.price)) / b.price;
      return discountB - discountA;
    })
    .slice(0, 12);

  // IBP: kişiselleştirilmiş sıralama (max 4 göster)
  const personalized = personalize(discounted, 4);

  if (personalized.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 section-title">
              <Flame size={24} className="text-primary-600" />
              Öne Çıkan İndirimler
            </h2>
            <p className="section-subtitle">En yüksek indirim oranına sahip ürünler</p>
          </div>
          <Link
            href="/urunler"
            className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
          >
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {personalized.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
