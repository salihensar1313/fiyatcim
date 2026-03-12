"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Warehouse, Search, AlertTriangle, Download, Save, Edit2, X, CheckSquare, Square, ShoppingCart } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { useActivityLog } from "@/context/ActivityLogContext";
import { useToast } from "@/components/ui/Toast";
import { getStockStatus } from "@/lib/utils";
import { exportCSV } from "@/lib/csv";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import {
  ADMIN_CARD, ADMIN_INPUT, ADMIN_TABLE_TH, ADMIN_TABLE_TD, ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_BODY_ROW, ADMIN_EMPTY_STATE, ADMIN_BTN_SECONDARY,
  ADMIN_BADGE_GREEN, ADMIN_BADGE_RED, ADMIN_BADGE_ORANGE, ADMIN_BADGE_BLUE,
} from "@/lib/admin-classes";

type StockFilter = "all" | "critical" | "out" | "normal";

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "out", label: "Tükenen" },
  { key: "critical", label: "Kritik" },
  { key: "normal", label: "Normal" },
];

const STORAGE_KEY = "fiyatcim_stock_history";

interface StockHistoryEntry {
  productId: string;
  stock: number;
  date: string; // ISO date (YYYY-MM-DD)
}

/** Record current stock levels once per day */
function recordStockSnapshot(products: { id: string; stock: number; deleted_at: string | null }[]) {
  const today = new Date().toISOString().slice(0, 10);
  const history: StockHistoryEntry[] = safeGetJSON(STORAGE_KEY, []);
  // Check if we already recorded today
  if (history.some((h) => h.date === today)) return;
  const newEntries = products
    .filter((p) => !p.deleted_at)
    .map((p) => ({ productId: p.id, stock: p.stock, date: today }));
  // Keep max 30 days of history
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const pruned = history.filter((h) => h.date >= cutoffStr);
  safeSetJSON(STORAGE_KEY, [...pruned, ...newEntries]);
}

export default function AdminStockPage() {
  const { products, updateProduct } = useProducts();
  const { getAllOrders } = useOrders();
  const { addLog } = useActivityLog();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editCritical, setEditCritical] = useState<number>(0);

  // Batch mode
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchStock, setBatchStock] = useState<string>("");

  // Stock history
  const [stockHistory, setStockHistory] = useState<StockHistoryEntry[]>([]);

  const activeProducts = useMemo(() => products.filter((p) => !p.deleted_at), [products]);
  const orders = useMemo(() => getAllOrders(), [getAllOrders]);

  // Record stock snapshot on page load (once/day)
  useEffect(() => {
    if (activeProducts.length > 0) {
      recordStockSnapshot(activeProducts);
      setStockHistory(safeGetJSON(STORAGE_KEY, []));
    }
  }, [activeProducts]);

  // Reorder suggestions: avg daily sales in last 30 days
  const reorderSuggestions = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo && o.status !== "cancelled");
    const salesMap: Record<string, number> = {};
    recentOrders.forEach((o) => {
      o.items?.forEach((item) => {
        salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.qty;
      });
    });
    const suggestions: Record<string, { avgDaily: number; daysLeft: number }> = {};
    activeProducts.forEach((p) => {
      const totalSold = salesMap[p.id] || 0;
      if (totalSold === 0) return;
      const avgDaily = totalSold / 30;
      const daysLeft = p.stock > 0 ? Math.floor(p.stock / avgDaily) : 0;
      if (daysLeft <= 14) {
        suggestions[p.id] = { avgDaily, daysLeft };
      }
    });
    return suggestions;
  }, [orders, activeProducts]);

  const criticalCount = useMemo(
    () => activeProducts.filter((p) => p.stock > 0 && p.stock <= p.critical_stock).length,
    [activeProducts]
  );
  const outOfStockCount = useMemo(
    () => activeProducts.filter((p) => p.stock === 0).length,
    [activeProducts]
  );

  const filtered = useMemo(() => {
    let result = activeProducts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    switch (filter) {
      case "out": result = result.filter((p) => p.stock === 0); break;
      case "critical": result = result.filter((p) => p.stock > 0 && p.stock <= p.critical_stock); break;
      case "normal": result = result.filter((p) => p.stock > p.critical_stock); break;
    }
    return result;
  }, [activeProducts, search, filter]);

  // Single row edit
  const startEdit = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setEditingId(productId);
    setEditStock(p.stock);
    setEditCritical(p.critical_stock);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async () => {
    if (!editingId) return;
    const p = products.find((x) => x.id === editingId);
    if (!p) return;
    const oldStock = p.stock;
    await updateProduct(editingId, { stock: editStock, critical_stock: editCritical });
    addLog("stock_update", `"${p.name}" stok güncellendi: ${oldStock} → ${editStock}`, "product", editingId);
    showToast("Stok güncellendi", "success");
    setEditingId(null);
  };

  // Batch mode
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleBatchSave = async () => {
    const stockVal = parseInt(batchStock);
    if (isNaN(stockVal) || stockVal < 0) {
      showToast("Geçerli bir stok değeri girin", "error");
      return;
    }
    let count = 0;
    for (const id of Array.from(selectedIds)) {
      const p = products.find((x) => x.id === id);
      if (!p) continue;
      await updateProduct(id, { stock: stockVal });
      count++;
    }
    addLog("stock_update", `Toplu stok güncelleme: ${count} ürün → ${stockVal} adet`, "product");
    showToast(`${count} ürünün stoğu ${stockVal} olarak güncellendi`, "success");
    setSelectedIds(new Set());
    setBatchStock("");
    setBatchMode(false);
  };

  const handleBatchCancel = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
    setBatchStock("");
  };

  // Sparkline data for a product
  const getSparklineData = useCallback(
    (productId: string) => {
      const entries = stockHistory
        .filter((h) => h.productId === productId)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (entries.length < 2) return null;
      return entries.map((e) => ({ v: e.stock }));
    },
    [stockHistory]
  );

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-stok-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["SKU", "Ürün Adı", "Stok", "Kritik Stok", "Durum"],
      rows: filtered.map((p) => {
        const st = getStockStatus(p.stock, p.critical_stock);
        return [p.sku, p.name, p.stock, p.critical_stock, st.label];
      }),
    });
    showToast("Stok raporu CSV olarak indirildi", "success");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Stok Yönetimi</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            {activeProducts.length} ürün takip ediliyor
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => batchMode ? handleBatchCancel() : setBatchMode(true)}
            className={`${ADMIN_BTN_SECONDARY} ${batchMode ? "!border-primary-500 !text-primary-600 dark:!text-primary-400" : ""}`}
          >
            <Edit2 size={16} />
            {batchMode ? "Toplu Modu Kapat" : "Toplu Güncelle"}
          </button>
          <button onClick={handleExportCSV} className={ADMIN_BTN_SECONDARY}>
            <Download size={16} />
            CSV İndir
          </button>
        </div>
      </div>

      {/* Alert card */}
      {(criticalCount > 0 || outOfStockCount > 0) && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="shrink-0 text-orange-500" size={20} />
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <span className="font-semibold">{outOfStockCount}</span> ürün tükendi,{" "}
            <span className="font-semibold">{criticalCount}</span> ürün kritik seviyede.
          </p>
        </div>
      )}

      {/* Batch action bar */}
      {batchMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selectedIds.size} ürün seçili
          </span>
          <input
            type="number"
            min={0}
            placeholder="Yeni stok"
            value={batchStock}
            onChange={(e) => setBatchStock(e.target.value)}
            className="w-28 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm dark:border-indigo-700 dark:bg-dark-800 dark:text-dark-100"
          />
          <button
            onClick={handleBatchSave}
            disabled={selectedIds.size === 0 || !batchStock}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            <Save size={14} className="mr-1 inline" />
            Uygula
          </button>
          <button onClick={handleBatchCancel} className="text-sm text-dark-500 hover:text-dark-700 dark:text-dark-400">
            İptal
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === t.key
                  ? "bg-primary-600 text-white"
                  : "bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
              }`}
            >
              {t.label}
              {t.key === "out" && outOfStockCount > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{outOfStockCount}</span>
              )}
              {t.key === "critical" && criticalCount > 0 && (
                <span className="ml-1 rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{criticalCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Ürün adı veya SKU ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${ADMIN_INPUT} pl-9`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`${ADMIN_CARD} overflow-hidden`}>
        {filtered.length === 0 ? (
          <div className={ADMIN_EMPTY_STATE}>
            <Warehouse size={40} className="mx-auto mb-2 text-dark-200 dark:text-dark-600" />
            <p className="text-sm text-dark-400">Ürün bulunamadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  {batchMode && (
                    <th className={ADMIN_TABLE_TH + " w-10"}>
                      <button onClick={selectAll} className="text-dark-500 hover:text-dark-700 dark:text-dark-400">
                        {selectedIds.size === filtered.length ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </th>
                  )}
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH + " hidden sm:table-cell"}>SKU</th>
                  <th className={ADMIN_TABLE_TH}>Stok</th>
                  <th className={ADMIN_TABLE_TH + " hidden md:table-cell"}>Kritik</th>
                  <th className={ADMIN_TABLE_TH + " hidden lg:table-cell"}>Trend</th>
                  <th className={ADMIN_TABLE_TH}>Durum</th>
                  <th className={ADMIN_TABLE_TH}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = getStockStatus(p.stock, p.critical_stock);
                  const isEditing = editingId === p.id;
                  const sparkline = getSparklineData(p.id);
                  const reorder = reorderSuggestions[p.id];

                  return (
                    <tr key={p.id} className={ADMIN_TABLE_BODY_ROW}>
                      {batchMode && (
                        <td className={ADMIN_TABLE_TD}>
                          <button onClick={() => toggleSelect(p.id)} className="text-dark-500 hover:text-dark-700 dark:text-dark-400">
                            {selectedIds.has(p.id) ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                          </button>
                        </td>
                      )}
                      <td className={`${ADMIN_TABLE_TD} max-w-[220px]`}>
                        <span className="block truncate font-medium text-dark-900 dark:text-dark-50">{p.name}</span>
                        {reorder && (
                          <span className={`mt-0.5 inline-flex items-center gap-1 ${ADMIN_BADGE_BLUE} text-[10px]`}>
                            <ShoppingCart size={10} />
                            {reorder.daysLeft === 0 ? "Tükendi" : `~${reorder.daysLeft} gün`}
                          </span>
                        )}
                      </td>
                      <td className={ADMIN_TABLE_TD + " hidden sm:table-cell"}>{p.sku}</td>
                      <td className={ADMIN_TABLE_TD}>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editStock}
                            onChange={(e) => setEditStock(Number(e.target.value))}
                            className="w-20 rounded border border-dark-300 bg-white px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
                          />
                        ) : (
                          <span className={`font-semibold ${st.color}`}>{p.stock}</span>
                        )}
                      </td>
                      <td className={ADMIN_TABLE_TD + " hidden md:table-cell"}>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editCritical}
                            onChange={(e) => setEditCritical(Number(e.target.value))}
                            className="w-20 rounded border border-dark-300 bg-white px-2 py-1 text-sm dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
                          />
                        ) : (
                          p.critical_stock
                        )}
                      </td>
                      <td className={ADMIN_TABLE_TD + " hidden lg:table-cell"}>
                        {sparkline ? (
                          <div style={{ width: 80, height: 28 }}>
                            <ResponsiveContainer>
                              <LineChart data={sparkline}>
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke={p.stock <= p.critical_stock ? "#ef4444" : "#16a34a"}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <span className="text-xs text-dark-300 dark:text-dark-600">—</span>
                        )}
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        <span
                          className={
                            p.stock === 0
                              ? ADMIN_BADGE_RED
                              : p.stock <= p.critical_stock
                              ? ADMIN_BADGE_ORANGE
                              : ADMIN_BADGE_GREEN
                          }
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className={ADMIN_TABLE_TD}>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              className="rounded bg-green-600 p-1.5 text-white hover:bg-green-700"
                              title="Kaydet"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="rounded bg-dark-200 p-1.5 text-dark-600 hover:bg-dark-300 dark:bg-dark-600 dark:text-dark-300"
                              title="İptal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p.id)}
                            className="rounded-lg border border-dark-200 px-3 py-1 text-xs font-medium text-dark-600 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-700"
                          >
                            Güncelle
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
