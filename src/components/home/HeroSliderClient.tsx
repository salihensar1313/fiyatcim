"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/types";
import { usePersonalization } from "@/hooks/usePersonalization";

interface Props {
  slides: HeroSlide[];
}

export default function HeroSliderClient({ slides }: Props) {
  const { personalizeSlideOrder } = usePersonalization();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // IBP: İlgili kategori slide'ını öne al — yalnızca mount sonrası (hydration uyumu)
  const orderedSlides = useMemo(
    () => (hasMounted ? personalizeSlideOrder(slides) : slides),
    [slides, personalizeSlideOrder, hasMounted]
  );

  const [current, setCurrent] = useState(0);

  // Auto-play
  useEffect(() => {
    if (orderedSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % orderedSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [orderedSlides.length]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + orderedSlides.length) % orderedSlides.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % orderedSlides.length);
  };

  // Touch swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const [heroLoaded, setHeroLoaded] = useState(false);

  if (orderedSlides.length === 0) return null;

  return (
    <section className="group/slider relative overflow-hidden bg-dark-900">
      {/* Skeleton placeholder while first image loads */}
      {!heroLoaded && (
        <div className="absolute inset-0 z-[1] min-h-[300px] sm:min-h-[400px] lg:min-h-[540px]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-dark-800 via-dark-700 to-dark-800" />
          <div className="container-custom relative flex min-h-[300px] items-center sm:min-h-[400px] lg:min-h-[540px]">
            <div className="w-full max-w-lg py-8 sm:py-12 lg:py-16">
              <div className="mx-auto h-8 w-3/4 rounded bg-dark-600 sm:mx-0 sm:h-10 lg:h-14" />
              <div className="mx-auto mt-4 h-4 w-2/3 rounded bg-dark-700 sm:mx-0 sm:h-5" />
              <div className="mx-auto mt-6 h-11 w-40 rounded-lg bg-dark-600 sm:mx-0" />
            </div>
          </div>
        </div>
      )}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {orderedSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`transition-[opacity,visibility] duration-700 ${
              i === current
                ? "relative z-[2] visible opacity-100"
                : "invisible absolute inset-0 z-[1] opacity-0 pointer-events-none"
            }`}
            aria-hidden={i !== current}
          >
            <div className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-[540px]">
              <Image
                src={slide.image || "/images/hero/hero-main.webp"}
                alt={slide.title}
                fill
                sizes="100vw"
                priority={i === 0}
                className="scale-[1.01] object-cover object-center"
                onLoad={i === 0 ? () => setHeroLoaded(true) : undefined}
              />

              {/* Full overlay on mobile for readability, gradient on desktop */}
              <div className="absolute inset-0 bg-dark-900/60 sm:bg-[linear-gradient(to_right,rgba(15,23,42,0.9)_0%,rgba(15,23,42,0.7)_25%,rgba(15,23,42,0.2)_50%,transparent_65%)]" />

              <div className="container-custom relative z-10 flex min-h-[300px] items-center sm:min-h-[400px] lg:min-h-[540px]">
                <div className="w-full max-w-lg py-8 text-center sm:py-12 sm:text-left lg:py-16">
                  <h2 className="text-2xl font-extrabold uppercase leading-tight text-white sm:text-3xl lg:text-5xl">
                    {slide.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm text-dark-200 sm:mx-0 sm:mt-4 sm:text-base lg:text-lg">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.cta_link}
                    className="mt-5 inline-flex items-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 active:scale-95 sm:mt-6 sm:px-8 sm:py-3.5"
                  >
                    {slide.cta_text}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orderedSlides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white dark:bg-dark-800/40 opacity-0 group-hover/slider:opacity-100 lg:block"
            aria-label="Onceki slayt"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white dark:bg-dark-800/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white dark:bg-dark-800/40 opacity-0 group-hover/slider:opacity-100 lg:block"
            aria-label="Sonraki slayt"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {orderedSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Slayt ${i + 1}`}
            aria-pressed={i === current}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? "w-8 bg-primary-600" : "w-2.5 bg-white dark:bg-dark-800/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
