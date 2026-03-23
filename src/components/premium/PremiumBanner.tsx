"use client";

import Link from "next/link";
import { Crown, Wrench, Headphones, Shield, Zap, Tv, Music, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER, PREMIUM_PRICE_STANDALONE } from "@/lib/premium";

interface PremiumBannerProps {
  /** "home" = ana sayfa geniş, "product" = ürün detay kompakt, "cart" = sepette upsell */
  variant?: "home" | "product" | "cart";
}

export default function PremiumBanner({ variant = "home" }: PremiumBannerProps) {
  if (variant === "product") {
    return (
      <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-600/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-dark-900 dark:text-dark-50">
              Bu ürünü <span className="text-amber-600">ücretsiz kurdurabilirsiniz!</span>
            </p>
            <p className="text-xs text-dark-500 dark:text-dark-400">
              Premium üyelikle profesyonel kurulum + 7/24 destek + Netflix & Spotify hediye.
              Siparişle birlikte sadece <strong className="text-amber-600">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</strong>
            </p>
          </div>
          <Link
            href="/premium"
            className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600"
          >
            Detay
          </Link>
        </div>
      </div>
    );
  }

  if (variant === "cart") {
    return (
      <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/20 dark:border-amber-600/40">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={20} className="text-amber-500" />
          <h3 className="text-base font-bold text-dark-900 dark:text-dark-50">Premium Üyelik Ekle</h3>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/50 dark:text-green-300">
            %17 TASARRUF
          </span>
        </div>
        <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
          Siparişinizle birlikte alın, <strong>ücretsiz profesyonel kurulum</strong> + 7/24 destek + 1 ay Netflix & Spotify hediye kazanın.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-amber-600">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</span>
            <span className="ml-2 text-sm text-dark-400 line-through">{formatPrice(PREMIUM_PRICE_STANDALONE)}</span>
          </div>
          <Link
            href="/premium"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600"
          >
            <Crown size={16} />
            Premium Ol
          </Link>
        </div>
      </div>
    );
  }

  // variant === "home" — büyük banner
  return (
    <section className="py-10 sm:py-14">
      <div className="container-custom">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
          <div className="relative px-6 py-10 sm:px-10 sm:py-14">
            {/* Decorative */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
              {/* Left */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5">
                  <Crown size={16} className="text-amber-400" />
                  <span className="text-sm font-bold text-amber-400">Premium Üyelik</span>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                  Profesyonel Kurulum <span className="text-amber-400">Ücretsiz!</span>
                </h2>
                <p className="mb-6 max-w-lg text-sm text-dark-300 sm:text-base">
                  Premium üye olun, tüm ürünlerinizi uzman ekibimiz ücretsiz kursun.
                  7/24 öncelikli destek, genişletilmiş garanti ve çok daha fazlası.
                </p>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { icon: Wrench, text: "Ücretsiz Kurulum" },
                    { icon: Headphones, text: "7/24 Destek" },
                    { icon: Shield, text: "+1 Yıl Garanti" },
                    { icon: Zap, text: "Aynı Gün Kargo" },
                    { icon: Tv, text: "1 Ay Netflix Hediye" },
                    { icon: Music, text: "1 Ay Spotify Hediye" },
                  ].map((b) => (
                    <div key={b.text} className="flex items-center gap-2">
                      <b.icon size={14} className="shrink-0 text-amber-400" />
                      <span className="text-xs text-dark-200">{b.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                  <Link
                    href="/premium"
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-base font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/25"
                  >
                    <Crown size={18} />
                    Premium Üye Ol
                    <ArrowRight size={16} />
                  </Link>
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-bold text-white">
                      <span className="text-amber-400">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</span>
                      <span className="ml-2 text-sm text-dark-400 line-through">{formatPrice(PREMIUM_PRICE_STANDALONE)}</span>
                    </p>
                    <p className="text-xs text-dark-400">Siparişle birlikte alındığında</p>
                  </div>
                </div>
              </div>

              {/* Right — pricing cards */}
              <div className="flex w-full max-w-xs flex-col gap-3 lg:w-auto">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                  <p className="text-xs font-medium text-amber-300">Siparişle Birlikte</p>
                  <p className="text-3xl font-bold text-white">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</p>
                  <p className="mt-1 text-[10px] text-dark-400">Sepette otomatik uygulanır</p>
                </div>
                <div className="rounded-xl border border-dark-600 bg-dark-700/50 p-4 text-center">
                  <p className="text-xs font-medium text-dark-400">Sadece Premium</p>
                  <p className="text-2xl font-bold text-dark-200">{formatPrice(PREMIUM_PRICE_STANDALONE)}</p>
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
