"use client";

import { useState, useEffect } from "react";
import type { Product, PriceHistoryEntry, PriceStats } from "@/types";
import { getEffectivePrice } from "@/lib/utils";

const STORAGE_KEY = "fiyatcim_price_history";
const MAX_ENTRIES_PER_PRODUCT = 90;

function getStorageData(): Record<string, PriceHistoryEntry[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStorageData(data: Record<string, PriceHistoryEntry[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/** Record current price for a product (skips if same day + same price) */
export function recordPrice(product: Product) {
  const data = getStorageData();
  const entries = data[product.id] || [];
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const currentPrice = getEffectivePrice(product.price, product.sale_price);
  const currentPriceUsd = getEffectivePrice(product.price_usd, product.sale_price_usd);

  // Skip if already recorded same price today
  const lastEntry = entries[entries.length - 1];
  if (lastEntry) {
    const lastDate = lastEntry.recordedAt.split("T")[0];
    if (lastDate === today && lastEntry.price === currentPrice) {
      return;
    }
  }

  const newEntry: PriceHistoryEntry = {
    productId: product.id,
    price: currentPrice,
    priceUsd: currentPriceUsd,
    recordedAt: new Date().toISOString(),
  };

  entries.push(newEntry);

  // Trim to max entries
  if (entries.length > MAX_ENTRIES_PER_PRODUCT) {
    entries.splice(0, entries.length - MAX_ENTRIES_PER_PRODUCT);
  }

  data[product.id] = entries;
  saveStorageData(data);
}

/** Get price history for a product */
export function getHistory(productId: string, days?: number): PriceHistoryEntry[] {
  const data = getStorageData();
  let entries = data[productId] || [];

  if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    entries = entries.filter((e) => new Date(e.recordedAt) >= cutoff);
  }

  return entries;
}

/** Calculate price statistics */
export function getPriceStats(productId: string, currentPrice: number): PriceStats {
  const entries = getHistory(productId);

  if (entries.length === 0) {
    return {
      lowest: currentPrice,
      highest: currentPrice,
      average: currentPrice,
      current: currentPrice,
      change7d: null,
      change30d: null,
      lowestDate: null,
      highestDate: null,
    };
  }

  let lowest = Infinity;
  let highest = -Infinity;
  let lowestDate: string | null = null;
  let highestDate: string | null = null;
  let sum = 0;

  for (const entry of entries) {
    if (entry.price < lowest) {
      lowest = entry.price;
      lowestDate = entry.recordedAt;
    }
    if (entry.price > highest) {
      highest = entry.price;
      highestDate = entry.recordedAt;
    }
    sum += entry.price;
  }

  // Include current price in stats
  if (currentPrice < lowest) {
    lowest = currentPrice;
    lowestDate = new Date().toISOString();
  }
  if (currentPrice > highest) {
    highest = currentPrice;
    highestDate = new Date().toISOString();
  }

  const average = (sum + currentPrice) / (entries.length + 1);

  // Calculate changes
  const now = new Date();
  const change7d = calculateChange(entries, currentPrice, 7, now);
  const change30d = calculateChange(entries, currentPrice, 30, now);

  return {
    lowest,
    highest,
    average: Math.round(average * 100) / 100,
    current: currentPrice,
    change7d,
    change30d,
    lowestDate,
    highestDate,
  };
}

function calculateChange(
  entries: PriceHistoryEntry[],
  currentPrice: number,
  days: number,
  now: Date
): number | null {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  // Find the entry closest to the cutoff date
  let closestEntry: PriceHistoryEntry | null = null;
  let closestDiff = Infinity;

  for (const entry of entries) {
    const entryDate = new Date(entry.recordedAt);
    if (entryDate <= cutoff) {
      const diff = cutoff.getTime() - entryDate.getTime();
      if (diff < closestDiff) {
        closestDiff = diff;
        closestEntry = entry;
      }
    }
  }

  if (!closestEntry) {
    // Use the earliest entry if no entry is before cutoff
    if (entries.length > 0 && entries[0].price !== currentPrice) {
      return Math.round(((currentPrice - entries[0].price) / entries[0].price) * 100 * 10) / 10;
    }
    return null;
  }

  if (closestEntry.price === currentPrice) return 0;

  return Math.round(((currentPrice - closestEntry.price) / closestEntry.price) * 100 * 10) / 10;
}

/** React hook for price history */
export function usePriceHistory(productId: string, currentPrice: number) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [period, setPeriod] = useState<30 | 90 | 180>(30);

  useEffect(() => {
    const entries = getHistory(productId, period);
    setHistory(entries);
    setStats(getPriceStats(productId, currentPrice));
  }, [productId, currentPrice, period]);

  return {
    history,
    stats,
    period,
    setPeriod,
    hasData: history.length > 0,
  };
}

/** Get 7-day price change for a product (for PriceDropBadge) */
export function get7DayChange(productId: string, currentPrice: number): number | null {
  const entries = getHistory(productId, 7);
  if (entries.length === 0) return null;

  const oldPrice = entries[0].price;
  if (oldPrice === currentPrice) return null;

  return Math.round(((currentPrice - oldPrice) / oldPrice) * 100 * 10) / 10;
}
