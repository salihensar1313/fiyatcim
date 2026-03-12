"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, TrendingUp, X, ArrowRight, Tag, Building2 } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface SearchAutocompleteProps {
  onClose?: () => void;
  className?: string;
  isMobile?: boolean;
}

export default function SearchAutocomplete({ onClose, className = "", isMobile = false }: SearchAutocompleteProps) {
  const router = useRouter();
  const { query, setQuery, suggestions, isSearching, popularSearches } = useSearch();
  const { history, addSearch, removeSearch, clearHistory } = useSearchHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasResults = suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.brands.length > 0;
  const showDropdown = isOpen && (query.length >= 1 || history.length > 0 || popularSearches.length > 0);

  // Build flat list of navigable items for keyboard nav
  const getNavigableItems = useCallback(() => {
    if (query.length >= 2 && hasResults) {
      const items: { type: string; value: string; url: string }[] = [];
      for (const r of suggestions.products) {
        items.push({ type: "product", value: r.product.name, url: `/urunler/${r.product.slug}` });
      }
      for (const c of suggestions.categories) {
        items.push({ type: "category", value: c.name, url: `/kategori/${c.slug}` });
      }
      for (const b of suggestions.brands) {
        items.push({ type: "brand", value: b.name, url: `/urunler?brand=${b.slug}` });
      }
      return items;
    }
    // History + popular
    const items: { type: string; value: string; url: string }[] = [];
    for (const h of history) {
      items.push({ type: "history", value: h, url: `/ara?q=${encodeURIComponent(h)}` });
    }
    for (const p of popularSearches.slice(0, 4)) {
      items.push({ type: "popular", value: p, url: `/ara?q=${encodeURIComponent(p)}` });
    }
    return items;
  }, [query, hasResults, suggestions, history, popularSearches]);

  const handleSubmit = useCallback((searchTerm?: string) => {
    const term = searchTerm || query;
    if (term.trim().length < 2) return;
    addSearch(term.trim());
    setIsOpen(false);
    router.push(`/ara?q=${encodeURIComponent(term.trim())}`);
    onClose?.();
  }, [query, addSearch, router, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = getNavigableItems();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < items.length) {
        const item = items[activeIndex];
        if (item.type === "history" || item.type === "popular") {
          handleSubmit(item.value);
        } else {
          addSearch(query.trim());
          setIsOpen(false);
          router.push(item.url);
          onClose?.();
        }
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [getNavigableItems, activeIndex, handleSubmit, addSearch, query, router, onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions, query]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Ürün, marka veya kategori ara..."
          className="w-full rounded-lg border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 py-2.5 pl-10 pr-10 text-sm text-dark-800 dark:text-dark-100 placeholder-dark-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-400"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-600 dark:text-dark-300"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto rounded-lg border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 shadow-xl ${
            isMobile ? "fixed left-4 right-4 top-auto" : ""
          }`}
        >
          {/* Query >= 2 chars: show grouped results */}
          {query.length >= 2 ? (
            hasResults ? (
              <div className="py-2">
                {/* Products */}
                {suggestions.products.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase text-dark-500">
                      Ürünler
                    </div>
                    {suggestions.products.map((r, i) => (
                      <button
                        key={r.product.id}
                        onClick={() => {
                          addSearch(query.trim());
                          setIsOpen(false);
                          router.push(`/urunler/${r.product.slug}`);
                          onClose?.();
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-dark-50 dark:hover:bg-dark-700 ${
                          activeIndex === i ? "bg-dark-50" : ""
                        }`}
                      >
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-dark-100">
                          <Image
                            src={r.product.images?.[0] || "/images/placeholder.jpg"}
                            alt={r.product.name}
                            fill
                            className="object-contain"
                            sizes="40px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-dark-800 dark:text-dark-100">
                            {r.product.name}
                          </p>
                          <p className="text-xs text-dark-500 dark:text-dark-400">
                            {r.product.brand?.name}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-primary-600">
                          {formatPrice(r.product.sale_price || r.product.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Categories */}
                {suggestions.categories.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase text-dark-500 border-t border-dark-100 mt-1 pt-2">
                      Kategoriler
                    </div>
                    {suggestions.categories.map((c, i) => (
                      <button
                        key={c.slug}
                        onClick={() => {
                          addSearch(query.trim());
                          setIsOpen(false);
                          router.push(`/kategori/${c.slug}`);
                          onClose?.();
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-dark-50 dark:hover:bg-dark-700 ${
                          activeIndex === suggestions.products.length + i ? "bg-dark-50" : ""
                        }`}
                      >
                        <Tag size={16} className="text-dark-500" />
                        <span className="text-sm text-dark-700 dark:text-dark-200">{c.name}</span>
                        <span className="ml-auto text-xs text-dark-500">{c.count} ürün</span>
                        <ArrowRight size={14} className="text-dark-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Brands */}
                {suggestions.brands.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold uppercase text-dark-500 border-t border-dark-100 mt-1 pt-2">
                      Markalar
                    </div>
                    {suggestions.brands.map((b, i) => (
                      <button
                        key={b.slug}
                        onClick={() => {
                          addSearch(query.trim());
                          setIsOpen(false);
                          router.push(`/urunler?brand=${b.slug}`);
                          onClose?.();
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-dark-50 dark:hover:bg-dark-700 ${
                          activeIndex === suggestions.products.length + suggestions.categories.length + i ? "bg-dark-50" : ""
                        }`}
                      >
                        <Building2 size={16} className="text-dark-500" />
                        <span className="text-sm text-dark-700 dark:text-dark-200">{b.name}</span>
                        <span className="ml-auto text-xs text-dark-500">{b.count} ürün</span>
                        <ArrowRight size={14} className="text-dark-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* See all results */}
                <button
                  onClick={() => handleSubmit()}
                  className="flex w-full items-center justify-center gap-2 border-t border-dark-100 px-3 py-2.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
                >
                  <Search size={14} />
                  Tüm sonuçları gör
                </button>
              </div>
            ) : (
              !isSearching && (
                <div className="p-4 text-center text-sm text-dark-500 dark:text-dark-400">
                  &quot;{query}&quot; ile eşleşen sonuç bulunamadı
                </div>
              )
            )
          ) : query.length === 1 ? (
            /* 1 karakter: ipucu */
            <div className="p-3 text-center text-sm text-dark-500 dark:text-dark-400">
              En az 2 karakter girin...
            </div>
          ) : (
            /* No query: show history + popular */
            <div className="py-2">
              {/* Recent searches */}
              {history.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-1.5">
                    <span className="text-xs font-semibold uppercase text-dark-500">
                      Son Aramalar
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Temizle
                    </button>
                  </div>
                  {history.map((term, i) => (
                    <div
                      key={term}
                      className={`flex items-center gap-2 px-3 py-2 hover:bg-dark-50 dark:hover:bg-dark-700 ${
                        activeIndex === i ? "bg-dark-50" : ""
                      }`}
                    >
                      <Clock size={14} className="flex-shrink-0 text-dark-500" />
                      <button
                        onClick={() => {
                          setQuery(term);
                          handleSubmit(term);
                        }}
                        className="flex-1 text-left text-sm text-dark-700 dark:text-dark-200"
                      >
                        {term}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSearch(term);
                        }}
                        className="text-dark-300 hover:text-dark-400 dark:text-dark-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Popular searches */}
              <div className={history.length > 0 ? "border-t border-dark-100 mt-1 pt-1" : ""}>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase text-dark-500">
                  Popüler Aramalar
                </div>
                {popularSearches.slice(0, 4).map((term, i) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      handleSubmit(term);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-dark-50 dark:hover:bg-dark-700 ${
                      activeIndex === history.length + i ? "bg-dark-50" : ""
                    }`}
                  >
                    <TrendingUp size={14} className="text-primary-500" />
                    <span className="text-sm text-dark-700 dark:text-dark-200">{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isSearching && query.length >= 2 && (
            <div className="flex items-center justify-center p-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <span className="ml-2 text-xs text-dark-500">Aranıyor...</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile overlay backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
