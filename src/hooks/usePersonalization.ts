"use client";

import { useMemo } from "react";
import type { Product } from "@/types";
import { buildUserProfile, type UserProfile } from "./useUserBehavior";
import { safeGetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_behavior";

// Impact limits per tier (never exceeds 60%)
const TIER_IMPACT: Record<UserProfile["tier"], number> = {
  whisper: 0.15, // 10-15% — only 1-2 products change
  normal: 0.35,  // 30-40% — banner + category order
  interested: 0.55, // 50-60% — strongest personalization
};

// Get a relevance boost score for a product based on user profile
function getProductRelevance(product: Product, profile: UserProfile): number {
  let relevance = 0;

  // Category match
  const catMatch = profile.topCategories.find(
    (c) => c.slug === product.category?.slug
  );
  if (catMatch) {
    // Top category gets highest boost
    const catIndex = profile.topCategories.indexOf(catMatch);
    const catBoost = Math.max(0, 1 - catIndex * 0.2); // 1.0, 0.8, 0.6, 0.4...
    relevance += catMatch.score * catBoost * 0.5;
  }

  // Brand match
  const brandMatch = profile.topBrands.find(
    (b) => b.slug === product.brand?.slug
  );
  if (brandMatch) {
    relevance += brandMatch.score * 0.3;
  }

  // Price range match
  if (profile.avgPriceRange && product.price) {
    const [low, high] = profile.avgPriceRange;
    const price = product.sale_price || product.price;
    if (price >= low && price <= high) {
      relevance += 2; // Price range fit bonus
    }
  }

  return relevance;
}

// Personalize a product list — reorder with diversity guarantee
function personalizeProducts(
  products: Product[],
  profile: UserProfile,
  maxItems?: number
): Product[] {
  if (profile.totalSignals === 0 || products.length === 0) {
    return maxItems ? products.slice(0, maxItems) : products;
  }

  const impact = TIER_IMPACT[profile.tier];
  const total = maxItems || products.length;
  const personalizedCount = Math.round(total * impact);

  // Score all products
  const scored = products.map((p) => ({
    product: p,
    relevance: getProductRelevance(p, profile),
    originalIndex: products.indexOf(p),
  }));

  // Split: relevant (boosted) vs neutral
  const relevant = scored
    .filter((s) => s.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);

  const neutral = scored
    .filter((s) => s.relevance === 0)
    .sort((a, b) => a.originalIndex - b.originalIndex);

  // Merge: personalized slots first, then neutral, preserving diversity
  const result: Product[] = [];
  const usedIds = new Set<string>();

  // Fill personalized slots
  for (const item of relevant) {
    if (result.length >= personalizedCount) break;
    if (!usedIds.has(item.product.id)) {
      result.push(item.product);
      usedIds.add(item.product.id);
    }
  }

  // Fill remaining with neutral (ensure diversity — min 40% non-personalized)
  for (const item of neutral) {
    if (result.length >= total) break;
    if (!usedIds.has(item.product.id)) {
      result.push(item.product);
      usedIds.add(item.product.id);
    }
  }

  // If still need more, add remaining relevant
  for (const item of relevant) {
    if (result.length >= total) break;
    if (!usedIds.has(item.product.id)) {
      result.push(item.product);
      usedIds.add(item.product.id);
    }
  }

  // If still not enough (shouldn't happen), pad from originals
  for (const p of products) {
    if (result.length >= total) break;
    if (!usedIds.has(p.id)) {
      result.push(p);
      usedIds.add(p.id);
    }
  }

  return result;
}

// ─── Hook ───
export function usePersonalization() {
  const profile = useMemo<UserProfile>(() => {
    if (typeof window === "undefined") {
      return { topCategories: [], topBrands: [], avgPriceRange: null, tier: "whisper", totalSignals: 0 };
    }
    const signals = safeGetJSON(STORAGE_KEY, []);
    return buildUserProfile(Array.isArray(signals) ? signals : []);
  }, []);

  const personalize = useMemo(() => {
    return (products: Product[], maxItems?: number) =>
      personalizeProducts(products, profile, maxItems);
  }, [profile]);

  // Reorder hero slides — move relevant category slide to first position
  const personalizeSlideOrder = useMemo(() => {
    return <T extends { cta_link?: string }>(slides: T[]): T[] => {
      if (profile.totalSignals === 0 || profile.topCategories.length === 0 || slides.length <= 1) {
        return slides;
      }

      const topCat = profile.topCategories[0].slug;
      const matchIndex = slides.findIndex(
        (s) => s.cta_link && s.cta_link.includes(topCat)
      );

      if (matchIndex > 0) {
        const reordered = [...slides];
        const [match] = reordered.splice(matchIndex, 1);
        reordered.unshift(match);
        return reordered;
      }

      return slides;
    };
  }, [profile]);

  return {
    profile,
    personalize,
    personalizeSlideOrder,
    isPersonalized: profile.totalSignals > 0,
    tier: profile.tier,
  };
}
