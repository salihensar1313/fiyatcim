"use client";

import { useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_alerts";

export interface PriceAlert {
  type: "price";
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

export interface StockAlert {
  type: "stock";
  productId: string;
  productName: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

export type Alert = PriceAlert | StockAlert;

function getAlerts(): Alert[] {
  const alerts = safeGetJSON<Alert[]>(STORAGE_KEY, []);
  if (!Array.isArray(alerts)) return [];
  return alerts;
}

function saveAlerts(alerts: Alert[]): void {
  safeSetJSON(STORAGE_KEY, alerts);
}

/** Add a price alert for a product */
export function addPriceAlert(productId: string, productName: string, targetPrice: number, currentPrice: number): void {
  const alerts = getAlerts();

  // Don't duplicate: same product + same type + not triggered
  const existing = alerts.find(
    (a) => a.type === "price" && a.productId === productId && !a.triggered
  );
  if (existing) return;

  alerts.push({
    type: "price",
    productId,
    productName,
    targetPrice,
    currentPrice,
    createdAt: new Date().toISOString(),
    triggered: false,
  });
  saveAlerts(alerts);
}

/** Add a stock alert for a product */
export function addStockAlert(productId: string, productName: string): void {
  const alerts = getAlerts();

  const existing = alerts.find(
    (a) => a.type === "stock" && a.productId === productId && !a.triggered
  );
  if (existing) return;

  alerts.push({
    type: "stock",
    productId,
    productName,
    createdAt: new Date().toISOString(),
    triggered: false,
  });
  saveAlerts(alerts);
}

/** Remove an alert */
export function removeAlert(productId: string, type: "price" | "stock"): void {
  const alerts = getAlerts();
  const filtered = alerts.filter(
    (a) => !(a.productId === productId && a.type === type && !a.triggered)
  );
  saveAlerts(filtered);
}

/** Check if a product has an active (untriggered) alert */
export function hasActiveAlert(productId: string, type: "price" | "stock"): boolean {
  const alerts = getAlerts();
  return alerts.some((a) => a.productId === productId && a.type === type && !a.triggered);
}

/** Check all alerts against current product data, returns triggered alerts */
export function checkAlerts(
  products: { id: string; price: number; sale_price: number | null; stock: number }[]
): Alert[] {
  const alerts = getAlerts();
  const triggered: Alert[] = [];
  let changed = false;

  for (const alert of alerts) {
    if (alert.triggered) continue;

    const product = products.find((p) => p.id === alert.productId);
    if (!product) continue;

    if (alert.type === "price") {
      const currentPrice = product.sale_price || product.price;
      if (currentPrice <= alert.targetPrice) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        triggered.push(alert);
        changed = true;
      }
    } else if (alert.type === "stock") {
      if (product.stock > 0) {
        alert.triggered = true;
        alert.triggeredAt = new Date().toISOString();
        triggered.push(alert);
        changed = true;
      }
    }
  }

  if (changed) saveAlerts(alerts);
  return triggered;
}

/** Hook: get alerts for current user */
export function useAlerts() {
  const alerts = getAlerts();

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const addPrice = useCallback(
    (productId: string, productName: string, targetPrice: number, currentPrice: number) => {
      addPriceAlert(productId, productName, targetPrice, currentPrice);
    },
    []
  );

  const addStock = useCallback((productId: string, productName: string) => {
    addStockAlert(productId, productName);
  }, []);

  const remove = useCallback((productId: string, type: "price" | "stock") => {
    removeAlert(productId, type);
  }, []);

  const hasAlert = useCallback((productId: string, type: "price" | "stock") => {
    return hasActiveAlert(productId, type);
  }, []);

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    addPrice,
    addStock,
    remove,
    hasAlert,
  };
}
