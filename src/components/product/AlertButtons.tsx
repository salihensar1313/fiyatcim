"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, TrendingDown, Check } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useNotifications } from "@/components/ui/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface AlertButtonsProps {
  product: Product;
}

export default function AlertButtons({ product }: AlertButtonsProps) {
  const { hasAlert, addPrice, addStock, remove } = useAlerts();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [showPriceInput, setShowPriceInput] = useState(false);
  const currentPrice = product.sale_price || product.price;
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.9));
  const [dbPriceAlert, setDbPriceAlert] = useState(false);
  const [dbStockAlert, setDbStockAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check DB alerts for logged-in users
  useEffect(() => {
    if (!user) return;
    fetch("/api/alerts")
      .then(r => r.json())
      .then((alerts: { product_id: string; alert_type: string }[]) => {
        if (Array.isArray(alerts)) {
          setDbPriceAlert(alerts.some(a => a.product_id === product.id && a.alert_type === "price"));
          setDbStockAlert(alerts.some(a => a.product_id === product.id && a.alert_type === "stock"));
        }
      })
      .catch(() => {});
  }, [user, product.id]);

  const hasPriceAlert = user ? dbPriceAlert : hasAlert(product.id, "price");
  const hasStockAlert = user ? dbStockAlert : hasAlert(product.id, "stock");

  const handlePriceAlert = async () => {
    if (hasPriceAlert) {
      if (user) {
        setLoading(true);
        await fetch(`/api/alerts?productId=${product.id}&alertType=price`, { method: "DELETE" });
        setDbPriceAlert(false);
        setLoading(false);
      } else {
        remove(product.id, "price");
      }
      return;
    }
    if (!showPriceInput) {
      setShowPriceInput(true);
      return;
    }
    if (targetPrice > 0 && targetPrice < currentPrice) {
      if (user) {
        setLoading(true);
        const res = await fetch("/api/alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            alertType: "price",
            targetPrice,
            currentPrice,
          }),
        });
        if (res.ok) setDbPriceAlert(true);
        setLoading(false);
      } else {
        addPrice(product.id, product.name, targetPrice, currentPrice);
      }
      addNotification({
        type: "promo",
        title: "Fiyat Alarmi Kuruldu",
        message: `${product.name} — ${formatPrice(targetPrice)} altina dusunce bildirim alacaksiniz.`,
      });
      setShowPriceInput(false);
    }
  };

  const handleStockAlert = async () => {
    if (hasStockAlert) {
      if (user) {
        setLoading(true);
        await fetch(`/api/alerts?productId=${product.id}&alertType=stock`, { method: "DELETE" });
        setDbStockAlert(false);
        setLoading(false);
      } else {
        remove(product.id, "stock");
      }
      return;
    }
    if (user) {
      setLoading(true);
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          alertType: "stock",
          currentPrice,
        }),
      });
      if (res.ok) setDbStockAlert(true);
      setLoading(false);
    } else {
      addStock(product.id, product.name);
    }
    addNotification({
      type: "system",
      title: "Stok Alarmi Kuruldu",
      message: `${product.name} stoga girince bildirim alacaksiniz.`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Price Alert */}
      {product.stock > 0 && (
        <div>
          <button
            onClick={handlePriceAlert}
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              hasPriceAlert
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                : "border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700"
            } disabled:opacity-50`}
          >
            {hasPriceAlert ? (
              <>
                <Check size={16} />
                Fiyat Alarmi Aktif
              </>
            ) : (
              <>
                <TrendingDown size={16} />
                Fiyat Dusunce Haber Ver
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
                disabled={targetPrice <= 0 || targetPrice >= currentPrice || loading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Kur
              </button>
              <button
                onClick={() => setShowPriceInput(false)}
                className="text-sm text-dark-500 hover:text-dark-600 dark:text-dark-300"
              >
                Iptal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stock Alert (only show when out of stock) */}
      {product.stock === 0 && (
        <button
          onClick={handleStockAlert}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
            hasStockAlert
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
              : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
          } disabled:opacity-50`}
        >
          {hasStockAlert ? (
            <>
              <BellOff size={16} />
              Stok Alarmi Aktif
            </>
          ) : (
            <>
              <Bell size={16} />
              Stoga Girince Haber Ver
            </>
          )}
        </button>
      )}
    </div>
  );
}
