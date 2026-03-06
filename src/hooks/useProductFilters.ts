"use client";

import { useState, useMemo, useCallback } from "react";
import type { Product } from "@/types";

export interface FilterOption {
  label: string;
  value: string;
  count: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ActiveFilters {
  specs: Record<string, string[]>; // { "RAM": ["8GB", "16GB"], "Renk": ["Siyah"] }
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

const EMPTY_FILTERS: ActiveFilters = {
  specs: {},
  brands: [],
  minPrice: null,
  maxPrice: null,
};

/** Extract dynamic filter groups from product specifications */
function extractFilterGroups(products: Product[]): FilterGroup[] {
  const specCounts = new Map<string, Map<string, number>>();
  const brandCounts = new Map<string, number>();

  for (const product of products) {
    // Specs
    if (product.specs) {
      for (const [key, value] of Object.entries(product.specs)) {
        if (!value || value.trim() === "") continue;
        if (!specCounts.has(key)) specCounts.set(key, new Map());
        const valueMap = specCounts.get(key)!;
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      }
    }

    // Brands
    if (product.brand) {
      brandCounts.set(
        product.brand.name,
        (brandCounts.get(product.brand.name) || 0) + 1
      );
    }
  }

  const groups: FilterGroup[] = [];

  // Brand filter (always first)
  if (brandCounts.size > 1) {
    groups.push({
      key: "_brand",
      label: "Marka",
      options: Array.from(brandCounts.entries())
        .map(([name, count]) => ({ label: name, value: name, count }))
        .sort((a, b) => b.count - a.count),
    });
  }

  // Spec filters (only show specs with 2+ unique values and at least 2 products)
  for (const [specKey, valueMap] of Array.from(specCounts.entries())) {
    if (valueMap.size < 2) continue;

    const totalProducts = Array.from(valueMap.values()).reduce((a, b) => a + b, 0);
    if (totalProducts < 2) continue;

    groups.push({
      key: specKey,
      label: specKey,
      options: Array.from(valueMap.entries())
        .map(([value, count]) => ({ label: value, value, count }))
        .sort((a, b) => b.count - a.count),
    });
  }

  return groups;
}

/** Apply filters to products */
function applyFilters(products: Product[], filters: ActiveFilters): Product[] {
  return products.filter((product) => {
    // Brand filter
    if (filters.brands.length > 0) {
      if (!product.brand || !filters.brands.includes(product.brand.name)) {
        return false;
      }
    }

    // Price filter
    const price = product.sale_price || product.price;
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && price > filters.maxPrice) return false;

    // Spec filters (AND between groups, OR within group)
    for (const [specKey, selectedValues] of Object.entries(filters.specs)) {
      if (selectedValues.length === 0) continue;
      const productValue = product.specs?.[specKey];
      if (!productValue || !selectedValues.includes(productValue)) {
        return false;
      }
    }

    return true;
  });
}

/** Price range from products */
function getPriceRange(products: Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 10000 };

  let min = Infinity;
  let max = -Infinity;

  for (const p of products) {
    const price = p.sale_price || p.price;
    if (price < min) min = price;
    if (price > max) max = price;
  }

  return { min: Math.floor(min), max: Math.ceil(max) };
}

export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  // Extract available filter groups from products
  const filterGroups = useMemo(() => extractFilterGroups(products), [products]);

  // Price range
  const priceRange = useMemo(() => getPriceRange(products), [products]);

  // Filtered products
  const filteredProducts = useMemo(() => applyFilters(products, filters), [products, filters]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += filters.brands.length;
    for (const values of Object.values(filters.specs)) {
      count += values.length;
    }
    if (filters.minPrice !== null || filters.maxPrice !== null) count++;
    return count;
  }, [filters]);

  const toggleSpecFilter = useCallback((specKey: string, value: string) => {
    setFilters((prev) => {
      const current = prev.specs[specKey] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];

      return {
        ...prev,
        specs: { ...prev.specs, [specKey]: updated },
      };
    });
  }, []);

  const toggleBrand = useCallback((brand: string) => {
    setFilters((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
  }, []);

  const clearGroup = useCallback((key: string) => {
    if (key === "_brand") {
      setFilters((prev) => ({ ...prev, brands: [] }));
    } else if (key === "_price") {
      setFilters((prev) => ({ ...prev, minPrice: null, maxPrice: null }));
    } else {
      setFilters((prev) => ({
        ...prev,
        specs: { ...prev.specs, [key]: [] },
      }));
    }
  }, []);

  return {
    filters,
    filterGroups,
    filteredProducts,
    priceRange,
    activeFilterCount,
    toggleSpecFilter,
    toggleBrand,
    setPriceRange,
    clearFilters,
    clearGroup,
  };
}
