"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_recently_viewed";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = safeGetJSON<string[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setViewedIds(stored);
  }, []);

  const addViewed = useCallback((productId: string) => {
    setViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const clearViewed = useCallback(() => {
    setViewedIds([]);
    safeSetJSON(STORAGE_KEY, []);
  }, []);

  return { viewedIds, addViewed, clearViewed };
}
