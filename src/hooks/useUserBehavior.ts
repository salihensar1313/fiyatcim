"use client";

import { useCallback, useEffect, useRef } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

// ─── Types ───
export interface BehaviorSignal {
  type: "category_visit" | "product_view" | "search" | "cart_add" | "brand_click" | "filter_use";
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  priceRange?: [number, number];
  query?: string;
  timestamp: number;
}

export interface CategoryScore {
  slug: string;
  score: number;
  signals: number;
}

export interface BrandScore {
  slug: string;
  score: number;
}

export interface UserProfile {
  topCategories: CategoryScore[];
  topBrands: BrandScore[];
  avgPriceRange: [number, number] | null;
  tier: "whisper" | "normal" | "interested";
  totalSignals: number;
}

// ─── Constants ───
const STORAGE_KEY = "fiyatcim_behavior";
const MAX_SIGNALS = 200;
const SIGNAL_MAX_AGE_DAYS = 30;

// Weight decay based on age
function getAgeWeight(timestamp: number): number {
  const hoursAgo = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (hoursAgo <= 24) return 1.0;
  if (hoursAgo <= 72) return 0.7;
  if (hoursAgo <= 168) return 0.4; // 7 days
  if (hoursAgo <= 336) return 0.2; // 14 days
  if (hoursAgo <= 720) return 0.05; // 30 days
  return 0;
}

// Signal type weights
const SIGNAL_WEIGHTS: Record<BehaviorSignal["type"], number> = {
  cart_add: 5,
  product_view: 3,
  category_visit: 2,
  search: 2,
  brand_click: 1.5,
  filter_use: 1,
};

function getSignals(): BehaviorSignal[] {
  const raw = safeGetJSON<BehaviorSignal[]>(STORAGE_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

function setSignals(signals: BehaviorSignal[]) {
  safeSetJSON(STORAGE_KEY, signals);
}

// Clean old signals
function cleanSignals(signals: BehaviorSignal[]): BehaviorSignal[] {
  const cutoff = Date.now() - SIGNAL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return signals.filter((s) => s.timestamp > cutoff).slice(-MAX_SIGNALS);
}

// Build user profile from signals
export function buildUserProfile(signals: BehaviorSignal[]): UserProfile {
  const cleaned = cleanSignals(signals);
  const totalSignals = cleaned.length;

  // Category scoring
  const catScores: Record<string, { score: number; signals: number }> = {};
  // Brand scoring
  const brandScores: Record<string, number> = {};
  // Price tracking
  const prices: number[] = [];

  for (const signal of cleaned) {
    const weight = getAgeWeight(signal.timestamp) * SIGNAL_WEIGHTS[signal.type];

    if (signal.categorySlug) {
      if (!catScores[signal.categorySlug]) catScores[signal.categorySlug] = { score: 0, signals: 0 };
      catScores[signal.categorySlug].score += weight;
      catScores[signal.categorySlug].signals += 1;
    }

    if (signal.brandSlug) {
      brandScores[signal.brandSlug] = (brandScores[signal.brandSlug] || 0) + weight;
    }

    if (signal.priceRange) {
      prices.push((signal.priceRange[0] + signal.priceRange[1]) / 2);
    }
  }

  // Sort categories by score
  const topCategories: CategoryScore[] = Object.entries(catScores)
    .map(([slug, data]) => ({ slug, score: data.score, signals: data.signals }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // Sort brands by score
  const topBrands: BrandScore[] = Object.entries(brandScores)
    .map(([slug, score]) => ({ slug, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Average price range
  let avgPriceRange: [number, number] | null = null;
  if (prices.length >= 3) {
    prices.sort((a, b) => a - b);
    const p25 = prices[Math.floor(prices.length * 0.25)];
    const p75 = prices[Math.floor(prices.length * 0.75)];
    avgPriceRange = [p25, p75];
  }

  // Determine tier
  let tier: UserProfile["tier"] = "whisper";
  if (totalSignals >= 6 || cleaned.some((s) => s.type === "cart_add")) {
    tier = "interested";
  } else if (totalSignals >= 3) {
    tier = "normal";
  }

  return { topCategories, topBrands, avgPriceRange, tier, totalSignals };
}

// ─── Hook ───
export function useUserBehavior() {
  const signalsRef = useRef<BehaviorSignal[]>([]);

  useEffect(() => {
    signalsRef.current = getSignals();
  }, []);

  const trackSignal = useCallback((signal: Omit<BehaviorSignal, "timestamp">) => {
    const signals = getSignals();
    const newSignal: BehaviorSignal = { ...signal, timestamp: Date.now() };

    // Dedup: same type + category within 5 minutes
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const isDuplicate = signals.some(
      (s) =>
        s.type === newSignal.type &&
        s.categorySlug === newSignal.categorySlug &&
        s.brandSlug === newSignal.brandSlug &&
        s.timestamp > fiveMinAgo
    );

    if (!isDuplicate) {
      const updated = cleanSignals([...signals, newSignal]);
      setSignals(updated);
      signalsRef.current = updated;
    }
  }, []);

  const trackCategoryVisit = useCallback(
    (categorySlug: string, categoryId?: string) => {
      trackSignal({ type: "category_visit", categorySlug, categoryId });
    },
    [trackSignal]
  );

  const trackProductView = useCallback(
    (categorySlug: string, brandSlug?: string, price?: number) => {
      trackSignal({
        type: "product_view",
        categorySlug,
        brandSlug,
        priceRange: price ? [price * 0.7, price * 1.3] : undefined,
      });
    },
    [trackSignal]
  );

  const trackSearch = useCallback(
    (query: string, matchedCategorySlug?: string) => {
      trackSignal({ type: "search", query, categorySlug: matchedCategorySlug });
    },
    [trackSignal]
  );

  const trackCartAdd = useCallback(
    (categorySlug: string, brandSlug?: string, price?: number) => {
      trackSignal({
        type: "cart_add",
        categorySlug,
        brandSlug,
        priceRange: price ? [price * 0.7, price * 1.3] : undefined,
      });
    },
    [trackSignal]
  );

  const getProfile = useCallback((): UserProfile => {
    return buildUserProfile(getSignals());
  }, []);

  return {
    trackCategoryVisit,
    trackProductView,
    trackSearch,
    trackCartAdd,
    trackSignal,
    getProfile,
  };
}
