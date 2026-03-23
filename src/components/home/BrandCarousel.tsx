"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getBrands } from "@/lib/queries";
import type { Brand } from "@/types";

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    getBrands().then(setBrands).catch(() => {});
  }, []);

  if (brands.length === 0) return null;

  // Sadece logo_url olan markaları göster
  const brandsWithLogo = brands.filter((b) => b.logo_url);
  const displayBrands = brandsWithLogo.length > 0 ? brandsWithLogo : brands;

  return (
    <section className="border-y border-dark-100 bg-white py-8 dark:border-dark-700 dark:bg-dark-800 sm:py-10">
      <div className="container-custom">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50 sm:text-xl">
            Dünya Markalarıyla Çalışıyoruz
          </h2>
          <p className="mt-1 text-xs text-dark-500 dark:text-dark-400">
            Yalnızca orijinal ve garantili ürünler
          </p>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide sm:gap-8 md:justify-center md:flex-wrap">
          {displayBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/urunler?brand=${brand.slug}`}
              className="flex shrink-0 flex-col items-center gap-2 transition-opacity hover:opacity-80"
              title={brand.name}
            >
              {brand.logo_url ? (
                <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-dark-50 p-2 dark:bg-dark-700 sm:h-14 sm:w-24">
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={80}
                    height={40}
                    className="h-full w-full object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-dark-100 dark:bg-dark-700 sm:h-14 sm:w-24">
                  <span className="text-[10px] font-bold text-dark-500 dark:text-dark-300">
                    {brand.name}
                  </span>
                </div>
              )}
              <span className="text-[10px] font-medium text-dark-500 dark:text-dark-400">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
