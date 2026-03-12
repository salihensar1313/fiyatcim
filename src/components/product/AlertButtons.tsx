"use client";

import { useState } from "react";
import { Bell, BellOff, TrendingDown, Check } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useNotifications } from "@/components/ui/NotificationBell";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface AlertButtonsProps {
  product: Product;
}

export default function AlertButtons({ product }: AlertButtonsProps) {
  const { hasAlert, addPrice, addStock, remove } = useAlerts();
  const { addNotification } = useNotifications();
  const [showPriceInput, setShowPriceInput] = useState(false);
  const currentPrice = product.sale_price || product.price;
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.9));

  const hasPriceAlert = hasAlert(product.id, "price");
  const hasStockAlert = hasAlert(product.id, "stock");

  const handlePriceAlert = () => {
    if (hasPriceAlert) {
      remove(product.id, "price");
      return;
    }
    if (!showPriceInput) {
      setShowPriceInput(true);
      return;
    }
    if (targetPrice > 0 && targetPrice < currentPrice) {
      addPrice(product.id, product.name, targetPrice, currentPrice);
      addNotification({
        type: "promo",
        title: "Fiyat Alarmı Kuruldu",
        message: `${product.name} — ${formatPrice(targetPrice)} altına düşünce bildirim alacaksınız.`,
      });
      setShowPriceInput(false);
    }
  };

  const handleStockAlert = () => {
    if (hasStockAlert) {
      remove(product.id, "stock");
      return;
    }
    addStock(product.id, product.name);
    addNotification({
      type: "system",
      title: "Stok Alarmı Kuruldu",
      message: `${product.name} stoğa girince bildirim alacaksınız.`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Price Alert */}
      {product.stock > 0 && (
        <div>
          <button
            onClick={handlePriceAlert}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              hasPriceAlert
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                : "border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
            }`}
          >
            {hasPriceAlert ? (
              <>
                <Check size={16} />
                Fiyat Alarmı Aktif
              </>
            ) : (
              <>
                <TrendingDown size={16} />
                Fiyat Düşünce Haber Ver
              </>
            )}
          </button>

          {/* Price input */}
          {showPriceInput && !hasPriceAlert && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-700 p-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-dark-500 dark:text-dark-400">
                  Hedef fiyat (mevcut: {formatPrice(currentPrice)})
                </label>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  min={1}
                  max={currentPrice - 1}
                  className="w-full rounded border border-dark-200 dark:border-dark-600 bg-white dark:bg-dark-800 dark:text-dark-100 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <button
                onClick={handlePriceAlert}
                disabled={targetPrice <= 0 || targetPrice >= currentPrice}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Kur
              </button>
              <button
                onClick={() => setShowPriceInput(false)}
                className="text-sm text-dark-500 hover:text-dark-600 dark:text-dark-300"
              >
                İptal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stock Alert (only show when out of stock) */}
      {product.stock === 0 && (
        <button
          onClick={handleStockAlert}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
            hasStockAlert
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
              : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
          }`}
        >
          {hasStockAlert ? (
            <>
              <BellOff size={16} />
              Stok Alarmı Aktif
            </>
          ) : (
            <>
              <Bell size={16} />
              Stoğa Girince Haber Ver
            </>
          )}
        </button>
      )}
    </div>
  );
}
