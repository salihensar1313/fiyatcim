"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Package, ShoppingBag, Users } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "product" | "order" | "customer";
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_ICONS = {
  product: Package,
  order: ShoppingBag,
  customer: Users,
};

const TYPE_COLORS = {
  product: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  order: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  customer: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function AdminSearchCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();
  const { getAllOrders } = useOrders();
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Ctrl+K handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const orders = useMemo(() => getAllOrders(), [getAllOrders]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    // Search products
    products
      .filter((p) => !p.deleted_at && (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
      .slice(0, 5)
      .forEach((p) => {
        items.push({
          id: p.id,
          type: "product",
          title: p.name,
          subtitle: `SKU: ${p.sku} | Stok: ${p.stock}`,
          href: `/admin/urunler`,
        });
      });

    // Search orders
    orders
      .filter((o) => o.order_no.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((o) => {
        items.push({
          id: o.id,
          type: "order",
          title: `Sipariş #${o.order_no}`,
          subtitle: `${o.total.toLocaleString("tr-TR")}₺ | ${new Date(o.created_at).toLocaleDateString("tr-TR")}`,
          href: `/admin/siparisler`,
        });
      });

    return items;
  }, [query, products, orders]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleNav(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        router.push(results[selectedIndex].href);
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleNav);
    return () => document.removeEventListener("keydown", handleNav);
  }, [isOpen, results, selectedIndex, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-dark-200 bg-white shadow-2xl dark:border-dark-700 dark:bg-dark-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-dark-100 px-4 dark:border-dark-700">
          <Search size={18} className="shrink-0 text-dark-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ürün, sipariş veya müşteri ara..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            className="flex-1 bg-transparent py-3.5 text-sm text-dark-900 placeholder-dark-400 outline-none dark:text-dark-50"
          />
          <kbd className="hidden rounded border border-dark-200 px-1.5 py-0.5 text-[10px] font-medium text-dark-400 dark:border-dark-600 sm:inline">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.length >= 2 && (
          <div className="max-h-72 overflow-y-auto p-2">
            {results.length === 0 ? (
              <div className="py-8 text-center text-sm text-dark-400">
                Sonuç bulunamadı
              </div>
            ) : (
              results.map((r, i) => {
                const Icon = TYPE_ICONS[r.type];
                return (
                  <button
                    key={r.id}
                    onClick={() => { router.push(r.href); setIsOpen(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-primary-50 dark:bg-primary-900/20"
                        : "hover:bg-dark-50 dark:hover:bg-dark-700/50"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[r.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-dark-900 dark:text-dark-50">{r.title}</p>
                      <p className="truncate text-xs text-dark-400">{r.subtitle}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-dark-100 px-4 py-2 dark:border-dark-700">
          <span className="text-[10px] text-dark-400">↑↓ gezin · Enter seç · Esc kapat</span>
        </div>
      </div>
    </div>
  );
}
