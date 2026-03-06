"use client";

import { useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/types";

const STORAGE_KEY = "fiyatcim_view_counts";
const WINDOW_DAYS = 7;

interface ViewEntry {
  productId: string;
  timestamp: number; // epoch ms
}

function getViewEntries(): ViewEntry[] {
  const entries = safeGetJSON<ViewEntry[]>(STORAGE_KEY, []);
  if (!Array.isArray(entries)) return [];

  // Prune entries older than window
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const valid = entries.filter((e) => e.timestamp >= cutoff);

  // Save pruned list if different
  if (valid.length !== entries.length) {
    safeSetJSON(STORAGE_KEY, valid);
  }
  return valid;
}

/** Record a product view (called on product detail page) */
export function incrementViewCount(productId: string) {
  const entries = getViewEntries();

  // Throttle: max 1 view per product per hour
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentView = entries.find(
    (e) => e.productId === productId && e.timestamp > oneHourAgo
  );
  if (recentView) return;

  entries.push({ productId, timestamp: Date.now() });
  safeSetJSON(STORAGE_KEY, entries);
}

/** Get view counts per product (last 7 days) */
function getViewCounts(): Map<string, number> {
  const entries = getViewEntries();
  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.productId, (counts.get(e.productId) || 0) + 1);
  }
  return counts;
}

/** Hook: get trending products sorted by view count */
export function useTrendingProducts(limit = 8): Product[] {
  const { products } = useProducts();

  const getTrending = useCallback(() => {
    const counts = getViewCounts();
    if (counts.size === 0) {
      // No view data yet — fallback to newest active products
      return products
        .filter((p) => p.is_active && !p.deleted_at)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    }

    // Sort products by view count descending
    return products
      .filter((p) => p.is_active && !p.deleted_at)
      .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))
      .slice(0, limit);
  }, [products, limit]);

  return getTrending();
}
