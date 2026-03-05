"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Package, Users, TrendingUp, Eye } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { useProducts } from "@/context/ProductContext";
import { formatPrice } from "@/lib/utils";
import { safeGetJSON } from "@/lib/safe-storage";

interface OrderData {
  id: string;
  total: number;
  status: string;
  created_at: string;
  order_no?: string;
}

interface UserData {
  user_id: string;
  email?: string;
  ad?: string;
  soyad?: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const { products } = useProducts();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [customers, setCustomers] = useState<UserData[]>([]);

  useEffect(() => {
    const storedOrders = safeGetJSON<OrderData[]>("fiyatcim_orders", []);
    if (Array.isArray(storedOrders)) setOrders(storedOrders);

    const storedUsers = safeGetJSON<UserData[]>("fiyatcim_registered_users", []);
    if (Array.isArray(storedUsers)) setCustomers(storedUsers);
  }, []);

  const activeProducts = products.filter((p) => p.is_active && !p.deleted_at);
  const lowStockProducts = activeProducts.filter((p) => p.stock <= p.critical_stock && p.stock > 0);
  const outOfStockProducts = activeProducts.filter((p) => p.stock === 0);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const pendingOrders = orders.filter((o) => o.status === "pending_payment" || o.status === "paid" || o.status === "preparing");

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentCustomers = [...customers]
    .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900">Dashboard</h1>
        <p className="text-sm text-dark-500">Mağaza genel durumu</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Toplam Satış"
          value={formatPrice(totalRevenue)}
          change={deliveredOrders.length > 0 ? `${deliveredOrders.length} tamamlanan` : "Henüz satış yok"}
          changeType={deliveredOrders.length > 0 ? "positive" : "neutral"}
          icon={DollarSign}
        />
        <StatsCard
          label="Siparişler"
          value={String(orders.length)}
          change={pendingOrders.length > 0 ? `${pendingOrders.length} bekleyen` : "Sipariş yok"}
          changeType={pendingOrders.length > 0 ? "negative" : "neutral"}
          icon={ShoppingBag}
        />
        <StatsCard
          label="Aktif Ürünler"
          value={String(activeProducts.length)}
          change={`${lowStockProducts.length} düşük stok`}
          changeType={lowStockProducts.length > 0 ? "negative" : "positive"}
          icon={Package}
        />
        <StatsCard
          label="Müşteriler"
          value={String(customers.length)}
          change={customers.length > 0 ? "Kayıtlı üye" : "Henüz üye yok"}
          changeType={customers.length > 0 ? "positive" : "neutral"}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dark-900">Son Siparişler</h3>
            <TrendingUp size={18} className="text-dark-400" />
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg bg-dark-50 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-dark-700">#{order.order_no || order.id.slice(0, 8)}</span>
                    <p className="text-xs text-dark-400">{new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <span className="text-sm font-bold text-dark-900">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ShoppingBag size={40} className="mb-3 text-dark-200" />
              <p className="text-sm text-dark-500">Henüz sipariş yok</p>
              <p className="text-xs text-dark-400">Siparişler burada listelenecek</p>
            </div>
          )}
        </div>

        {/* Low stock warning */}
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dark-900">Stok Uyarıları</h3>
            <Eye size={18} className="text-dark-400" />
          </div>
          {lowStockProducts.length > 0 || outOfStockProducts.length > 0 ? (
            <div className="space-y-3">
              {outOfStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <span className="text-sm text-dark-700 truncate">{p.name}</span>
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Tükendi</span>
                </div>
              ))}
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2">
                  <span className="text-sm text-dark-700 truncate">{p.name}</span>
                  <span className="shrink-0 rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {p.stock} adet
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Package size={40} className="mb-3 text-dark-200" />
              <p className="text-sm text-green-600">Tüm stoklar yeterli</p>
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-dark-900">Son Kayıtlar</h3>
            <Users size={18} className="text-dark-400" />
          </div>
          {recentCustomers.length > 0 ? (
            <div className="space-y-3">
              {recentCustomers.map((c) => (
                <div key={c.user_id} className="flex items-center justify-between rounded-lg bg-dark-50 px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-dark-700">{c.ad} {c.soyad}</span>
                    <p className="text-xs text-dark-400">{c.email}</p>
                  </div>
                  <span className="text-xs text-dark-400">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("tr-TR") : "-"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Users size={40} className="mb-3 text-dark-200" />
              <p className="text-sm text-dark-500">Henüz kayıtlı üye yok</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl border border-dark-100 bg-white p-6">
          <h3 className="mb-4 font-bold text-dark-900">Hızlı İstatistikler</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-600">Toplam Ürün</span>
              <span className="font-bold text-dark-900">{activeProducts.length}</span>
            </div>
            <div className="h-px bg-dark-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-600">Tükenen Ürünler</span>
              <span className="font-bold text-red-600">{outOfStockProducts.length}</span>
            </div>
            <div className="h-px bg-dark-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-600">Düşük Stok</span>
              <span className="font-bold text-orange-600">{lowStockProducts.length}</span>
            </div>
            <div className="h-px bg-dark-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-600">Kayıtlı Müşteriler</span>
              <span className="font-bold text-dark-900">{customers.length}</span>
            </div>
            <div className="h-px bg-dark-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-600">Toplam Sipariş</span>
              <span className="font-bold text-dark-900">{orders.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
