"use client";

import { useState } from "react";
import { X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import type { FilterGroup, ActiveFilters } from "@/hooks/useProductFilters";

interface ProductFiltersPanelProps {
  filterGroups: FilterGroup[];
  filters: ActiveFilters;
  priceRange: { min: number; max: number };
  activeFilterCount: number;
  onToggleSpec: (specKey: string, value: string) => void;
  onToggleBrand: (brand: string) => void;
  onPriceRange: (min: number | null, max: number | null) => void;
  onClearAll: () => void;
  onClearGroup: (key: string) => void;
}

export default function ProductFiltersPanel({
  filterGroups,
  filters,
  priceRange,
  activeFilterCount,
  onToggleSpec,
  onToggleBrand,
  onPriceRange,
  onClearAll,
  onClearGroup: _onClearGroup,
}: ProductFiltersPanelProps) {
  void _onClearGroup; // available for future use
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filterGroups.slice(0, 3).map((g) => g.key))
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isChecked = (group: FilterGroup, value: string) => {
    if (group.key === "_brand") {
      return filters.brands.includes(value);
    }
    return (filters.specs[group.key] || []).includes(value);
  };

  const handleToggle = (group: FilterGroup, value: string) => {
    if (group.key === "_brand") {
      onToggleBrand(value);
    } else {
      onToggleSpec(group.key, value);
    }
  };

  const filterContent = (
    <div className="space-y-4">
      {/* Active filters summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.brands.map((brand) => (
            <FilterChip
              key={`brand-${brand}`}
              label={brand}
              onRemove={() => onToggleBrand(brand)}
            />
          ))}
          {Object.entries(filters.specs).map(([key, values]) =>
            values.map((v) => (
              <FilterChip
                key={`${key}-${v}`}
                label={`${key}: ${v}`}
                onRemove={() => onToggleSpec(key, v)}
              />
            ))
          )}
          {(filters.minPrice !== null || filters.maxPrice !== null) && (
            <FilterChip
              label={`Fiyat: ${filters.minPrice || priceRange.min}₺ - ${filters.maxPrice || priceRange.max}₺`}
              onRemove={() => onPriceRange(null, null)}
            />
          )}
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Tümünü Temizle
          </button>
        </div>
      )}

      {/* Price range */}
      <div className="rounded-lg border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800">
        <button
          onClick={() => toggleGroup("_price")}
          className="flex w-full items-center justify-between p-3 text-sm font-semibold text-dark-700 dark:text-dark-200"
        >
          Fiyat Aralığı
          {expandedGroups.has("_price") ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {expandedGroups.has("_price") && (
          <div className="border-t border-dark-100 p-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder={`${priceRange.min}`}
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  onPriceRange(e.target.value ? Number(e.target.value) : null, filters.maxPrice)
                }
                className="w-full rounded border border-dark-200 px-2 py-1.5 text-sm"
              />
              <span className="text-dark-400">-</span>
              <input
                type="number"
                placeholder={`${priceRange.max}`}
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  onPriceRange(filters.minPrice, e.target.value ? Number(e.target.value) : null)
                }
                className="w-full rounded border border-dark-200 px-2 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Spec filter groups */}
      {filterGroups.map((group) => (
        <div key={group.key} className="rounded-lg border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800">
          <button
            onClick={() => toggleGroup(group.key)}
            className="flex w-full items-center justify-between p-3 text-sm font-semibold text-dark-700 dark:text-dark-200"
          >
            <span>{group.label}</span>
            <div className="flex items-center gap-2">
              {(group.key === "_brand" ? filters.brands.length : (filters.specs[group.key] || []).length) > 0 && (
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-700">
                  {group.key === "_brand" ? filters.brands.length : (filters.specs[group.key] || []).length}
                </span>
              )}
              {expandedGroups.has(group.key) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>
          {expandedGroups.has(group.key) && (
            <div className="max-h-48 space-y-1 overflow-y-auto border-t border-dark-100 p-3">
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-dark-50"
                >
                  <input
                    type="checkbox"
                    checked={isChecked(group, option.value)}
                    onChange={() => handleToggle(group, option.value)}
                    className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="flex-1 text-sm text-dark-700 dark:text-dark-200">{option.label}</span>
                  <span className="text-xs text-dark-400">({option.count})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 lg:hidden"
      >
        <SlidersHorizontal size={16} />
        Filtreler
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden w-64 flex-shrink-0 lg:block">
        {filterContent}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-dark-50 p-4 shadow-xl lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100">Filtreler</h3>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1 hover:bg-dark-200"
              >
                <X size={20} />
              </button>
            </div>
            {filterContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-4 w-full rounded-lg bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              Sonuçları Göster
            </button>
          </div>
        </>
      )}
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
      {label}
      <button onClick={onRemove} className="hover:text-primary-900">
        <X size={12} />
      </button>
    </span>
  );
}
