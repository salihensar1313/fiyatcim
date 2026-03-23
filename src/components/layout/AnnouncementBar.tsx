"use client";

import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const { usdTry, isLoading } = useCurrency();

  if (!isVisible) return null;

  const formattedRate = usdTry.toFixed(2).replace(".", ",");

  return (
    <div className="relative bg-primary-600 px-4 py-2 text-center text-sm text-white">
      <div className="container-custom flex items-center justify-center gap-2 sm:gap-3">
        {/* Dolar Kuru */}
        <span className="hidden items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold sm:inline-flex">
          <DollarSign size={13} className="text-green-300" />
          <span className="text-green-200">USD/TRY:</span>{" "}
          {isLoading ? "..." : formattedRate}
        </span>

        {/* Separator - desktop */}
        <span className="hidden text-white/40 sm:inline">|</span>

        {/* Ana mesaj */}
        <span>
          <strong className="text-amber-300">Premium</strong> Üyelere{" "}
          <strong>Ücretsiz Kargo</strong> + Ücretsiz Kurulum |{" "}
          <strong>7/24</strong> Teknik Destek
        </span>

        {/* Dolar Kuru - mobile compact */}
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-200 sm:hidden">
          <DollarSign size={12} />
          {isLoading ? "..." : formattedRate}₺
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/80 transition-colors hover:text-white"
        aria-label="Kapat"
      >
        <X size={16} />
      </button>
    </div>
  );
}
