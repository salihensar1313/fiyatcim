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
              {/* Slide görseli — Premium slide'da tıklanabilir */}
              {slide.cta_link === "/premium" ? (
                <Link
                  href="/premium"
                  className="absolute inset-0 z-10 flex items-center overflow-hidden"
                  ref={i === 0 ? () => setHeroLoaded(true) : undefined}
                >
                  {/* Pure CSS Premium Slide — no image needed */}
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-amber-950" />

                  {/* Animated glow orbs */}
                  <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-[100px] animate-pulse" />
                  <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-amber-400/8 blur-[120px] animate-pulse [animation-delay:1s]" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-300/5 blur-[150px] animate-pulse [animation-delay:2s]" />

                  {/* Sparkle particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, j) => (
                      <div
                        key={j}
                        className="absolute h-1 w-1 rounded-full bg-amber-300"
                        style={{
                          left: `${5 + (j * 47) % 90}%`,
                          top: `${10 + (j * 31) % 80}%`,
                          opacity: 0.15 + (j % 5) * 0.1,
                          animation: `pulse ${2 + (j % 3)}s ease-in-out infinite`,
                          animationDelay: `${(j * 0.3) % 3}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Gold border lines */}
                  <div className="absolute inset-4 rounded-2xl border border-amber-500/20 sm:inset-8" />
                  <div className="absolute inset-8 rounded-xl border border-amber-400/10 sm:inset-16" />

                  {/* Content */}
                  <div className="container-custom relative z-10 flex flex-col items-center text-center sm:flex-row sm:text-left">
                    {/* Left: Text */}
                    <div className="flex-1 px-4 sm:px-0">
                      {/* Crown icon */}
                      <div className="mb-4 flex justify-center sm:justify-start">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 sm:h-20 sm:w-20">
                          <svg className="h-8 w-8 text-dark-900 sm:h-10 sm:w-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400 sm:text-sm">
                        Fiyatcim Ayrıcalığı
                      </p>
                      <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                        <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                          Premium Üyelik
                        </span>
                      </h2>
                      <p className="mt-3 max-w-md text-sm text-amber-100/60 sm:text-base lg:text-lg">
                        Ücretsiz kurulum, ücretsiz kargo, +1 yıl garanti ve 7/24 teknik destek.
                      </p>

                      {/* Avantajlar */}
                      <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start sm:mt-6 sm:gap-4">
                        {[
                          { icon: "🔧", text: "Ücretsiz Kurulum" },
                          { icon: "🚚", text: "Ücretsiz Kargo" },
                          { icon: "🛡️", text: "+1 Yıl Garanti" },
                          { icon: "📞", text: "7/24 Destek" },
                        ].map((item) => (
                          <span key={item.text} className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur-sm sm:text-sm">
                            <span>{item.icon}</span> {item.text}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="mt-6 sm:mt-8">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3.5 text-sm font-bold text-dark-900 shadow-lg shadow-amber-500/30 transition-all hover:shadow-amber-500/50 sm:px-10 sm:py-4 sm:text-base">
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                          </svg>
                          Premium Üye Ol
                        </span>
                      </div>
                    </div>

                    {/* Right: Price cards */}
                    <div className="mt-6 flex flex-col gap-3 sm:mt-0 sm:ml-8 lg:ml-16">
                      {/* Siparişle birlikte */}
                      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-dark-900/80 px-6 py-5 text-center backdrop-blur-sm sm:px-8 sm:py-6">
                        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-500/10 blur-xl" />
                        <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
                          Siparişle Birlikte
                        </p>
                        <p className="mt-1 text-3xl font-black text-white sm:text-4xl">
                          ₺2.500
                        </p>
                        <p className="mt-1 text-xs text-amber-200/50">Sepete otomatik eklenir</p>
                      </div>
                      {/* Sadece premium */}
                      <div className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-dark-800/60 px-6 py-4 text-center backdrop-blur-sm sm:px-8">
                        <p className="text-xs font-medium uppercase tracking-wider text-dark-400">
                          Ayrıca Satın Al
                        </p>
                        <p className="mt-1 text-2xl font-bold text-dark-300 line-through decoration-amber-500/50 sm:text-3xl">
                          ₺3.000
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <>
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
                </>
              )}
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
