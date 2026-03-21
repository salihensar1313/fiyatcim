"use client";

import React, { useRef } from "react";
import Image from "next/image";
import type { ProductCard as ProductCardType } from "../types";
import { formatPriceTR } from "../engine/productQuery";

interface ProductCarouselProps {
  products: ProductCardType[];
  onAddToCart?: (productId: string) => void;
  onViewProduct?: (slug: string) => void;
}

const ProductCarousel = React.memo(function ProductCarousel({
  products,
  onAddToCart,
  onViewProduct,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scrollBy = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  };

  return (
    <div className="relative px-4 py-2">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {products.map(({ product, showAddToCart }, i) => {
          const imgSrc = product.images?.[0] || "/images/placeholder-product.png";
          const hasDiscount = product.sale_price && product.sale_price < product.price;
          const displayPrice = hasDiscount ? product.sale_price! : product.price;
          const discountPct = hasDiscount
            ? Math.round(((product.price - product.sale_price!) / product.price) * 100)
            : 0;

          return (
            <div
              key={product.id}
              className="flex w-[160px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-dark-600 dark:bg-dark-700"
              style={{ scrollSnapAlign: "start", animationDelay: `${i * 80}ms` }}
            >
              {/* Image */}
              <button
                onClick={() => onViewProduct?.(product.slug)}
                className="relative flex h-[100px] items-center justify-center bg-gray-50 p-2 dark:bg-dark-600"
              >
                <Image
                  src={imgSrc}
                  alt={product.name}
                  width={80}
                  height={80}
                  className="h-[80px] w-[80px] object-contain"
                  loading="lazy"
                />
                {discountPct > 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    %{discountPct}
                  </span>
                )}
              </button>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-1 p-2.5">
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-gray-800 dark:text-gray-200">
                  {product.name}
                </p>

                {/* Brand */}
                {product.brand && (
                  <span className="text-[10px] text-gray-400">{product.brand.name}</span>
                )}

                {/* Rating Stars (4.5 default) */}
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((star) => (
                    <svg key={star} className="h-2.5 w-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  {/* Half star */}
                  <div className="relative h-2.5 w-2.5">
                    <svg className="absolute inset-0 h-2.5 w-2.5 text-gray-200 dark:text-dark-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="absolute inset-0 w-[50%] overflow-hidden">
                      <svg className="h-2.5 w-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <span className="ml-0.5 text-[9px] text-gray-400">4.5</span>
                </div>

                {/* Price */}
                <div className="mt-auto flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-primary-600">
                    {formatPriceTR(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] text-gray-400 line-through">
                      {formatPriceTR(product.price)}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => onViewProduct?.(product.slug)}
                    className="flex-1 rounded-lg bg-gray-100 px-2 py-1.5 text-[10px] font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-dark-600 dark:text-gray-300 dark:hover:bg-dark-500"
                  >
                    İncele
                  </button>
                  {(showAddToCart ?? true) && (
                    <button
                      onClick={() => onAddToCart?.(product.id)}
                      className="flex-1 rounded-lg bg-primary-600 px-2 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-primary-700"
                    >
                      🛒 Ekle
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll arrows (desktop only) */}
      {products.length > 2 && (
        <>
          <button
            onClick={() => scrollBy(-1)}
            className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md backdrop-blur-sm transition-all hover:bg-white lg:flex dark:bg-dark-700/90 dark:hover:bg-dark-600"
          >
            <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md backdrop-blur-sm transition-all hover:bg-white lg:flex dark:bg-dark-700/90 dark:hover:bg-dark-600"
          >
            <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
    </div>
  );
});

export default ProductCarousel;
