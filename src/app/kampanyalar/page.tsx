"use client";

import { useState, useMemo } from "react";
import { Zap, TrendingDown, Clock, Percent } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useCountdown, formatCountdown } from "@/hooks/useFlashSale";

import ProductCard from "@/components/product/ProductCard";

type TabKey = "flash" | "discounted" | "last_chance";

const TABS: { key: TabKey; label: string; icon: typeof Zap; color: string }[] = [
  { key: "flash", label: "Flaş İndirimler", icon: Zap, color: "text-red-600 border-red-600" },
  { key: "discounted", label: "En Çok Düşenler", icon: TrendingDown, color: "text-green-600 border-green-600" },
  { key: "last_chance", label: "Son Fırsatlar", icon: Clock, color: "text-orange-600 border-orange-600" },
];

function FlashCountdown({ endDate }: { endDate: string }) {
  const cd = useCountdown(endDate);
  if (!cd.ready) return null;
  if (cd.isExpired) return <span className="text-xs text-red-500">Süresi doldu</span>;
  return (
    <span className="text-xs font-bold text-red-600">
      {formatCountdown(cd)} kaldı
    </span>
  );
}

export default function KampanyalarPage() {
  const { products, loading } = useProducts();
  const [activeTab, setActiveTab] = useState<TabKey>("flash");

  // Flash sale products (has sale_ends_at and not expired)
  const flashProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.is_active &&
          !p.deleted_at &&
          p.sale_ends_at &&
          new Date(p.sale_ends_at).getTime() > Date.now()
      ),
    [products]
  );

  // Most discounted products (highest discount %)
  const discountedProducts = useMemo(
    () =>
      products
        .filter((p) => p.is_active && !p.deleted_at && p.sale_price && p.sale_price < p.price)
        .sort((a, b) => {
          const discA = a.sale_price ? (a.price - a.sale_price) / a.price : 0;
          const discB = b.sale_price ? (b.price - b.sale_price) / b.price : 0;
          return discB - discA;
        }),
    [products]
  );

  // Last chance: low stock + discount
  const lastChanceProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.is_active &&
            !p.deleted_at &&
            p.stock > 0 &&
            p.stock <= p.critical_stock &&
            p.sale_price &&
            p.sale_price < p.price
        )
        .sort((a, b) => a.stock - b.stock),
    [products]
  );

  const currentProducts =
    activeTab === "flash"
      ? flashProducts
      : activeTab === "discounted"
      ? discountedProducts
      : lastChanceProducts;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold text-dark-900 dark:text-dark-50 sm:text-3xl dark:text-dark-50">
          <Percent size={28} className="text-primary-600" />
          Kampanya Radar
        </h1>
        <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
          Bugünün en avantajlı fırsatlarını keşfedin
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex border-b border-dark-200 dark:border-dark-700">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.key === "flash"
              ? flashProducts.length
              : tab.key === "discounted"
              ? discountedProducts.length
              : lastChanceProducts.length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? tab.color
                  : "border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.key ? "bg-dark-100 text-dark-700 dark:text-dark-200" : "bg-dark-50 text-dark-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : currentProducts.length > 0 ? (
        <>
          {/* Flash sale timers */}
          {activeTab === "flash" && (
            <div className="mb-6 rounded-lg border border-red-100 bg-red-50 dark:bg-red-900/30 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-red-700">
                <Zap size={16} />
                Süre Sınırlı Fırsatlar
              </h3>
              <div className="flex flex-wrap gap-4">
                {flashProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
                    <span className="font-medium">{p.name.slice(0, 30)}...</span>
                    <FlashCountdown endDate={p.sale_ends_at!} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="py-12 text-center">
          <Percent size={48} className="mx-auto mb-4 text-dark-200" />
          <h3 className="text-lg font-bold text-dark-700 dark:text-dark-200">
            {activeTab === "flash"
              ? "Şu an aktif flaş indirim yok"
              : activeTab === "discounted"
              ? "İndirimli ürün bulunamadı"
              : "Son fırsat ürünü bulunamadı"}
          </h3>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Diğer sekmelere göz atabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
