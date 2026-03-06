"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useProducts } from "@/context/ProductContext";
import { searchProducts, getGroupedSuggestions, POPULAR_SEARCHES } from "@/lib/search";
import type { SearchResult, GroupedSuggestions } from "@/lib/search";

interface UseSearchOptions {
  debounceMs?: number;
  maxResults?: number;
}

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  suggestions: GroupedSuggestions;
  isSearching: boolean;
  totalResults: number;
  popularSearches: string[];
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, maxResults = 50 } = options;
  const { products } = useProducts();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce query
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length < 3) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  // Full search results
  const results = useMemo(() => {
    if (!debouncedQuery) return [];
    return searchProducts(products, debouncedQuery).slice(0, maxResults);
  }, [products, debouncedQuery, maxResults]);

  // Grouped suggestions for autocomplete
  const suggestions = useMemo(() => {
    if (!debouncedQuery) {
      return { products: [], categories: [], brands: [] };
    }
    return getGroupedSuggestions(products, debouncedQuery);
  }, [products, debouncedQuery]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    isSearching,
    totalResults: results.length,
    popularSearches: POPULAR_SEARCHES,
  };
}

/** Hook for immediate (non-debounced) search - useful for the search page */
export function useSearchImmediate(query: string, maxResults = 100): {
  results: SearchResult[];
  totalResults: number;
} {
  const { products } = useProducts();

  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchProducts(products, query).slice(0, maxResults);
  }, [products, query, maxResults]);

  return {
    results,
    totalResults: results.length,
  };
}
