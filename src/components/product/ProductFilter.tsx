"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Category, Brand } from "@/types";

interface ProductFilterProps {
  categories: Category[];
  brands: Brand[];
  selectedCategory?: string;
  selectedBrand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  stockOnly?: boolean;
  onFilterChange: (filters: {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    stockOnly?: boolean;
  }) => void;
}

export default function ProductFilter({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  minPrice,
  maxPrice,
  minRating,
  stockOnly,
  onFilterChange,
}: ProductFilterProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    category: true,
    brand: true,
    price: true,
    rating: false,
    stock: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const activeFilterCount = [selectedCategory, selectedBrand, minPrice, maxPrice, minRating, stockOnly].filter(Boolean).length;

  const clearAll = () => {
    onFilterChange({});
  };

  const updateFilter = (patch: Partial<Parameters<typeof onFilterChange>[0]>) => {
    onFilterChange({
      category: selectedCategory,
      brand: selectedBrand,
      minPrice,
      maxPrice,
      minRating,
      stockOnly,
      ...patch,
    });
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-dark-900">
          <SlidersHorizontal size={20} />
          Filtrele
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Temizle ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="border-t border-dark-100 pt-4">
        <button
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between text-sm font-semibold text-dark-900"
        >
          Kategoriler
          <ChevronDown
            size={16}
            className={`transition-transform ${openSections.category ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.category && (
          <div className="mt-3 space-y-2">
            {categories.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.slug}
                  onChange={() => updateFilter({ category: selectedCategory === cat.slug ? undefined : cat.slug })}
                  className="h-4 w-4 text-primary-600 accent-primary-600"
                />
                <span className="text-sm text-dark-700">{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brands */}
      <div className="border-t border-dark-100 pt-4">
        <button
          onClick={() => toggleSection("brand")}
          className="flex w-full items-center justify-between text-sm font-semibold text-dark-900"
        >
          Markalar
          <ChevronDown
            size={16}
            className={`transition-transform ${openSections.brand ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.brand && (
          <div className="mt-3 space-y-2">
            {brands.map((brand) => (
              <label key={brand.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedBrand === brand.slug}
                  onChange={() => updateFilter({ brand: selectedBrand === brand.slug ? undefined : brand.slug })}
                  className="h-4 w-4 rounded accent-primary-600"
                />
                <span className="text-sm text-dark-700">{brand.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-t border-dark-100 pt-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between text-sm font-semibold text-dark-900"
        >
          Fiyat Aralığı
          <ChevronDown
            size={16}
            className={`transition-transform ${openSections.price ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.price && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice || ""}
                onChange={(e) => updateFilter({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
              <span className="text-dark-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice || ""}
                onChange={(e) => updateFilter({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            {/* Quick price filters */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: `${formatPrice(0)} - ${formatPrice(2000)}`, min: 0, max: 2000 },
                { label: `${formatPrice(2000)} - ${formatPrice(5000)}`, min: 2000, max: 5000 },
                { label: `${formatPrice(5000)} - ${formatPrice(10000)}`, min: 5000, max: 10000 },
                { label: `${formatPrice(10000)}+`, min: 10000, max: undefined },
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => updateFilter({ minPrice: range.min, maxPrice: range.max })}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    minPrice === range.min && maxPrice === range.max
                      ? "border-primary-600 bg-primary-50 text-primary-700"
                      : "border-dark-200 text-dark-600 hover:border-primary-300"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="border-t border-dark-100 pt-4">
        <button
          onClick={() => toggleSection("rating")}
          className="flex w-full items-center justify-between text-sm font-semibold text-dark-900"
        >
          Puan
          <ChevronDown
            size={16}
            className={`transition-transform ${openSections.rating ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.rating && (
          <div className="mt-3 space-y-2">
            {[4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => updateFilter({ minRating: minRating === star ? undefined : star })}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  minRating === star ? "bg-primary-50 text-primary-700" : "text-dark-600 hover:bg-dark-50"
                }`}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} className={i < star ? "fill-yellow-400 text-yellow-400" : "text-dark-300"} />
                  ))}
                </div>
                <span>{star}+ yıldız</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stock Filter */}
      <div className="border-t border-dark-100 pt-4">
        <button
          onClick={() => toggleSection("stock")}
          className="flex w-full items-center justify-between text-sm font-semibold text-dark-900"
        >
          Stok Durumu
          <ChevronDown
            size={16}
            className={`transition-transform ${openSections.stock ? "rotate-180" : ""}`}
          />
        </button>
        {openSections.stock && (
          <div className="mt-3">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={!!stockOnly}
                onChange={() => updateFilter({ stockOnly: stockOnly ? undefined : true })}
                className="h-4 w-4 rounded accent-primary-600"
              />
              <span className="text-sm text-dark-700">Sadece stokta olanlar</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 lg:hidden"
      >
        <SlidersHorizontal size={16} />
        Filtrele
        {activeFilterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl border border-dark-100 bg-white p-5">
          {filterContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Filtrele</h3>
              <button onClick={() => setMobileOpen(false)}>
                <X size={24} />
              </button>
            </div>
            {filterContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white"
            >
              Sonuçları Göster
            </button>
          </div>
        </div>
      )}
    </>
  );
}
