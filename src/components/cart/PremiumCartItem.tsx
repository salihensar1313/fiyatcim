"use client";

import { Crown, X, Wrench, Truck, Tv, Music, Shield, Headphones } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER } from "@/lib/premium";
import Link from "next/link";

const MINI_BENEFITS = [
  { icon: Wrench, text: "Ücretsiz Kurulum" },
  { icon: Truck, text: "Ücretsiz Kargo" },
  { icon: Tv, text: "Netflix Hediye" },
  { icon: Music, text: "Spotify Hediye" },
  { icon: Shield, text: "+1 Yıl Garanti" },
  { icon: Headphones, text: "7/24 Destek" },
];

export default function PremiumCartItem() {
  const { premiumInCart, setPremiumInCart } = useCart();
  const { isPremium } = useAuth();

  // Zaten premium ise veya sepette değilse gösterme
  if (isPremium) return null;

  if (!premiumInCart) {
    // Sepete ekle butonu — compact
    return (
      <div className="rounded-xl border-2 border-dashed border-amber-300/50 bg-amber-50/50 p-4 dark:border-amber-600/30 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-dark-900 dark:text-dark-50">
                Premium Üyelik Ekle
              </p>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                Ücretsiz kurulum + kargo + Netflix & Spotify
              </p>
            </div>
          </div>
          <button
            onClick={() => setPremiumInCart(true)}
            className="shrink-0 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-white transition-all hover:shadow-lg hover:shadow-amber-500/20"
          >
            +{formatPrice(PREMIUM_PRICE_WITH_ORDER)}
          </button>
        </div>
      </div>
    );
  }

  // Premium sepette — kart olarak göster
  return (
    <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-600/40">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20">
            <Crown size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark-900 dark:text-dark-50">
              Premium Üyelik
            </p>
            <p className="text-xs text-amber-600 font-medium">
              {formatPrice(PREMIUM_PRICE_WITH_ORDER)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setPremiumInCart(false)}
          className="rounded-full p-1 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-700"
          aria-label="Premium'u kaldır"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {MINI_BENEFITS.map((b) => (
          <div key={b.text} className="flex items-center gap-1 text-[10px] text-dark-600 dark:text-dark-300">
            <b.icon size={10} className="shrink-0 text-amber-500" />
            {b.text}
          </div>
        ))}
      </div>

      <Link
        href="/premium"
        className="mt-2 block text-center text-[10px] text-amber-600 hover:underline dark:text-amber-400"
      >
        Tüm avantajları gör →
      </Link>
    </div>
  );
}
