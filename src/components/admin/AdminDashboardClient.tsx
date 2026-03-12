"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { DollarSign, ShoppingBag, Package, Users, ArrowRight, Plus, BarChart3, Tag, Percent, Receipt } from "lucide-react";
import Link from "next/link";
import StatsCard from "@/components/admin/StatsCard";
import DateRangeSelector from "@/components/admin/charts/DateRangeSelector";

const RevenueChart = dynamic(() => import("@/components/admin/charts/RevenueChart"), { ssr: false });
const OrdersStatusChart = dynamic(() => import("@/components/admin/charts/OrdersStatusChart"), { ssr: false });
const CategoryPieChart = dynamic(() => import("@/components/admin/charts/CategoryPieChart"), { ssr: false });
const CustomerGrowthChart = dynamic(() => import("@/components/admin/charts/CustomerGrowthChart"), { ssr: false });
import { useProducts } from "@/context/ProductContext";
import { formatPrice, timeAgo } from "@/lib/utils";
import { safeGetJSON } from "@/lib/safe-storage";
import { ADMIN_CARD } from "@/lib/admin-classes";
import { ORDER_STATUS_LABELS } from "@/types";
import type { DateRange, RevenuePoint, OrderStatusPoint, CategorySalesPoint } from "@/types/admin";
import type { Order } from "@/types";

// ==========================================
// DATA PREPARATION
// ==========================================

function getDateThreshold(range: DateRange): number {
  const now = Date.now();
  switch (range) {
    case "today": return now - 24 * 60 * 60 * 1000;
    case "7d": return now - 7 * 24 * 60 * 60 * 1000;
    case "30d": return now - 30 * 24 * 60 * 60 * 1000;
    case "all": return 0;
  }
}

function buildRevenueData(orders: Order[], range: DateRange): RevenuePoint[] {
  const threshold = getDateThreshold(range);
  const filtered = orders.filter((o) => new Date(o.created_at).getTime() >= threshold);

  const dayMap = new Map<string, { revenue: number; count: number }>();
  const dayLabels = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  filtered.forEach((o) => {
    const d = new Date(o.created_at);
    const key = range === "today"
      ? `${d.getHours()}:00`
      : range === "7d"
      ? dayLabels[d.getDay()]
      : `${d.getDate()}/${d.getMonth() + 1}`;

    const existing = dayMap.get(key) || { revenue: 0, count: 0 };
    dayMap.set(key, { revenue: existing.revenue + o.total, count: existing.count + 1 });
  });

  return Array.from(dayMap.entries()).map(([date, v]) => ({
    date,
    revenue: v.revenue,
    orderCount: v.count,
  }));
}

function buildStatusData(orders: Order[]): OrderStatusPoint[] {
  const statusColors: Record<string, string> = {
    pending_payment: "#EAB308",
    paid: "#3B82F6",
    preparing: "#F97316",
    shipped: "#8B5CF6",
    delivered: "#22C55E",
    cancelled: "#EF4444",
    refunded: "#6B7280",
  };

  const counts = new Map<string, number>();
  orders.forEach((o) => counts.set(o.status, (counts.get(o.status) || 0) + 1));

  return Array.from(counts.entries()).map(([status, count]) => ({
    status,
    label: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status,
    count,
    color: statusColors[status] || "#6B7280",
  }));
}

function buildCategoryData(orders: Order[], products: { id: string; category?: { name: string } }[]): CategorySalesPoint[] {
  const catMap = new Map<string, { revenue: number; count: number }>();
  const productCatMap = new Map<string, string>();
  products.forEach((p) => {
    if (p.category) productCatMap.set(p.id, p.category.name);
  });

  orders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const catName = productCatMap.get(item.product_id) || "Diğer";
      const existing = catMap.get(catName) || { revenue: 0, count: 0 };
      const price = item.sale_price_snapshot ?? item.price_snapshot;
      catMap.set(catName, { revenue: existing.revenue + price * item.qty, count: existing.count + item.qty });
    });
  });

  return Array.from(catMap.entries())
    .map(([category, v]) => ({ category, revenue: v.revenue, count: v.count }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildSparkline(orders: Order[], days: number): number[] {
  const result: number[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
    const dayEnd = now - i * 24 * 60 * 60 * 1000;
    const dayTotal = orders
      .filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      })
      .reduce((sum, o) => sum + o.total, 0);
    result.push(dayTotal);
  }
  return result;
}

// ==========================================
// COMPONENT
// ==========================================

const QUICK_ACTIONS = [
  { label: "Yeni Ürün", href: "/admin/urunler", icon: Plus, color: "bg-primary-600 text-white" },
  { label: "Siparişler", href: "/admin/siparisler", icon: ShoppingBag, color: "bg-blue-600 text-white" },
  { label: "Stok Yönetimi", href: "/admin/stok", icon: Package, color: "bg-orange-600 text-white" },
  { label: "Kuponlar", href: "/admin/kuponlar", icon: Tag, color: "bg-purple-600 text-white" },
  { label: "Raporlar", href: "/admin/raporlar", icon: BarChart3, color: "bg-green-600 text-white" },
];

export default function AdminDashboardClient() {
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<{ user_id: string; email?: string; ad?: string; soyad?: string; created_at?: string }[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  useEffect(() => {
    const storedOrders = safeGetJSON<Order[]>("fiyatcim_orders", []);
    if (Array.isArray(storedOrders)) setOrders(storedOrders);

    const storedUsers = safeGetJSON<{ user_id: string; email?: string; ad?: string; soyad?: string; created_at?: string }[]>("fiyatcim_registered_users", []);
    if (Array.isArray(storedUsers)) setCustomers(storedUsers);
  }, []);

  const activeProducts = useMemo(() => products.filter((p) => p.is_active && !p.deleted_at), [products]);
  const lowStockProducts = useMemo(() => activeProducts.filter((p) => p.stock <= p.critical_stock && p.stock > 0), [activeProducts]);
  const outOfStockProducts = useMemo(() => activeProducts.filter((p) => p.stock === 0), [activeProducts]);

  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.total || 0), 0), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === "delivered"), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => ["pending_payment", "paid", "preparing"].includes(o.status)), [orders]);

  const revenueData = useMemo(() => buildRevenueData(orders, dateRange), [orders, dateRange]);
  const statusData = useMemo(() => buildStatusData(orders), [orders]);
  const categoryData = useMemo(() => buildCategoryData(orders, products), [orders, products]);
  const revenueSparkline = useMemo(() => buildSparkline(orders, 7), [orders]);
  const orderSparkline = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (7 - i) * 24 * 60 * 60 * 1000;
      const dayEnd = now - (6 - i) * 24 * 60 * 60 * 1000;
      return orders.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= dayStart && t < dayEnd; }).length;
    });
  }, [orders]);

  // New KPIs: Conversion Rate & Avg Order Value
  const conversionRate = useMemo(() => {
    if (orders.length === 0) return 0;
    return (deliveredOrders.length / orders.length) * 100;
  }, [orders.length, deliveredOrders.length]);

  const avgOrderValue = useMemo(() => {
    if (orders.length === 0) return 0;
    return totalRevenue / orders.length;
  }, [totalRevenue, orders.length]);

  const conversionSparkline = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (7 - i) * 86400000;
      const dayEnd = now - (6 - i) * 86400000;
      const dayOrders = orders.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= dayStart && t < dayEnd; });
      const dayDelivered = dayOrders.filter((o) => o.status === "delivered").length;
      return dayOrders.length > 0 ? (dayDelivered / dayOrders.length) * 100 : 0;
    });
  }, [orders]);

  const aovSparkline = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (7 - i) * 86400000;
      const dayEnd = now - (6 - i) * 86400000;
      const dayOrders = orders.filter((o) => { const t = new Date(o.created_at).getTime(); return t >= dayStart && t < dayEnd; });
      if (dayOrders.length === 0) return 0;
      return dayOrders.reduce((s, o) => s + o.total, 0) / dayOrders.length;
    });
  }, [orders]);

  // Critical stock products for widget (top 5)
  const criticalStockProducts = useMemo(() => {
    return [...outOfStockProducts, ...lowStockProducts]
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }, [outOfStockProducts, lowStockProducts]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5),
    [orders]
  );

  // Today summary
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart);
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Dashboard</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Mağaza operasyon merkezi</p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          label="Toplam Ciro"
          value={formatPrice(totalRevenue)}
          change={deliveredOrders.length > 0 ? `${deliveredOrders.length} tamamlanan` : undefined}
          changeType="positive"
          icon={DollarSign}
          sparklineData={revenueSparkline}
          href="/admin/raporlar"
        />
        <StatsCard
          label="Siparişler"
          value={String(orders.length)}
          change={pendingOrders.length > 0 ? `${pendingOrders.length} bekleyen` : undefined}
          changeType={pendingOrders.length > 0 ? "negative" : "neutral"}
          icon={ShoppingBag}
          sparklineData={orderSparkline}
          href="/admin/siparisler"
        />
        <StatsCard
          label="Aktif Ürünler"
          value={String(activeProducts.length)}
          change={outOfStockProducts.length > 0 ? `${outOfStockProducts.length} tükenen` : `${lowStockProducts.length} düşük stok`}
          changeType={outOfStockProducts.length > 0 ? "negative" : lowStockProducts.length > 0 ? "negative" : "positive"}
          icon={Package}
          href="/admin/stok"
        />
        <StatsCard
          label="Müşteriler"
          value={String(customers.length)}
          change={customers.length > 0 ? "Kayıtlı üye" : undefined}
          changeType="positive"
          icon={Users}
          href="/admin/musteriler"
        />
        <StatsCard
          label="Dönüşüm Oranı"
          value={`%${conversionRate.toFixed(1)}`}
          change={orders.length > 0 ? `${orders.length} sipariş üzerinden` : undefined}
          changeType={conversionRate >= 50 ? "positive" : conversionRate > 0 ? "neutral" : "neutral"}
          icon={Percent}
          sparklineData={conversionSparkline}
          href="/admin/raporlar"
        />
        <StatsCard
          label="Ort. Sipariş Değeri"
          value={formatPrice(avgOrderValue)}
          change={orders.length > 0 ? "Sepet ortalaması" : undefined}
          changeType="neutral"
          icon={Receipt}
          sparklineData={aovSparkline}
          href="/admin/raporlar"
        />
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className={`${ADMIN_CARD} p-6`}>
          <RevenueChart data={revenueData} />
        </div>
        <div className={`${ADMIN_CARD} p-6`}>
          <OrdersStatusChart data={statusData} />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className={`${ADMIN_CARD} p-6 lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dark-900 dark:text-dark-50">Son Siparişler</h3>
            <Link href="/admin/siparisler" className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
              Tümünü gör <ArrowRight size={12} />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-100 dark:border-dark-700">
                    <th className="pb-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400">Sipariş No</th>
                    <th className="pb-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400">Tarih</th>
                    <th className="pb-2 text-left text-xs font-medium text-dark-500 dark:text-dark-400">Durum</th>
                    <th className="pb-2 text-right text-xs font-medium text-dark-500 dark:text-dark-400">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-dark-50 dark:border-dark-700/50">
                      <td className="py-2.5 font-medium text-dark-700 dark:text-dark-200">
                        #{order.order_no || order.id.slice(0, 8)}
                      </td>
                      <td className="py-2.5 text-dark-500 dark:text-dark-400">{timeAgo(order.created_at)}</td>
                      <td className="py-2.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 text-right font-semibold text-dark-900 dark:text-dark-50">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <ShoppingBag size={40} className="mb-3 text-dark-200 dark:text-dark-600" />
              <p className="text-sm text-dark-500 dark:text-dark-400">Henüz sipariş yok</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Today Summary */}
          <div className={`${ADMIN_CARD} p-5`}>
            <h3 className="mb-3 text-sm font-semibold text-dark-900 dark:text-dark-50">Bugünün Özeti</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-500 dark:text-dark-400">Sipariş</span>
                <span className="text-sm font-bold text-dark-900 dark:text-dark-50">{todayOrders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-500 dark:text-dark-400">Ciro</span>
                <span className="text-sm font-bold text-dark-900 dark:text-dark-50">{formatPrice(todayRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-500 dark:text-dark-400">Tükenen Ürün</span>
                <span className={`text-sm font-bold ${outOfStockProducts.length > 0 ? "text-red-600" : "text-green-600"}`}>
                  {outOfStockProducts.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-dark-500 dark:text-dark-400">Düşük Stok</span>
                <span className={`text-sm font-bold ${lowStockProducts.length > 0 ? "text-orange-600" : "text-green-600"}`}>
                  {lowStockProducts.length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${ADMIN_CARD} p-5`}>
            <h3 className="mb-3 text-sm font-semibold text-dark-900 dark:text-dark-50">Hızlı Aksiyonlar</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex flex-col items-center gap-1.5 rounded-lg p-3 text-center transition-opacity hover:opacity-80 ${action.color}`}
                >
                  <action.icon size={18} />
                  <span className="text-[10px] font-medium leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert Widget */}
          <div className={`${ADMIN_CARD} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-dark-900 dark:text-dark-50">Stok Uyarıları</h3>
              <Link href="/admin/stok" className="text-xs text-primary-600 hover:underline">Tümü</Link>
            </div>
            {criticalStockProducts.length > 0 ? (
              <div className="space-y-2">
                {criticalStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-dark-50 px-3 py-2 dark:bg-dark-700/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${p.stock === 0 ? "bg-red-500" : "bg-orange-500"}`} />
                      <span className="truncate text-xs text-dark-700 dark:text-dark-300">{p.name}</span>
                    </div>
                    <span className={`ml-2 shrink-0 text-xs font-bold ${p.stock === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {p.stock}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 py-3">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">Tüm stoklar yeterli seviyede</span>
              </div>
            )}
          </div>

          {/* Customer Growth Chart */}
          <div className={`${ADMIN_CARD} p-5`}>
            <CustomerGrowthChart customers={customers} />
          </div>

          {/* Category Pie */}
          <div className={`${ADMIN_CARD} p-5`}>
            <CategoryPieChart data={categoryData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Status badge mini component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    preparing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    refunded: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[status] || colors.refunded}`}>
      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
    </span>
  );
}
