"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingCart, Package, Download, DollarSign, GitCompareArrows } from "lucide-react";
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

const PIE_COLORS: Record<string, string> = {
  delivered: "#16a34a",
  shipped: "#2563eb",
  preparing: "#f59e0b",
  paid: "#8b5cf6",
  pending_payment: "#9ca3af",
  cancelled: "#ef4444",
  refunded: "#ec4899",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Ödeme Bekleniyor",
  paid: "Ödeme Alındı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
  refunded: "İade",
};

type CSVReportType = "orders" | "products" | "categories";

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

/** Get previous period range in days for comparison */
function getPrevPeriodDays(range: DateRange): number | null {
  if (range === "today") return 1;
  if (range === "7d") return 7;
  if (range === "30d") return 30;
  return null;
}

function isInPrevRange(dateStr: string, range: DateRange): boolean {
  const days = getPrevPeriodDays(range);
  if (days === null) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (range === "today") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  }
  return diffDays > days && diffDays <= days * 2;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export default function AdminReportsPage() {
  const { products } = useProducts();
  const { getAllOrders } = useOrders();
  const { showToast } = useToast();
  const [range, setRange] = useState<DateRange>("30d");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [csvReportType, setCsvReportType] = useState<CSVReportType>("orders");

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  const orders = useMemo(() => getAllOrders(), [getAllOrders]);
  const allOrders = useMemo(() => orders.filter((o) => o.status !== "cancelled"), [orders]);

  const filteredOrders = useMemo(
    () => allOrders.filter((o) => isInRange(o.created_at, range)),
    [allOrders, range]
  );

  // Previous period orders (for comparison)
  const prevOrders = useMemo(
    () => allOrders.filter((o) => isInPrevRange(o.created_at, range)),
    [allOrders, range]
  );

  // Summary stats — current period
  const totalRevenue = useMemo(() => filteredOrders.reduce((s, o) => s + o.total, 0), [filteredOrders]);
  const avgBasket = useMemo(
    () => filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
    [filteredOrders, totalRevenue]
  );

  // Summary stats — previous period
  const prevRevenue = useMemo(() => prevOrders.reduce((s, o) => s + o.total, 0), [prevOrders]);
  const prevAvgBasket = useMemo(
    () => prevOrders.length > 0 ? prevRevenue / prevOrders.length : 0,
    [prevOrders, prevRevenue]
  );

  // % changes
  const revenuePct = showComparison ? pctChange(totalRevenue, prevRevenue) : null;
  const ordersPct = showComparison ? pctChange(filteredOrders.length, prevOrders.length) : null;
  const basketPct = showComparison ? pctChange(avgBasket, prevAvgBasket) : null;

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
    allOrders.forEach((o) => {
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
  }, [allOrders]);

  // Payment/Order status distribution (pie chart)
  const statusDistribution = useMemo(() => {
    const map: Record<string, { status: string; label: string; count: number; revenue: number }> = {};
    // Include cancelled orders for status pie
    orders
      .filter((o) => isInRange(o.created_at, range))
      .forEach((o) => {
        if (!map[o.status]) map[o.status] = { status: o.status, label: STATUS_LABELS[o.status] || o.status, count: 0, revenue: 0 };
        map[o.status].count += 1;
        map[o.status].revenue += o.total;
      });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [orders, range]);

  // CSV Export handler
  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (csvReportType === "orders") {
      exportCSV({
        filename: `fiyatcim-siparisler-${dateStr}.csv`,
        headers: ["Sipariş No", "Tarih", "Durum", "Ödeme Durumu", "Toplam (₺)", "Ürün Sayısı", "Müşteri ID"],
        rows: filteredOrders.map((o) => [
          o.order_no,
          new Date(o.created_at).toLocaleDateString("tr-TR"),
          STATUS_LABELS[o.status] || o.status,
          o.payment_status,
          o.total,
          o.items?.reduce((s, i) => s + i.qty, 0) ?? 0,
          o.user_id,
        ]),
      });
    } else if (csvReportType === "products") {
      exportCSV({
        filename: `fiyatcim-urunler-${dateStr}.csv`,
        headers: ["Ürün Adı", "SKU", "Fiyat (₺)", "İndirimli Fiyat (₺)", "Stok", "Kategori", "Durum"],
        rows: products.map((p) => [
          p.name,
          p.sku,
          p.price,
          p.sale_price ?? "",
          p.stock,
          categories.find((c) => c.id === p.category_id)?.name || "—",
          p.is_active ? "Aktif" : "Pasif",
        ]),
      });
    } else {
      exportCSV({
        filename: `fiyatcim-kategoriler-${dateStr}.csv`,
        headers: ["Kategori", "Ürün Sayısı", "Toplam Ciro (₺)", "Satış Adedi"],
        rows: categoryRevenue.map((c) => [c.category, c.count, c.revenue, c.count]),
      });
    }
    showToast("Rapor CSV olarak indirildi", "success");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Raporlar</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Satış ve performans analizleri</p>
        </div>
        <div className="flex items-center gap-2">
          {/* CSV Report Type Selector */}
          <select
            value={csvReportType}
            onChange={(e) => setCsvReportType(e.target.value as CSVReportType)}
            className="rounded-lg border border-dark-200 bg-white px-2 py-2 text-xs text-dark-700 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-300"
          >
            <option value="orders">Siparişler</option>
            <option value="products">Ürünler</option>
            <option value="categories">Kategoriler</option>
          </select>
          <button onClick={handleExportCSV} className={ADMIN_BTN_SECONDARY}>
            <Download size={16} />
            CSV İndir
          </button>
        </div>
      </div>

      {/* Date filter + comparison toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
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
        {range !== "all" && (
          <button
            onClick={() => setShowComparison((v) => !v)}
            className={`ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              showComparison
                ? "bg-indigo-600 text-white"
                : "bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
            }`}
          >
            <GitCompareArrows size={14} />
            Karşılaştır
          </button>
        )}
      </div>

      {/* Summary cards with comparison badges */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<DollarSign size={20} />}
          iconBg="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          label="Toplam Ciro"
          value={formatPrice(totalRevenue)}
          pct={revenuePct}
        />
        <SummaryCard
          icon={<ShoppingCart size={20} />}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          label="Sipariş Sayısı"
          value={String(filteredOrders.length)}
          pct={ordersPct}
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          label="Ortalama Sepet"
          value={formatPrice(avgBasket)}
          pct={basketPct}
        />
      </div>

      {/* Charts — 2 columns */}
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

        {/* Order Status Pie Chart */}
        <div className={`${ADMIN_CARD} p-5`}>
          <h3 className="mb-4 text-sm font-semibold text-dark-900 dark:text-dark-50">Sipariş Durumu Dağılımı</h3>
          {statusDistribution.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-dark-400">Veri yok</div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div style={{ width: 200, height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "#9ca3af"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "rgba(17,24,39,0.9)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: any) => [`${value} sipariş`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {statusDistribution.map((s) => (
                  <div key={s.status} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[s.status] || "#9ca3af" }} />
                    <span className="text-xs text-dark-600 dark:text-dark-400">{s.label}</span>
                    <span className="text-xs font-semibold text-dark-900 dark:text-dark-100">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend — full width */}
      <div className={`${ADMIN_CARD} mb-6 p-5`}>
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

// ==========================================
// Sub-component: Summary card with % badge
// ==========================================

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
  pct,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  pct: number | null;
}) {
  return (
    <div className={`${ADMIN_CARD} p-5`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-dark-500 dark:text-dark-400">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-dark-900 dark:text-dark-50">{value}</p>
            {pct !== null && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  pct >= 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {pct >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
