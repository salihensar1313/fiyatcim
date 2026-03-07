"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, ShoppingCart, Package, Download, DollarSign } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useOrders } from "@/context/OrderContext";
import { formatPrice } from "@/lib/utils";
import { getCategories } from "@/lib/queries";
import { exportCSV } from "@/lib/csv";
import { useToast } from "@/components/ui/Toast";
import { ADMIN_CARD, ADMIN_EMPTY_STATE, ADMIN_TABLE_TH, ADMIN_TABLE_TD, ADMIN_TABLE_HEADER_ROW, ADMIN_TABLE_BODY_ROW, ADMIN_BTN_SECONDARY } from "@/lib/admin-classes";
import type { DateRange } from "@/types/admin";
import type { Category } from "@/types";
import { useEffect } from "react";

const DATE_TABS: { key: DateRange; label: string }[] = [
  { key: "today", label: "Bugün" },
  { key: "7d", label: "7 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "all", label: "Tümü" },
];

const CHART_COLORS = ["#DC2626", "#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function isInRange(dateStr: string, range: DateRange): boolean {
  if (range === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (range === "today") return diffDays < 1 && d.toDateString() === now.toDateString();
  if (range === "7d") return diffDays <= 7;
  if (range === "30d") return diffDays <= 30;
  return true;
}

export default function AdminReportsPage() {
  const { products } = useProducts();
  const { getAllOrders } = useOrders();
  const { showToast } = useToast();
  const [range, setRange] = useState<DateRange>("30d");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const orders = useMemo(() => getAllOrders(), [getAllOrders]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => isInRange(o.created_at, range) && o.status !== "cancelled"),
    [orders, range]
  );

  // Summary stats
  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.total, 0), [filteredOrders]);
  const avgBasket = useMemo(
    () => filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
    [filteredOrders, totalRevenue]
  );

  // Top 10 products
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const key = item.product_id;
        if (!map[key]) map[key] = { name: item.name_snapshot, qty: 0, revenue: 0 };
        map[key].qty += item.qty;
        map[key].revenue += (item.sale_price_snapshot || item.price_snapshot) * item.qty;
      });
    });
    return Object.entries(map)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders]);

  // Category revenue
  const categoryRevenue = useMemo(() => {
    const map: Record<string, { category: string; revenue: number; count: number }> = {};
    filteredOrders.forEach((o) => {
      o.items?.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const catId = prod?.category_id || "other";
        const catName = categories.find((c) => c.id === catId)?.name || "Diğer";
        if (!map[catId]) map[catId] = { category: catName, revenue: 0, count: 0 };
        map[catId].revenue += (item.sale_price_snapshot || item.price_snapshot) * item.qty;
        map[catId].count += item.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, products, categories]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const map: Record<string, { month: string; revenue: number; orders: number }> = {};
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        const d = new Date(o.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = new Intl.DateTimeFormat("tr-TR", { month: "short", year: "numeric" }).format(d);
        if (!map[key]) map[key] = { month: label, revenue: 0, orders: 0 };
        map[key].revenue += o.total;
        map[key].orders += 1;
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
      .slice(-12);
  }, [orders]);

  const handleExportCSV = () => {
    exportCSV({
      filename: `fiyatcim-rapor-${new Date().toISOString().slice(0, 10)}.csv`,
      headers: ["Sipariş No", "Tarih", "Durum", "Toplam (₺)", "Ürün Sayısı"],
      rows: filteredOrders.map((o) => [
        o.order_no,
        new Date(o.created_at).toLocaleDateString("tr-TR"),
        o.status,
        o.total,
        o.items?.reduce((s, i) => s + i.qty, 0) ?? 0,
      ]),
    });
    showToast("Rapor CSV olarak indirildi", "success");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Raporlar</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Satış ve performans analizleri</p>
        </div>
        <button onClick={handleExportCSV} className={ADMIN_BTN_SECONDARY}>
          <Download size={16} />
          CSV İndir
        </button>
      </div>

      {/* Date filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {DATE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setRange(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              range === t.key
                ? "bg-primary-600 text-white"
                : "bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={`${ADMIN_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Toplam Ciro</p>
              <p className="text-xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className={`${ADMIN_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Sipariş Sayısı</p>
              <p className="text-xl font-bold text-dark-900 dark:text-dark-50">{filteredOrders.length}</p>
            </div>
          </div>
        </div>
        <div className={`${ADMIN_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Ortalama Sepet</p>
              <p className="text-xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(avgBasket)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Revenue Bar Chart */}
        <div className={`${ADMIN_CARD} p-5`}>
          <h3 className="mb-4 text-sm font-semibold text-dark-900 dark:text-dark-50">Kategori Bazlı Ciro</h3>
          {categoryRevenue.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-dark-400">Veri yok</div>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={categoryRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="category" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(17,24,39,0.9)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatPrice(Number(value)), "Ciro"]}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {categoryRevenue.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Trend Line Chart */}
        <div className={`${ADMIN_CARD} p-5`}>
          <h3 className="mb-4 text-sm font-semibold text-dark-900 dark:text-dark-50">Aylık Satış Trendi</h3>
          {monthlyTrend.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-dark-400">Veri yok</div>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(17,24,39,0.9)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      name === "revenue" ? formatPrice(Number(value)) : value,
                      name === "revenue" ? "Ciro" : "Sipariş",
                    ]}
                    labelStyle={{ color: "#9ca3af" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Products */}
      <div className={`${ADMIN_CARD} overflow-hidden`}>
        <div className="border-b border-dark-100 px-5 py-4 dark:border-dark-700">
          <h3 className="text-sm font-semibold text-dark-900 dark:text-dark-50">
            En Çok Satan 10 Ürün
          </h3>
        </div>
        {topProducts.length === 0 ? (
          <div className={ADMIN_EMPTY_STATE}>
            <Package size={40} className="mx-auto mb-2 text-dark-200 dark:text-dark-600" />
            <p className="text-sm text-dark-400">Henüz satış verisi yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>#</th>
                  <th className={ADMIN_TABLE_TH}>Ürün</th>
                  <th className={ADMIN_TABLE_TH}>Satış Adedi</th>
                  <th className={ADMIN_TABLE_TH}>Ciro</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className={ADMIN_TABLE_TD}>
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i < 3 ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "bg-dark-100 text-dark-500 dark:bg-dark-700 dark:text-dark-400"
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className={`${ADMIN_TABLE_TD} max-w-[250px] truncate font-medium`}>{p.name}</td>
                    <td className={ADMIN_TABLE_TD}>{p.qty}</td>
                    <td className={`${ADMIN_TABLE_TD} font-semibold text-dark-900 dark:text-dark-50`}>
                      {formatPrice(p.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
