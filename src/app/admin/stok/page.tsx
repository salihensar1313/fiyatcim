"use client";

import { useState, useMemo } from "react";
import { Warehouse, Search, AlertTriangle, Download, Save } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useActivityLog } from "@/context/ActivityLogContext";
import { useToast } from "@/components/ui/Toast";
import { getStockStatus } from "@/lib/utils";
import { exportCSV } from "@/lib/csv";
import {
  ADMIN_CARD, ADMIN_INPUT, ADMIN_TABLE_TH, ADMIN_TABLE_TD, ADMIN_TABLE_HEADER_ROW,
  ADMIN_TABLE_BODY_ROW, ADMIN_EMPTY_STATE, ADMIN_BTN_SECONDARY,
  ADMIN_BADGE_GREEN, ADMIN_BADGE_RED, ADMIN_BADGE_ORANGE,
} from "@/lib/admin-classes";

type StockFilter = "all" | "critical" | "out" | "normal";

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "out", label: "Tükenen" },
  { key: "critical", label: "Kritik" },
  { key: "normal", label: "Normal" },
];

export default function AdminStockPage() {
  const { products, updateProduct } = useProducts();
  const { addLog } = useActivityLog();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [editCritical, setEditCritical] = useState<number>(0);

  const activeProducts = useMemo(() => products.filter((p) => !p.deleted_at), [products]);

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
      case "out":
        result = result.filter((p) => p.stock === 0);
        break;
      case "critical":
        result = result.filter((p) => p.stock > 0 && p.stock <= p.critical_stock);
        break;
      case "normal":
        result = result.filter((p) => p.stock > p.critical_stock);
        break;
    }

    return result;
  }, [activeProducts, search, filter]);

  const startEdit = (productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setEditingId(productId);
    setEditStock(p.stock);
    setEditCritical(p.critical_stock);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const p = products.find((x) => x.id === editingId);
    if (!p) return;
    const oldStock = p.stock;
    await updateProduct(editingId, { stock: editStock, critical_stock: editCritical });
    addLog(
      "stock_update",
      `"${p.name}" stok güncellendi: ${oldStock} → ${editStock}`,
      "product",
      editingId
    );
    showToast("Stok güncellendi", "success");
    setEditingId(null);
  };

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
        <button onClick={handleExportCSV} className={ADMIN_BTN_SECONDARY}>
          <Download size={16} />
          CSV İndir
        </button>
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
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH}>SKU</th>
                  <th className={ADMIN_TABLE_TH}>Stok</th>
                  <th className={ADMIN_TABLE_TH}>Kritik Stok</th>
                  <th className={ADMIN_TABLE_TH}>Durum</th>
                  <th className={ADMIN_TABLE_TH}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = getStockStatus(p.stock, p.critical_stock);
                  const isEditing = editingId === p.id;

                  return (
                    <tr key={p.id} className={ADMIN_TABLE_BODY_ROW}>
                      <td className={`${ADMIN_TABLE_TD} max-w-[220px] truncate font-medium text-dark-900 dark:text-dark-50`}>
                        {p.name}
                      </td>
                      <td className={ADMIN_TABLE_TD}>{p.sku}</td>
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
                      <td className={ADMIN_TABLE_TD}>
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
                              ✕
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
