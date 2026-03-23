"use client";

import { useState, useRef, useEffect } from "react";
import { Shield, Truck, Package, CheckCircle } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Product } from "@/types";
import { useProductReviews } from "@/hooks/useProductReviews";
import { useProductQA } from "@/hooks/useProductQA";
import ReviewsTab from "@/components/product/tabs/ReviewsTab";
import QATab from "@/components/product/tabs/QATab";
import InstallmentTab from "@/components/product/tabs/InstallmentTab";
import ReturnPolicyTab from "@/components/product/tabs/ReturnPolicyTab";
import PriceHistoryChart from "@/components/product/PriceHistoryChart";

interface ProductTabsProps {
  product: Product;
}

type TabKey = "description" | "specs" | "reviews" | "qa" | "installment" | "returns" | "price-history";

export default function ProductTabs({ product }: ProductTabsProps) {
  const { reviews } = useProductReviews(product.id);
  const { questions } = useProductQA(product.id);

  // Read initial tab from URL hash
  const getInitialTab = (): TabKey => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabKey;
      const valid: TabKey[] = ["description", "specs", "reviews", "qa", "installment", "returns", "price-history"];
      if (valid.includes(hash)) return hash;
    }
    return "description";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "description", label: "Ürün Açıklaması" },
    { key: "specs", label: "Teknik Özellikler" },
    { key: "reviews", label: "Değerlendirmeler", badge: reviews.length },
    { key: "qa", label: "Soru Cevap", badge: questions.length },
    { key: "installment", label: "Taksit Seçenekleri" },
    { key: "returns", label: "İade ve Değişim" },
    { key: "price-history", label: "Fiyat Geçmişi" },
  ];

  const checkScroll = () => {
    const el = tabsRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 10);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const handleTabClick = (key: TabKey) => {
    setActiveTab(key);
    // Scroll the active tab button into view
    const tabsEl = tabsRef.current;
    if (tabsEl) {
      const activeBtn = tabsEl.querySelector(`[data-tab="${key}"]`) as HTMLElement;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  };

  return (
    <div>
      {/* Tab Headers with scroll */}
      <div className="relative">
        {showLeftFade && (
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white dark:from-dark-800 to-transparent" />
        )}

        <div
          ref={tabsRef}
          className="scrollbar-hide flex overflow-x-auto border-b border-dark-200 dark:border-dark-600"
          onScroll={checkScroll}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              data-tab={tab.key}
              onClick={() => handleTabClick(tab.key)}
              className={`relative shrink-0 px-4 py-3.5 text-sm font-semibold transition-colors sm:px-6 ${
                activeTab === tab.key
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:text-dark-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      activeTab === tab.key
                        ? "bg-primary-600 text-white"
                        : "bg-dark-200 text-dark-600 dark:text-dark-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {showRightFade && (
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white dark:from-dark-800 to-transparent" />
        )}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "description" && (
          <div className="space-y-6">
            <div
              className="prose max-w-none text-dark-700 dark:text-dark-200 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:my-1 [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
            />

            {/* Highlights */}
            <div className="grid gap-4 sm:grid-cols-3">
              {product.warranty_months > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20 p-4">
                  <Shield size={20} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                      {product.warranty_months} Ay Garanti
                    </p>
                    <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">Üretici garantisi kapsamında</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20 p-4">
                <Truck size={20} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    {product.shipping_type === "kurulum" ? "Ücretsiz Kurulum" : "Hızlı Kargo"}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                    {product.shipping_type === "kurulum"
                      ? "Profesyonel ekip ile montaj"
                      : "2.000₺ üzeri ücretsiz"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20 p-4">
                <Package size={20} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">14 Gün İade</p>
                  <p className="mt-0.5 text-xs text-purple-700 dark:text-purple-400">Koşulsuz iade ve değişim</p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            {Object.keys(product.specs).length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dark-900 dark:text-dark-50">Öne Çıkan Özellikler</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(product.specs)
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <CheckCircle size={14} className="shrink-0 text-primary-600" />
                        <span className="text-sm text-dark-700 dark:text-dark-200">
                          <span className="font-medium">{key}:</span> {value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="overflow-x-auto rounded-lg border border-dark-100 dark:border-dark-700">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specs).map(([key, value], index) => (
                  <tr key={key} className={index % 2 === 0 ? "bg-dark-50 dark:bg-dark-700" : "bg-white dark:bg-dark-800"}>
                    <td className="w-1/3 px-4 py-3 text-sm font-semibold text-dark-700 dark:text-dark-200">{key}</td>
                    <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && <ReviewsTab product={product} />}
        {activeTab === "qa" && <QATab product={product} />}
        {activeTab === "installment" && <InstallmentTab product={product} />}
        {activeTab === "returns" && <ReturnPolicyTab />}
        {activeTab === "price-history" && (
          <PriceHistoryChart
            productId={product.id}
            currentPrice={product.sale_price || product.price}
            compact
          />
        )}
      </div>
    </div>
  );
}
