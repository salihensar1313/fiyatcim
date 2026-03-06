"use client";

import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";
import { get7DayChange } from "@/hooks/usePriceHistory";

interface PriceDropBadgeProps {
  productId: string;
  currentPrice: number;
}

export default function PriceDropBadge({ productId, currentPrice }: PriceDropBadgeProps) {
  const [change, setChange] = useState<number | null>(null);

  useEffect(() => {
    const result = get7DayChange(productId, currentPrice);
    setChange(result);
  }, [productId, currentPrice]);

  // Only show if price dropped (negative change)
  if (change === null || change >= 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
      <TrendingDown size={12} />
      %{Math.abs(change)} düştü
    </span>
  );
}
