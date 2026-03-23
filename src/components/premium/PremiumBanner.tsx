"use client";

import Link from "next/link";
import { Crown, Wrench, Headphones, Shield, Truck, Tv, Music, ArrowRight, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER, PREMIUM_PRICE_STANDALONE } from "@/lib/premium";

interface PremiumBannerProps {
  variant?: "home" | "product" | "cart";
}

export default function PremiumBanner({ variant = "home" }: PremiumBannerProps) {
  if (variant === "product") {
    return (
      <Link
        href="/premium"
        className="group block overflow-hidden rounded-xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition-all hover:border-amber-400/70 hover:shadow-lg hover:shadow-amber-500/10 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-600/40"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
            <Crown size={20} className="animate-float text-white" />
            <Sparkles size={8} className="absolute -right-1 -top-1 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-dark-900 dark:text-dark-50">
              Bu ürünü <span className="text-amber-600">ücretsiz kurdurabilirsiniz!</span>
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              Premium üyelikle kurulum + kargo + Netflix & Spotify hediye.
              Sadece <strong className="text-amber-600">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</strong>
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-transform group-hover:scale-105">
            Detay →
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "cart") {
    return (
      <div className="relative overflow-hidden rounded-xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20 dark:border-amber-600/40">
        {/* Shine */}
        <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={20} className="animate-float text-amber-500" />
            <h3 className="text-base font-bold text-dark-900 dark:text-dark-50">Premium Üyelik Ekle</h3>
            <span className="animate-pulse rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
              %17 TASARRUF
            </span>
          </div>
          <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
            Siparişinizle birlikte alın, <strong>ücretsiz kurulum</strong> + ücretsiz kargo + Netflix & Spotify hediye kazanın.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-amber-600">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</span>
              <span className="ml-2 text-sm text-dark-400 line-through">{formatPrice(PREMIUM_PRICE_STANDALONE)}</span>
            </div>
            <Link
              href="/premium"
              className="group relative flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition-all hover:shadow-lg"
            >
              <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Crown size={16} className="relative z-10" />
              <span className="relative z-10">Premium Ol</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // variant === "home" — büyük gösterişli banner
  return (
    <section className="py-10 sm:py-14">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-20 h-72 w-72 animate-float rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-52 w-52 animate-float rounded-full bg-orange-500/10 blur-3xl" style={{ animationDelay: "1.5s" }} />
            <div className="absolute left-1/2 top-1/4 h-40 w-40 animate-float rounded-full bg-yellow-500/5 blur-3xl" style={{ animationDelay: "0.8s" }} />
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16">
            <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-14">
              {/* Left */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
                  <Crown size={16} className="animate-float text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Premium Üyelik</span>
                  <Sparkles size={12} className="text-amber-400/50" />
                </div>
                <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                  Profesyonel Kurulum{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
                    Ücretsiz!
                  </span>
                </h2>
                <p className="mb-6 max-w-lg text-sm text-dark-300 sm:text-base">
                  Premium üye olun, tüm ürünlerinizi uzman ekibimiz ücretsiz kursun.
                  Netflix, Spotify, ücretsiz kargo ve çok daha fazlası.
                </p>

                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { icon: Wrench, text: "Ücretsiz Kurulum" },
                    { icon: Truck, text: "Ücretsiz Kargo" },
                    { icon: Shield, text: "+1 Yıl Garanti" },
                    { icon: Tv, text: "Netflix Hediye" },
                    { icon: Music, text: "Spotify Hediye" },
                    { icon: Headphones, text: "7/24 Destek" },
                  ].map((b) => (
                    <div key={b.text} className="flex items-center gap-2">
                      <b.icon size={14} className="shrink-0 text-amber-400" />
                      <span className="text-xs text-dark-200">{b.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row lg:items-start">
                  <Link
                    href="/premium"
                    className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-8 py-3.5 text-base font-bold text-white shadow-xl shadow-amber-500/25 transition-all hover:shadow-2xl hover:shadow-amber-500/40"
                  >
                    <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <Crown size={18} className="relative z-10" />
                    <span className="relative z-10">Premium Üye Ol</span>
                    <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-white">
                      <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</span>
                      <span className="ml-2 text-sm text-dark-500 line-through">{formatPrice(PREMIUM_PRICE_STANDALONE)}</span>
                    </p>
                    <p className="text-xs text-dark-500">Siparişle birlikte</p>
                  </div>
                </div>
              </div>

              {/* Right — animated pricing cards */}
              <div className="flex w-full max-w-xs flex-col gap-4 lg:w-auto">
                <div className="animate-premium-glow rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center backdrop-blur-sm">
                  <p className="text-xs font-medium text-amber-300">Siparişle Birlikte</p>
                  <p className="bg-gradient-to-r from-white to-amber-100 bg-clip-text text-4xl font-bold text-transparent">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</p>
                  <p className="mt-1 text-[10px] text-dark-400">Sepette otomatik uygulanır</p>
                </div>
                <div className="rounded-2xl border border-dark-600 bg-dark-700/50 p-5 text-center backdrop-blur-sm">
                  <p className="text-xs font-medium text-dark-400">Sadece Premium</p>
                  <p className="text-3xl font-bold text-dark-200">{formatPrice(PREMIUM_PRICE_STANDALONE)}</p>
                  <p className="mt-1 text-[10px] text-dark-500">Sipariş olmadan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
