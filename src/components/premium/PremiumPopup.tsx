"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Crown, Wrench, Truck, Tv, Music, Headphones, Shield, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER } from "@/lib/premium";
import { useAuth } from "@/context/AuthContext";

const BENEFITS = [
  { icon: Wrench, text: "Ücretsiz Profesyonel Kurulum", sub: "*Tüm ürünlerde", color: "from-amber-400 to-orange-500" },
  { icon: Truck, text: "Her Siparişte Ücretsiz Kargo", sub: "*Tutar sınırı yok", color: "from-blue-400 to-blue-600" },
  { icon: Tv, text: "1 Ay Ücretsiz Netflix", sub: "*Üyelik boyunca", color: "from-red-500 to-red-700" },
  { icon: Music, text: "1 Ay Ücretsiz Spotify Premium", sub: "*Üyelik boyunca", color: "from-green-400 to-green-600" },
  { icon: Shield, text: "+1 Yıl Uzatılmış Garanti", sub: "*Tüm ürünlerde", color: "from-purple-400 to-purple-600" },
  { icon: Headphones, text: "7/24 Öncelikli Destek Hattı", sub: "*Premium üyelere özel", color: "from-teal-400 to-teal-600" },
];

const STORAGE_KEY = "fiyatcim_premium_popup_dismissed";

export default function PremiumPopup() {
  const { isPremium } = useAuth();
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Zaten premium ise popup gösterme
    if (isPremium) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }
    const timer = setTimeout(() => {
      setShow(true);
      requestAnimationFrame(() => setVisible(true));
    }, 2000);
    return () => clearTimeout(timer);
  }, [isPremium]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 300);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-500 dark:bg-dark-800 ${
          visible ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-8"
        }`}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/20 p-1.5 text-white/80 backdrop-blur-sm transition-all hover:bg-white/30 hover:text-white"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        {/* Header — animated gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-6 pb-7 pt-8 text-center">
          {/* Animated background particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-4 top-8 h-24 w-24 animate-float rounded-full bg-amber-500/10 blur-2xl" />
            <div className="absolute -right-4 top-4 h-20 w-20 animate-float rounded-full bg-orange-500/10 blur-2xl" style={{ animationDelay: "1s" }} />
            <div className="absolute bottom-2 left-1/3 h-16 w-16 animate-float rounded-full bg-yellow-500/10 blur-2xl" style={{ animationDelay: "0.5s" }} />
            {/* Sparkle particles */}
            <Sparkles size={10} className="absolute left-[15%] top-[20%] animate-sparkle text-amber-400/60" />
            <Sparkles size={8} className="absolute right-[20%] top-[30%] animate-sparkle text-yellow-400/50" style={{ animationDelay: "0.7s" }} />
            <Sparkles size={12} className="absolute left-[60%] top-[15%] animate-sparkle text-orange-400/40" style={{ animationDelay: "1.4s" }} />
          </div>

          <div className="relative z-10">
            {/* Crown icon — glowing */}
            <div className="mx-auto mb-4 flex h-16 w-16 animate-premium-glow items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Crown size={32} className="animate-float text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {formatPrice(PREMIUM_PRICE_WITH_ORDER)}&apos;ye Premium&apos;a geç,
            </h2>
            <p className="mt-1 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-lg font-bold text-transparent">
              avantajlarını katla!
            </p>
          </div>
        </div>

        {/* Benefits — staggered animation */}
        <div className="space-y-2 px-5 py-5">
          {BENEFITS.map((b, i) => (
            <div
              key={b.text}
              className="animate-slide-up flex items-center gap-3 rounded-xl border border-dark-100/80 bg-white p-3 transition-all hover:border-amber-200 hover:shadow-md dark:border-dark-700 dark:bg-dark-700/50 dark:hover:border-amber-600/40"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${b.color} shadow-sm`}>
                <b.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900 dark:text-dark-50">{b.text}</p>
                <p className="text-[11px] text-dark-400">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-dark-100 px-5 pb-5 pt-4 dark:border-dark-700">
          <p className="mb-3 text-center text-xs text-dark-500 dark:text-dark-400">
            Daha fazla avantaj için{" "}
            <Link href="/premium" className="font-semibold text-amber-600 hover:underline" onClick={handleClose}>
              Premium&apos;u keşfet!
            </Link>
          </p>
          {/* CTA — shiny button */}
          <Link
            href="/premium"
            onClick={handleClose}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3.5 text-base font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <Crown size={18} className="relative z-10" />
            <span className="relative z-10">Premium&apos;a Geç</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
