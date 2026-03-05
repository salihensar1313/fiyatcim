"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_compare";
const MAX_ITEMS = 4;

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    const stored = safeGetJSON<string[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setCompareIds(stored);
  }, []);

  const addToCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= MAX_ITEMS) return prev;
      const updated = [...prev, productId];
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareIds((prev) => {
      const updated = prev.filter((id) => id !== productId);
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    safeSetJSON(STORAGE_KEY, []);
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return compareIds.includes(productId);
  }, [compareIds]);

  const toggleCompare = useCallback((productId: string) => {
    if (compareIds.includes(productId)) {
      removeFromCompare(productId);
    } else {
      addToCompare(productId);
    }
  }, [compareIds, addToCompare, removeFromCompare]);

  return {
    compareIds,
    compareCount: compareIds.length,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    toggleCompare,
    isFull: compareIds.length >= MAX_ITEMS,
  };
}
