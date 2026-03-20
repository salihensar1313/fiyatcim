"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { getAlternatives } from "@/lib/recommendations";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { getProductPrimaryImage, isRemoteImage } from "@/lib/product-images";
import type { Product } from "@/types";

interface ProductAlternativesProps {
  product: Product;
}

export default function ProductAlternatives({ product }: ProductAlternativesProps) {
  const { products } = useProducts();
  const alternatives = getAlternatives(product, products, 6);

  if (alternatives.length === 0) return null;

  const currentPrice = product.sale_price || product.price;

  return (
    <section className="bg-dark-50 py-12 sm:py-16 dark:bg-dark-950">
      <div className="container-custom">
        <h2 className="flex items-center gap-2 section-title">
          <ArrowLeftRight size={24} className="text-blue-500" />
          Bu Ürüne Alternatif
        </h2>
        <p className="section-subtitle">
          Aynı kategoride farklı seçenekler
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {alternatives.map((alt) => {
            const altPrice = alt.sale_price || alt.price;
            const diff = altPrice - currentPrice;
            const diffPercent = Math.round((diff / currentPrice) * 100);

            return (
              <Link
                key={alt.id}
                href={`/urunler/${alt.slug}`}
                className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-white dark:bg-dark-800 p-4 dark:bg-dark-700">
                  <Image
                    src={getProductPrimaryImage(alt)}
                    alt={alt.name}
                    width={200}
                    height={200}
                    unoptimized={isRemoteImage(getProductPrimaryImage(alt))}
                    className="h-full w-full object-contain transition-transform group-hover:scale-105"
                  />
                  {/* Price diff badge */}
                  {diff !== 0 && (
                    <span
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                        diff < 0 ? "bg-green-600" : "bg-orange-500"
                      }`}
                    >
                      {diff < 0 ? `${diffPercent}% ucuz` : `+${diffPercent}% pahalı`}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
                    {alt.brand_id === "brand-1" ? "Hikvision" :
                     alt.brand_id === "brand-2" ? "Dahua" :
                     alt.brand_id === "brand-3" ? "Ajax" :
                     alt.brand_id === "brand-4" ? "Paradox" :
                     alt.brand_id === "brand-5" ? "ZKTeco" : "Samsung"}
                  </span>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium text-dark-900 dark:text-dark-50">
                    {alt.name}
                  </h3>
                  <div className="mt-auto pt-2">
                    <PriceDisplay
                      priceUsd={alt.price_usd}
                      salePriceUsd={alt.sale_price_usd}
                      priceTry={alt.price}
                      salePriceTry={alt.sale_price}
                      size="sm"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
