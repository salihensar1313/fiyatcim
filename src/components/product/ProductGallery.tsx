"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import { CATEGORY_IMAGES, CATEGORY_IMAGES_BY_SLUG } from "@/lib/constants";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  categoryId?: string;
  categorySlug?: string;
}

export default function ProductGallery({ images, productName, categoryId, categorySlug }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lensActive, setLensActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 50, y: 50 });
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const categoryFallback = (categoryId && CATEGORY_IMAGES[categoryId])
    || (categorySlug && CATEGORY_IMAGES_BY_SLUG[categorySlug])
    || "/images/categories/alarm.png";

  const [imgSrc, setImgSrc] = useState(images[activeIndex] || categoryFallback);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const url = images[activeIndex] || categoryFallback;
    setImgSrc(failedUrls.has(url) ? categoryFallback : url);
  }, [activeIndex, images, categoryFallback, failedUrls]);

  const productImage = imgSrc;

  const goTo = (index: number) => {
    if (index < 0) setActiveIndex(images.length - 1);
    else if (index >= images.length) setActiveIndex(0);
    else setActiveIndex(index);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Image with Hover Zoom */}
      <div className="relative overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div
          ref={imgContainerRef}
          className="relative aspect-square cursor-crosshair"
          onMouseEnter={() => setLensActive(true)}
          onMouseLeave={() => setLensActive(false)}
          onMouseMove={handleMouseMove}
        >
          <div className="relative h-full w-full bg-white dark:bg-dark-800 p-8">
            <Image
              src={productImage}
              alt={productName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain transition-transform duration-300"
              style={lensActive ? {
                transform: "scale(2)",
                transformOrigin: `${lensPos.x}% ${lensPos.y}%`,
              } : undefined}
              onError={() => {
                setFailedUrls((prev) => new Set(prev).add(productImage));
                setImgSrc(categoryFallback);
              }}
            />
          </div>

          {/* Lens indicator */}
          {lensActive && (
            <div
              className="pointer-events-none absolute h-24 w-24 rounded-full border-2 border-primary-600/50 bg-white dark:bg-dark-800/10"
              style={{
                left: `calc(${lensPos.x}% - 48px)`,
                top: `calc(${lensPos.y}% - 48px)`,
              }}
            />
          )}

          {/* Zoom button (opens full modal) */}
          <button
            onClick={() => setZoomed(true)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white dark:bg-dark-800/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white dark:bg-dark-800"
          >
            <ZoomIn size={20} className="text-dark-600 dark:text-dark-300" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white dark:bg-dark-800"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white dark:bg-dark-800"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white dark:bg-dark-800 transition-all ${
                activeIndex === index ? "border-primary-600 ring-2 ring-primary-600/20" : "border-dark-100 hover:border-dark-300"
              }`}
            >
              <div className="relative h-full w-full p-1">
                <Image
                  src={productImage}
                  alt={`${productName} - ${index + 1}`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[85vh] w-[85vw] rounded-xl bg-white dark:bg-dark-800 p-4">
              <Image
                src={productImage}
                alt={productName}
                fill
                sizes="85vw"
                className="object-contain"
                onError={() => {
                  setFailedUrls((prev) => new Set(prev).add(productImage));
                  setImgSrc(categoryFallback);
                }}
              />
            </div>

            {/* Close button */}
            <button
              onClick={() => setZoomed(false)}
              className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-dark-800 shadow-lg transition-transform hover:scale-110"
            >
              <X size={20} />
            </button>

            {/* Navigation in modal */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/90 p-3 shadow-lg transition-all hover:bg-white dark:bg-dark-800"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/90 p-3 shadow-lg transition-all hover:bg-white dark:bg-dark-800"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
