"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/types";

interface Props {
  slides: HeroSlide[];
}

const PRANK_DEADLINE = new Date("2026-03-06T10:00:00Z"); // 13:00 TR

export default function HeroSliderClient({ slides }: Props) {
  const [current, setCurrent] = useState(0);

  // Şaka süresi dolduysa VIP slide'ı filtrele
  const activeSlides = typeof window !== "undefined" && new Date() > PRANK_DEADLINE
    ? slides.filter((s) => s.id !== "hero-vip")
    : slides;

  // Auto-play
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  useEffect(() => {
    if (current >= activeSlides.length) setCurrent(0);
  }, [activeSlides.length, current]);

  const goPrev = () => {
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  };

  if (activeSlides.length === 0) return null;

  return (
    <section className="group/slider relative overflow-hidden bg-dark-900">
      <div className="relative">
        {activeSlides.map((slide, i) => (
          <div
            key={slide.id}
            className={`transition-opacity duration-700 ${
              i === current ? "relative opacity-100" : "absolute inset-0 opacity-0"
            }`}
          >
            <div className="relative min-h-[380px] sm:min-h-[450px] lg:min-h-[540px]">
              {slide.image?.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 h-full w-full scale-[1.01] object-cover object-center"
                />
              ) : (
                <Image
                  src={slide.image || "/images/hero/hero-main.png"}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  priority={i === 0}
                  className={`scale-[1.01] object-cover ${
                    slide.id === "hero-vip" ? "object-[center_15%]" : "object-center"
                  }`}
                />
              )}

              <div className={`absolute inset-y-0 left-0 bg-gradient-to-r from-dark-900 via-dark-900/85 to-transparent ${
                slide.id === "hero-vip" ? "w-2/5" : "w-3/5"
              }`} />

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

      {activeSlides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 opacity-0 group-hover/slider:opacity-100"
            aria-label="Onceki slayt"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/40 opacity-0 group-hover/slider:opacity-100"
            aria-label="Sonraki slayt"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {activeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 rounded-full transition-all ${
              i === current ? "w-8 bg-primary-600" : "w-2.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
