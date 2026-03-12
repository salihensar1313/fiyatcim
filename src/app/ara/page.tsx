"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SearchX, TrendingUp } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { searchProducts, POPULAR_SEARCHES } from "@/lib/search";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

export default function AraPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      }
    >
      <AraContent />
    </Suspense>
  );
}

function AraContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { products, loading } = useProducts();
  const { addSearch } = useSearchHistory();

  const queryParam = searchParams.get("q") || "";
  const [query, setQuery] = useState(queryParam);

  // Sync URL param to state
  useEffect(() => {
    setQuery(queryParam);
    if (queryParam.trim().length >= 2) {
      addSearch(queryParam.trim());
    }
  }, [queryParam, addSearch]);

  // Search results
  const results = useMemo(() => {
    if (!query || query.trim().length < 2) return [];
    return searchProducts(products, query);
  }, [products, query]);

  // Popular products (for empty results)
  const popularProducts = useMemo(() => {
    return products
      .filter((p) => p.is_active && !p.deleted_at && p.sale_price)
      .sort((a, b) => {
        const discA = a.sale_price ? ((a.price - a.sale_price) / a.price) : 0;
        const discB = b.sale_price ? ((b.price - b.sale_price) / b.price) : 0;
        return discB - discA;
      })
      .slice(0, 8);
  }, [products]);

  // Update URL on search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      addSearch(query.trim());
      router.replace(`/ara?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="container-custom py-8">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mx-auto mb-8 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün, marka veya kategori ara..."
            className="w-full rounded-xl border-2 border-dark-200 bg-white dark:bg-dark-800 py-3.5 pl-12 pr-4 text-base text-dark-800 dark:text-dark-100 placeholder-dark-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
            autoFocus
          />
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : queryParam.trim().length >= 2 ? (
        results.length > 0 ? (
          <>
            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-lg font-bold text-dark-800 dark:text-dark-100">
                &quot;{queryParam}&quot; için{" "}
                <span className="text-primary-600">{results.length} sonuç</span> bulundu
              </h1>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((r) => (
                <ProductCard key={r.product.id} product={r.product} />
              ))}
            </div>
          </>
        ) : (
          /* No results */
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-dark-100">
              <SearchX size={40} className="text-dark-500" />
            </div>
            <h2 className="text-xl font-bold text-dark-800 dark:text-dark-100">
              &quot;{queryParam}&quot; ile eşleşen ürün bulunamadı
            </h2>
            <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
              Farklı kelimeler deneyin veya popüler aramalara göz atın.
            </p>

            {/* Popular search suggestions */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/ara?q=${encodeURIComponent(term)}`}
                  className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-4 py-2 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-200"
                >
                  <TrendingUp size={14} className="text-primary-500" />
                  {term}
                </Link>
              ))}
            </div>

            {/* Popular products */}
            {popularProducts.length > 0 && (
              <div className="mt-10">
                <h3 className="mb-4 text-lg font-bold text-dark-800 dark:text-dark-100">Popüler Ürünler</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {popularProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* No query: show popular searches + popular products */
        <div className="text-center">
          <h1 className="text-xl font-bold text-dark-800 dark:text-dark-100">Ürün Ara</h1>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Aradığınız ürünü bulmak için yukarıdaki arama kutusunu kullanın.
          </p>

          {/* Popular searches */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                href={`/ara?q=${encodeURIComponent(term)}`}
                className="inline-flex items-center gap-1 rounded-full bg-dark-100 px-4 py-2 text-sm text-dark-600 dark:text-dark-300 hover:bg-dark-200"
              >
                <TrendingUp size={14} className="text-primary-500" />
                {term}
              </Link>
            ))}
          </div>

          {/* Popular products */}
          {popularProducts.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-4 text-lg font-bold text-dark-800 dark:text-dark-100">Popüler Ürünler</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {popularProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
