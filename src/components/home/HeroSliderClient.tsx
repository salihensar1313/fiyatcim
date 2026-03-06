"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/types";

interface Props {
  slides: HeroSlide[];
}

export default function HeroSliderClient({ slides }: Props) {
  const [current, setCurrent] = useState(0);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
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

  if (slides.length === 0) return null;

  return (
    <section className="group/slider relative overflow-hidden bg-dark-900">
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-700 ${
              i === current ? "relative opacity-100" : "absolute inset-0 opacity-0"
            }`}
          >
            <div className="relative min-h-[380px] sm:min-h-[450px] lg:min-h-[540px]">
              <Image
                src={slide.image || "/images/hero/hero-main.png"}
                alt={slide.title}
                fill
                sizes="100vw"
                priority={i === 0}
                className="scale-[1.01] object-cover object-center"
              />

              <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-dark-900 via-dark-900/85 to-transparent" />

              <div className="container-custom relative z-10 flex min-h-[380px] items-center sm:min-h-[450px] lg:min-h-[540px]">
                <div className="max-w-lg py-12 text-center lg:py-16 lg:text-left">
                  <h1 className="text-3xl font-extrabold uppercase leading-tight text-white sm:text-4xl lg:text-5xl">
                    {slide.title}
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-base text-dark-200 sm:text-lg lg:mx-0">
                    {slide.subtitle}
                  </p>
                  <Link
                    href={slide.cta_link}
                    className="mt-6 inline-flex items-center rounded-lg bg-primary-600 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700"
                  >
                    {slide.cta_text}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
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
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? "w-8 bg-primary-600" : "w-2.5 bg-white dark:bg-dark-800/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
