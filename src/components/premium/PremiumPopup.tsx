"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Crown, Wrench, Truck, Tv, Music, Headphones, Shield } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER } from "@/lib/premium";

const BENEFITS = [
  { icon: Wrench, text: "Ücretsiz Profesyonel Kurulum", sub: "*Tüm ürünlerde", color: "bg-amber-100 text-amber-600" },
  { icon: Truck, text: "Her Siparişte Ücretsiz Kargo", sub: "*Tutar sınırı yok", color: "bg-blue-100 text-blue-600" },
  { icon: Tv, text: "1 Ay Ücretsiz Netflix", sub: "*Üyelik boyunca", color: "bg-red-100 text-red-600" },
  { icon: Music, text: "1 Ay Ücretsiz Spotify Premium", sub: "*Üyelik boyunca", color: "bg-green-100 text-green-600" },
  { icon: Shield, text: "+1 Yıl Uzatılmış Garanti", sub: "*Tüm ürünlerde", color: "bg-purple-100 text-purple-600" },
  { icon: Headphones, text: "7/24 Öncelikli Destek Hattı", sub: "*Premium üyelere özel", color: "bg-teal-100 text-teal-600" },
];

const STORAGE_KEY = "fiyatcim_premium_popup_dismissed";

export default function PremiumPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 2 saniye sonra göster — sadece daha önce kapatmamışsa
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      // 24 saat geçtiyse tekrar göster
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
    }
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 rounded-2xl bg-white shadow-2xl dark:bg-dark-800">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-dark-100 p-1.5 text-dark-500 transition-colors hover:bg-dark-200 dark:bg-dark-700 dark:text-dark-300"
          aria-label="Kapat"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="rounded-t-2xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {formatPrice(PREMIUM_PRICE_WITH_ORDER)}&apos;ye Premium&apos;a geç,
          </h2>
          <p className="text-lg font-bold text-amber-400">avantajlarını katla!</p>
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 px-5 py-5">
          {BENEFITS.map((b) => (
            <div
              key={b.text}
              className="flex items-center gap-3 rounded-xl border border-dark-100 bg-dark-50/50 p-3 dark:border-dark-700 dark:bg-dark-700/50"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${b.color}`}>
                <b.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-dark-900 dark:text-dark-50">{b.text}</p>
                <p className="text-[11px] text-dark-500 dark:text-dark-400">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-dark-100 px-5 pb-5 pt-4 dark:border-dark-700">
          <p className="mb-3 text-center text-xs text-dark-500 dark:text-dark-400">
            Daha fazla avantaj ve kampanya için{" "}
            <Link href="/premium" className="font-medium text-amber-600 hover:underline" onClick={handleClose}>
              Premium&apos;u keşfet!
            </Link>
          </p>
          <Link
            href="/premium"
            onClick={handleClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-base font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg"
          >
            <Crown size={18} />
            Premium&apos;a Geç
          </Link>
        </div>
      </div>
    </div>
  );
}
