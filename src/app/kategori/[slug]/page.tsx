"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { getCategories, getAllActiveProducts } from "@/lib/queries";
import { getEffectivePrice } from "@/lib/utils";
import type { Product, Category, ViewMode } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProductFiltersPanel from "@/components/product/ProductFiltersPanel";
import { useProductFilters } from "@/hooks/useProductFilters";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import { PAGINATION } from "@/lib/constants";

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [sort, setSort] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([getAllActiveProducts(), getCategories()])
      .then(([products, categories]) => {
        setAllProducts(products);
        setCats(categories);
      })
      .catch((err) => console.error("Category page load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const category = cats.find((c) => c.slug === slug);

  const categoryProducts = useMemo(
    () => (category ? allProducts.filter((p) => p.category_id === category.id) : []),
    [allProducts, category]
  );

  // Dynamic spec-based filters
  const {
    filters: specFilters,
    filterGroups,
    filteredProducts: specFilteredProducts,
    priceRange,
    activeFilterCount,
    toggleSpecFilter,
    toggleBrand,
    setPriceRange,
    clearFilters,
    clearGroup,
  } = useProductFilters(categoryProducts);

  // Apply sorting on top of filtered products
  const filtered = useMemo(() => {
    const result = [...specFilteredProducts];

    switch (sort) {
      case "price_asc":
        result.sort((a, b) => getEffectivePrice(a.price, a.sale_price) - getEffectivePrice(b.price, b.sale_price));
        break;
      case "price_desc":
        result.sort((a, b) => getEffectivePrice(b.price, b.sale_price) - getEffectivePrice(a.price, a.sale_price));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        break;
    }

    return result;
  }, [specFilteredProducts, sort]);

  const totalPages = Math.ceil(filtered.length / PAGINATION.products_per_page);
  const paginatedProducts = filtered.slice(
    (page - 1) * PAGINATION.products_per_page,
    page * PAGINATION.products_per_page
  );

  if (loading) {
    return (
      <div className="bg-dark-50 dark:bg-dark-900 pb-16">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: "Ürünler", href: "/urunler" }, { label: "..." }]} />
        </div>
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kategori Bulunamadı</h1>
        <p className="mt-2 text-dark-500 dark:text-dark-400">Aradığınız kategori mevcut değil.</p>
        <Link href="/urunler" className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Ürünler", href: "/urunler" }, { label: category.name }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-8 rounded-xl bg-dark-900 p-8 text-white">
          <h1 className="text-2xl font-bold md:text-3xl">{category.name}</h1>
          <p className="mt-2 text-dark-300">{filtered.length} ürün listeleniyor</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {cats.filter((c) => c.id !== category.id).map((c) => (
            <Link
              key={c.id}
              href={`/kategori/${c.slug}`}
              className="rounded-full border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 transition-colors hover:border-primary-300 hover:text-primary-600"
            >
              {c.name}
            </Link>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-3">
          {/* Mobile filter trigger (shows drawer) */}
          <ProductFiltersPanel
            filterGroups={filterGroups}
            filters={specFilters}
            priceRange={priceRange}
            activeFilterCount={activeFilterCount}
            onToggleSpec={(key, val) => { toggleSpecFilter(key, val); setPage(1); }}
            onToggleBrand={(b) => { toggleBrand(b); setPage(1); }}
            onPriceRange={(min, max) => { setPriceRange(min, max); setPage(1); }}
            onClearAll={() => { clearFilters(); setPage(1); }}
            onClearGroup={(k) => { clearGroup(k); setPage(1); }}
          />

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <ArrowUpDown size={16} className="text-dark-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
            >
              <option value="newest">En Yeni</option>
              <option value="price_asc">Fiyat ↑</option>
              <option value="price_desc">Fiyat ↓</option>
              <option value="name_asc">A-Z</option>
            </select>
          </div>

          <div className="hidden items-center gap-1 rounded-lg border border-dark-200 p-1 sm:flex">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1.5 ${viewMode === "grid" ? "bg-primary-600 text-white" : "text-dark-400 hover:text-dark-600 dark:text-dark-300"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1.5 ${viewMode === "list" ? "bg-primary-600 text-white" : "text-dark-400 hover:text-dark-600 dark:text-dark-300"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-6">

          {/* Products */}
          <div className="flex-1">
            {paginatedProducts.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3" : "space-y-4"}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-16">
                <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-50">Bu filtrelere uygun ürün bulunamadı</h3>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Farklı bir filtre kombinasyonu deneyin.</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { clearFilters(); setPage(1); }}
                    className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
