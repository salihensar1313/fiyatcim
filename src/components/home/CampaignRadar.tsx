"use client";

import Link from "next/link";
import { ArrowRight, Percent } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { usePersonalization } from "@/hooks/usePersonalization";
import ProductCard from "@/components/product/ProductCard";

export default function CampaignRadar() {
  const { products } = useProducts();
  const { personalize } = usePersonalization();

  // Campaigns = products with active discounts, sorted by discount %
  const allCampaigns = products
    .filter((p) => p.is_active && !p.deleted_at && p.stock > 0 && p.sale_price && p.sale_price < p.price)
    .sort((a, b) => {
      const discA = a.sale_price ? (a.price - a.sale_price) / a.price : 0;
      const discB = b.sale_price ? (b.price - b.sale_price) / b.price : 0;
      return discB - discA;
    })
    .slice(0, 12);

  // IBP: kişiselleştirilmiş sıralama
  const campaigns = personalize(allCampaigns, 4);

  if (campaigns.length === 0) return null;

  return (
    <section className="bg-dark-50 py-12 sm:py-16 dark:bg-dark-950">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 section-title">
              <Percent size={24} className="text-red-500" />
              Kampanya Radar
            </h2>
            <p className="section-subtitle">
              Bugünün en avantajlı fırsatları
            </p>
          </div>
          <Link
            href="/kampanyalar"
            className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
          >
            Tüm Kampanyalar
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {campaigns.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/kampanyalar"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
          >
            Tüm Kampanyaları Gör
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
