"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBrands } from "@/lib/queries";
import type { Brand } from "@/types";

export default function BrandCarousel() {
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    getBrands().then(setBrands).catch(() => {});
  }, []);

  if (brands.length === 0) return null;

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

        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide sm:gap-5 md:justify-center md:flex-wrap md:gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/urunler?brand=${brand.slug}`}
              className="group flex shrink-0 flex-col items-center gap-1.5 transition-transform hover:scale-105"
              title={brand.name}
            >
              {brand.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  width={100}
                  height={40}
                  className="h-10 w-auto rounded transition-opacity group-hover:opacity-90"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-10 items-center justify-center rounded-md bg-dark-800 px-4 dark:bg-dark-600">
                  <span className="text-xs font-bold tracking-wide text-white">
                    {brand.name}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
