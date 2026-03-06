"use client";

import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import CouponInput from "./CouponInput";

export default function CartSummary() {
  const { getSubtotal, getShipping, getGiftWrapTotal, getTotal, discount, getItemCount } = useCart();
  const settings = useSettings();

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const giftWrapTotal = getGiftWrapTotal();
  const total = getTotal();
  const itemCount = getItemCount();
  const threshold = settings.freeShippingThreshold;

  const remainingForFreeShipping = threshold - subtotal;
  const freeShippingProgress = Math.min((subtotal / threshold) * 100, 100);

  return (
    <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
      <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Sipariş Özeti</h3>

      {/* Free shipping progress */}
      {remainingForFreeShipping > 0 && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Truck size={16} />
            <span>
              Ücretsiz kargo için <strong>{formatPrice(remainingForFreeShipping)}</strong> daha ekleyin!
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>
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
              formatPrice(shipping)
            )}
          </span>
        </div>
      </div>

      {/* KDV — fiyatlar zaten KDV dahil, sadece KDV tutarını göster */}
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
