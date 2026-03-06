"use client";

import { useCurrency } from "@/context/CurrencyContext";
import { formatUSD } from "@/lib/utils";

interface PriceDisplayProps {
  /** USD fiyat (ana fiyat) */
  priceUsd: number;
  /** USD indirimli fiyat */
  salePriceUsd?: number | null;
  /** TL fiyat (opsiyonel, yoksa USD*kur ile hesaplan\u0131r) */
  priceTry?: number;
  /** TL indirimli fiyat */
  salePriceTry?: number | null;
  /** Boyut varyant\u0131 */
  size?: "sm" | "md" | "lg";
  /** Sadece TL g\u00f6ster (sepet \u00f6zeti vb.) */
  showOnlyTL?: boolean;
}

export default function PriceDisplay({
  priceUsd,
  salePriceUsd,
  priceTry,
  salePriceTry,
  size = "md",
  showOnlyTL = false,
}: PriceDisplayProps) {
  const { usdToTry } = useCurrency();

  const effectiveUsd = salePriceUsd && salePriceUsd < priceUsd ? salePriceUsd : priceUsd;
  const hasDiscount = salePriceUsd != null && salePriceUsd < priceUsd;

  // TL fiyat: verildiyse onu kullan, yoksa kur ile hesapla
  const effectiveTry = salePriceTry && salePriceTry < (priceTry || Infinity)
    ? salePriceTry
    : hasDiscount
      ? usdToTry(effectiveUsd)
      : priceTry || usdToTry(priceUsd);

  const originalTry = priceTry || usdToTry(priceUsd);

  // Format TL
  const formatTL = (val: number) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);

  const sizeClasses = {
    sm: { usd: "text-base font-bold", tl: "text-sm", old: "text-sm" },
    md: { usd: "text-xl font-bold", tl: "text-base", old: "text-base" },
    lg: { usd: "text-3xl font-extrabold", tl: "text-lg", old: "text-lg" },
  };

  const cls = sizeClasses[size];

  if (showOnlyTL) {
    return (
      <span className={`${cls.usd} text-dark-900 dark:text-dark-50`}>
        {formatTL(effectiveTry)}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Ana sat\u0131r: USD fiyat + eski fiyat */}
      <div className="flex items-center gap-2">
        <span className={`${cls.usd} text-dark-900 dark:text-dark-50`}>
          {formatUSD(effectiveUsd)}
        </span>
        {hasDiscount && (
          <span className={`${cls.old} text-dark-400 line-through`}>
            {formatUSD(priceUsd)}
          </span>
        )}
      </div>
      {/* Alt sat\u0131r: TL kar\u015f\u0131l\u0131\u011f\u0131 */}
      <div className="flex items-center gap-1">
        <span className={`${cls.tl} font-semibold text-primary-600`}>
          {formatTL(effectiveTry)}
        </span>
        {hasDiscount && (
          <span className={`text-[10px] text-dark-300 line-through`}>
            {formatTL(originalTry)}
          </span>
        )}
      </div>
    </div>
  );
}
