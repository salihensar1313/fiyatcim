"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useTrendingProducts } from "@/hooks/useTrendingProducts";
import ProductCard from "@/components/product/ProductCard";

export default function TrendingProducts() {
  const trending = useTrendingProducts(4);

  if (trending.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 section-title">
              <TrendingUp size={24} className="text-green-600" />
              Trend Ürünler
            </h2>
            <p className="section-subtitle">Son günlerde en çok ilgi gören ürünler</p>
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
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
