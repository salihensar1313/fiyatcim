"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SearchX, TrendingUp, ChevronRight } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { searchProducts, POPULAR_SEARCHES } from "@/lib/search";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import ProductCard from "@/components/product/ProductCard";
import Link from "next/link";

// ─── Arama sorgusunu kategorilerle eşleştirme ───
const CATEGORY_SEARCH_MAP: Record<string, { slug: string; name: string; image: string; keywords: string[] }> = {
  "alarm-sistemleri": {
    slug: "alarm-sistemleri",
    name: "Alarm Sistemleri",
    image: "/images/categories/alarm-sistemleri.svg",
    keywords: ["alarm", "siren", "keypad", "panel", "hareket sensör", "pir", "manyetik kontak", "kumanda"],
  },
  "guvenlik-kameralari": {
    slug: "guvenlik-kameralari",
    name: "Güvenlik Kameraları",
    image: "/images/categories/guvenlik-kameralari.svg",
    keywords: ["kamera", "camera", "dome", "bullet", "ptz", "nvr", "dvr", "xvr", "ip kamera", "cctv", "kayıt", "güvenlik kamera"],
  },
  "akilli-ev-sistemleri": {
    slug: "akilli-ev-sistemleri",
    name: "Akıllı Ev Sistemleri",
    image: "/images/categories/akilli-ev-sistemleri.svg",
    keywords: ["akıllı ev", "smart home", "hub", "sensör", "doorbell", "kapı zili", "otomasyon", "wifi", "zigbee"],
  },
  "akilli-kilit": {
    slug: "akilli-kilit",
    name: "Akıllı Kilit",
    image: "/images/categories/akilli-kilit.svg",
    keywords: ["kilit", "lock", "akıllı kilit", "smart lock", "parmak izi", "şifreli", "kartlı kilit", "bluetooth kilit"],
  },
  "gecis-kontrol-sistemleri": {
    slug: "gecis-kontrol-sistemleri",
    name: "Geçiş Kontrol Sistemleri",
    image: "/images/categories/gecis-kontrol-sistemleri.svg",
    keywords: ["geçiş kontrol", "kart okuyucu", "turnike", "bariyer", "rfid", "yüz tanıma", "pdks", "access"],
  },
  "yangin-algilama": {
    slug: "yangin-algilama",
    name: "Yangın Algılama",
    image: "/images/categories/yangin-algilama.svg",
    keywords: ["yangın", "duman", "fire", "dedektör", "smoke", "yangın alarm", "yangın panel", "sprinkler", "söndürme"],
  },
};

function detectCategory(query: string): (typeof CATEGORY_SEARCH_MAP)[string] | null {
  const normalized = query
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g");

  for (const cat of Object.values(CATEGORY_SEARCH_MAP)) {
    for (const kw of cat.keywords) {
      const normalizedKw = kw
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c")
        .replace(/ğ/g, "g");
      if (normalized.includes(normalizedKw) || normalizedKw.includes(normalized)) {
        return cat;
      }
    }
  }
  return null;
}

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

  // Detect matching category for banner
  const matchedCategory = useMemo(() => {
    if (!queryParam || queryParam.trim().length < 2) return null;
    return detectCategory(queryParam.trim());
  }, [queryParam]);

  // Featured products in search results (merchandising slot — top 4 from results)
  const featuredInSearch = useMemo(() => {
    if (results.length < 8) return []; // Çok az sonuç varsa gösterme
    return results
      .filter((r) => r.product.is_featured || r.product.is_trending)
      .slice(0, 4)
      .map((r) => r.product);
  }, [results]);

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
            {/* ─── Kategori Banner ─── */}
            {matchedCategory && (
              <Link
                href={`/kategori/${matchedCategory.slug}`}
                className="group relative mb-8 block overflow-hidden rounded-2xl"
              >
                <div className="relative flex items-center gap-6 bg-dark-900 p-0">
                  {/* SVG Görsel */}
                  <div className="hidden w-[280px] flex-shrink-0 sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={matchedCategory.image}
                      alt={matchedCategory.name}
                      className="h-[160px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Mobilde tam genişlik görsel */}
                  <div className="absolute inset-0 sm:hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={matchedCategory.image}
                      alt={matchedCategory.name}
                      className="h-full w-full object-cover opacity-30"
                    />
                  </div>
                  {/* İçerik */}
                  <div className="relative z-10 flex-1 px-6 py-6 sm:py-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary-400">
                      Kategori
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      {matchedCategory.name}
                    </h2>
                    <p className="mt-1 text-sm text-dark-400">
                      {results.length} ürün bulundu — Tüm kategoriyi keşfedin
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-primary-700">
                      Kategoriye Git
                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Öne Çıkan Ürünler — Arama merchandising */}
            {featuredInSearch.length > 0 && (
              <div className="mb-8 rounded-xl border border-primary-100 bg-primary-50/30 dark:border-primary-900/30 dark:bg-primary-950/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-600" />
                  <span className="text-sm font-bold text-dark-800 dark:text-dark-100">Öne Çıkan Ürünler</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {featuredInSearch.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}

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
