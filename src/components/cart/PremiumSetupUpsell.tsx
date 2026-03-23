"use client";

import { Shield, Wrench, Headphones, CheckCircle2, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_SETUP_COST } from "@/lib/constants";

const BENEFITS = [
  { icon: Wrench, text: "Profesyonel kurulum (kamera, alarm, kilit)" },
  { icon: Headphones, text: "1 yıl öncelikli teknik destek hattı" },
  { icon: Shield, text: "Kurulum sonrası sistem testi ve rapor" },
  { icon: Star, text: "Uzaktan erişim & mobil uygulama kurulumu" },
];

export default function PremiumSetupUpsell() {
  const { premiumSetup, setPremiumSetup } = useCart();

  return (
    <div
      className={`mt-4 rounded-xl border-2 transition-all ${
        premiumSetup
          ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-950/30"
          : "border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800"
      } p-5`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            premiumSetup ? "bg-primary-600" : "bg-gradient-to-br from-amber-400 to-orange-500"
          }`}>
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50">
                Premium Kurulum Desteği
              </h3>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                ÖNERİLEN
              </span>
            </div>
            <p className="mt-0.5 text-xs text-dark-500 dark:text-dark-400">
              Uzman ekibimiz ürünlerinizi profesyonelce kurar
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-bold text-dark-900 dark:text-dark-50">
          {formatPrice(PREMIUM_SETUP_COST)}
        </span>
      </div>

      {/* Benefits */}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BENEFITS.map((b) => (
          <div key={b.text} className="flex items-center gap-2 text-xs text-dark-600 dark:text-dark-300">
            <b.icon size={14} className={premiumSetup ? "text-primary-600" : "text-amber-500"} />
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setPremiumSetup(!premiumSetup)}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all ${
          premiumSetup
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "border-2 border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40"
        }`}
      >
        {premiumSetup ? (
          <>
            <CheckCircle2 size={16} />
            Premium Kurulum Eklendi
          </>
        ) : (
          <>
            <Shield size={16} />
            Premium Kurulum Ekle — {formatPrice(PREMIUM_SETUP_COST)}
          </>
        )}
      </button>

      {premiumSetup && (
        <p className="mt-2 text-center text-[11px] text-primary-600 dark:text-primary-400">
          Sipariş sonrası ekibimiz sizinle iletişime geçecektir.
        </p>
      )}
    </div>
  );
}
