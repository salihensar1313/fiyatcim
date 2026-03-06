"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "fiyatcim_search_history";
const MAX_ITEMS = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const save = useCallback((items: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, []);

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;

    setHistory((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
      const next = [trimmed, ...filtered].slice(0, MAX_ITEMS);
      save(next);
      return next;
    });
  }, [save]);

  const removeSearch = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((t) => t !== term);
      save(next);
      return next;
    });
  }, [save]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  };
}
