"use client";

import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useCountdown } from "@/hooks/useFlashSale";
import ProductCard from "@/components/product/ProductCard";

function FlashTimer({ endDate }: { endDate: string }) {
  const cd = useCountdown(endDate);
  if (!cd.ready || cd.isExpired) return null;

  return (
    <div className="flex items-center gap-1.5">
      {[
        { value: cd.hours, label: "sa" },
        { value: cd.minutes, label: "dk" },
        { value: cd.seconds, label: "sn" },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-lg font-bold text-primary-600">:</span>}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl">
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="text-[10px] font-medium text-dark-500 dark:text-dark-400 sm:text-xs">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function FlashSale() {
  const { products } = useProducts();

  // Find products with active flash sale
  const flashProducts = products.filter((p) => {
    if (!p.sale_ends_at || !p.is_active || p.deleted_at) return false;
    return new Date(p.sale_ends_at).getTime() > Date.now();
  });

  if (flashProducts.length === 0) return null;

  // Use the earliest ending sale for the main timer
  const sorted = [...flashProducts].sort(
    (a, b) => new Date(a.sale_ends_at!).getTime() - new Date(b.sale_ends_at!).getTime()
  );
  const earliestEnd = sorted[0].sale_ends_at!;

  return (
    <section className="bg-gradient-to-r from-primary-50 via-white to-primary-50 py-12 sm:py-16 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900">
      <div className="container-custom">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 section-title">
              <Zap size={24} className="text-yellow-500" />
              <span className="text-primary-600">Flaş</span> İndirimler
            </h2>
            <p className="section-subtitle">
              Sınırlı süreli fırsatları kaçırmayın!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-dark-600 dark:text-dark-300">
              Bitimine kalan:
            </div>
            <FlashTimer endDate={earliestEnd} />
          </div>
        </div>

        {/* Products */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {flashProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/kampanyalar"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Tüm Kampanyaları Gör
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
