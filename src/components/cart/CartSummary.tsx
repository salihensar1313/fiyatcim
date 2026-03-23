"use client";

import Link from "next/link";
import { ShoppingBag, Crown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import CouponInput from "./CouponInput";

export default function CartSummary() {
  const { getSubtotal, getShipping, getGiftWrapTotal, getPremiumCost, getTotal, discount, getItemCount, premiumInCart, setPremiumInCart } = useCart();

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const giftWrapTotal = getGiftWrapTotal();
  const premiumCost = getPremiumCost();
  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
      <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Sipariş Özeti</h3>

      {/* Premium Upsell — ücretsiz kargo progress bar yerine */}
      {shipping > 0 && (
        <Link
          href="/premium"
          className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300/50 bg-amber-50 p-3 transition-colors hover:bg-amber-100 dark:border-amber-600/30 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
            <Crown size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
              Premium ol, kargo ücretsiz olsun!
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
              + Ücretsiz kurulum, Netflix & Spotify hediye
            </p>
          </div>
        </Link>
      )}

      {/* Coupon */}
      <CouponInput />

      {/* Lines */}
      <div className="mt-4 space-y-3 border-t border-dark-100 pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-600 dark:text-dark-300">Ara Toplam ({itemCount} ürün)</span>
          <span className="font-medium text-dark-900 dark:text-dark-50">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600">Kupon İndirimi</span>
            <span className="font-medium text-green-600">-{formatPrice(discount)}</span>
          </div>
        )}
        {giftWrapTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-600 dark:text-dark-300">Hediye Paketi</span>
            <span className="font-medium text-dark-900 dark:text-dark-50">{formatPrice(giftWrapTotal)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-600 dark:text-dark-300">Kargo</span>
          <span className="font-medium text-dark-900 dark:text-dark-50">
            {shipping === 0 ? (
              <span className="text-green-600">Ücretsiz</span>
            ) : (
              <span>{formatPrice(shipping)}</span>
            )}
          </span>
        </div>
        {premiumCost > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-amber-600">
              <Crown size={12} /> Premium Üyelik
            </span>
            <span className="font-medium text-amber-600">{formatPrice(premiumCost)}</span>
          </div>
        )}
      </div>

      {/* KDV */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-dark-600 dark:text-dark-300">KDV (%20 dahil)</span>
        <span className="font-medium text-dark-900 dark:text-dark-50">{formatPrice(total - total / 1.2)}</span>
      </div>

      {/* Total */}
      <div className="mt-3 flex items-center justify-between border-t border-dark-100 pt-4">
        <span className="text-base font-bold text-dark-900 dark:text-dark-50">Toplam (KDV Dahil)</span>
        <span className="text-xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(total)}</span>
      </div>

      {/* Checkout Button */}
      <Link
        href="/odeme"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700"
      >
        <ShoppingBag size={18} />
        Ödemeye Geç
      </Link>

      {/* Continue shopping */}
      <Link
        href="/urunler"
        className="mt-3 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        Alışverişe Devam Et
      </Link>
    </div>
  );
}
