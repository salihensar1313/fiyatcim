"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search } from "lucide-react";
import { getAllActiveProducts, getCategories, getBrands } from "@/lib/queries";
import { getEffectivePrice } from "@/lib/utils";
import type { Product, Category, Brand, ViewMode } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProductFilter from "@/components/product/ProductFilter";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import { PAGINATION } from "@/lib/constants";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><span className="text-dark-400">Yükleniyor...</span></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [allBrands, setAllBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("newest");

  useEffect(() => {
    Promise.all([getAllActiveProducts(), getCategories(), getBrands()])
      .then(([products, categories, brands]) => {
        setAllProducts(products);
        setCats(categories);
        setAllBrands(brands);
      })
      .catch((err) => console.error("Products page load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearch(urlSearch);
  }, [searchParams]);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    stockOnly?: boolean;
  }>({});

  const filtered = useMemo(() => {
    let result = [...allProducts];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_desc.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    if (filters.category) {
      const cat = cats.find((c) => c.slug === filters.category);
      if (cat) result = result.filter((p) => p.category_id === cat.id);
    }

    if (filters.brand) {
      const brand = allBrands.find((b) => b.slug === filters.brand);
      if (brand) result = result.filter((p) => p.brand_id === brand.id);
    }

    if (filters.minPrice !== undefined) {
      result = result.filter((p) => getEffectivePrice(p.price, p.sale_price) >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => getEffectivePrice(p.price, p.sale_price) <= filters.maxPrice!);
    }

    if (filters.stockOnly) {
      result = result.filter((p) => p.stock > 0);
    }

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
  }, [allProducts, cats, allBrands, search, sort, filters]);

  const totalPages = Math.ceil(filtered.length / PAGINATION.products_per_page);
  const paginatedProducts = filtered.slice(
    (page - 1) * PAGINATION.products_per_page,
    page * PAGINATION.products_per_page
  );

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="bg-dark-50 dark:bg-dark-900 pb-16">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: "Ürünler" }]} />
        </div>
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Ürünler" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">Tüm Ürünler</h1>
          <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{filtered.length} ürün bulundu</p>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
          <ProductFilter
            categories={cats}
            brands={allBrands}
            selectedCategory={filters.category}
            selectedBrand={filters.brand}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            minRating={filters.minRating}
            stockOnly={filters.stockOnly}
            onFilterChange={handleFilterChange}
          />

          <div className="min-w-0 flex-1">
            <div className="mb-4 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-3">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-dark-200 py-2 pl-9 pr-3 text-sm focus:border-primary-600 focus:outline-none"
                  />
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="shrink-0 rounded-lg border border-dark-200 px-2 py-2 text-sm focus:border-primary-600 focus:outline-none"
                >
                  <option value="newest">En Yeni</option>
                  <option value="price_asc">Fiyat ↑</option>
                  <option value="price_desc">Fiyat ↓</option>
                  <option value="name_asc">A-Z</option>
                </select>

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
            </div>

            {(filters.category || filters.brand || filters.minRating || filters.stockOnly) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-dark-500 dark:text-dark-400">Aktif Filtreler:</span>
                {filters.category && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-700">
                    {cats.find((c) => c.slug === filters.category)?.name}
                    <button onClick={() => handleFilterChange({ ...filters, category: undefined })} className="ml-1 hover:text-primary-900">&times;</button>
                  </span>
                )}
                {filters.brand && (
                  <span className="flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-700">
                    {allBrands.find((b) => b.slug === filters.brand)?.name}
                    <button onClick={() => handleFilterChange({ ...filters, brand: undefined })} className="ml-1 hover:text-primary-900">&times;</button>
                  </span>
                )}
                {filters.minRating && (
                  <span className="flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-700">
                    {filters.minRating}+ Yıldız
                    <button onClick={() => handleFilterChange({ ...filters, minRating: undefined })} className="ml-1 hover:text-yellow-900">&times;</button>
                  </span>
                )}
                {filters.stockOnly && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700">
                    Stokta
                    <button onClick={() => handleFilterChange({ ...filters, stockOnly: undefined })} className="ml-1 hover:text-green-900">&times;</button>
                  </span>
                )}
              </div>
            )}

            {paginatedProducts.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 py-16">
                <Search size={48} className="mb-4 text-dark-200" />
                <h3 className="text-lg font-semibold text-dark-900 dark:text-dark-50">Ürün Bulunamadı</h3>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Farklı filtreler veya arama terimleri deneyebilirsiniz.</p>
                <button
                  onClick={() => { setSearch(""); setFilters({}); setPage(1); }}
                  className="mt-4 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Filtreleri Temizle
                </button>
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
