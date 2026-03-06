"use client";

import { Fragment, useState, useMemo } from "react";
import { ShoppingBag, Eye, ChevronDown, MapPin, Package, Phone, Search } from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["paid", "cancelled"],
  paid: ["preparing", "refunded"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export default function AdminOrdersPage() {
  const { getAllOrders, updateOrderStatus } = useOrders();
  const orders = getAllOrders();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const addr = o.shipping_address;
      const customerName = `${addr.ad} ${addr.soyad}`.toLowerCase();
      return (
        o.order_no?.toLowerCase().includes(q) ||
        customerName.includes(q) ||
        addr.telefon?.includes(q)
      );
    });
  }, [orders, search]);

  if (orders.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Siparişler</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Sipariş yönetimi</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <ShoppingBag size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Henüz Sipariş Yok</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Müşteriler sipariş verdiğinde burada görüntülenecek.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Siparişler</h1>
        <p className="text-sm text-dark-500 dark:text-dark-400">{orders.length} sipariş</p>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 px-4 py-2">
        <Search size={16} className="text-dark-400" />
        <input
          type="text"
          placeholder="Sipariş kodu, müşteri adı veya telefon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-dark-400"
        />
      </div>

      <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-100 bg-dark-50 text-left">
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Sipariş No</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Tarih</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Müşteri</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Toplam</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Durum</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const transitions = ALLOWED_TRANSITIONS[order.status] || [];
                const isExpanded = expandedId === order.id;

                const addr = order.shipping_address;
                return (
                  <Fragment key={order.id}>
                  <tr className="border-b border-dark-50 last:border-0">
                    <td className="px-4 py-3 font-mono font-medium text-dark-900 dark:text-dark-50">{order.order_no}</td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-400">
                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-200">
                      {addr.ad} {addr.soyad}
                      {!order.user_id && <span className="ml-1 text-xs text-dark-400">(Misafir)</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-50">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className={`rounded p-1 transition-colors ${isExpanded ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600" : "text-dark-400 hover:bg-dark-50 hover:text-dark-600 dark:text-dark-300"}`}
                          title="Detay"
                        >
                          <Eye size={16} />
                        </button>
                        {transitions.length > 0 && (
                          <div className="relative">
                            <select
                              className="appearance-none rounded border border-dark-200 bg-white dark:bg-dark-800 dark:border-dark-600 dark:bg-dark-800 px-2 py-1 pr-6 text-xs text-dark-700 dark:text-dark-200 focus:outline-none"
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateOrderStatus(order.id, e.target.value as OrderStatus);
                                }
                              }}
                            >
                              <option value="">Durum Değiştir</option>
                              {transitions.map((s) => (
                                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-dark-400" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                    {isExpanded && (
                    <tr>
                      <td colSpan={6} className="border-b border-dark-100 bg-dark-50 px-6 py-4">
                        <div className="grid gap-6 md:grid-cols-3">
                          {/* Teslimat Adresi */}
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                              <MapPin size={13} /> Teslimat Adresi
                            </h4>
                            <div className="rounded-lg bg-white dark:bg-dark-800 p-3 text-sm">
                              <p className="font-medium text-dark-900 dark:text-dark-50">{addr.ad} {addr.soyad}</p>
                              <p className="mt-1 text-dark-600 dark:text-dark-300">{addr.adres}</p>
                              <p className="text-dark-600 dark:text-dark-300">{addr.ilce} / {addr.il}{addr.posta_kodu ? ` - ${addr.posta_kodu}` : ""}</p>
                              {addr.telefon && (
                                <p className="mt-1 flex items-center gap-1 text-dark-500 dark:text-dark-400">
                                  <Phone size={12} />
                                  {addr.telefon.replace(/(\d{2})(\d{3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Ürünler */}
                          <div>
                            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                              <Package size={13} /> Ürünler ({order.items?.length || 0})
                            </h4>
                            <div className="space-y-2">
                              {order.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between rounded-lg bg-white dark:bg-dark-800 p-3 text-sm">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-dark-900 dark:text-dark-50">{item.name_snapshot || item.product_id}</p>
                                    <p className="text-xs text-dark-500 dark:text-dark-400">x{item.qty}</p>
                                  </div>
                                  <span className="shrink-0 font-medium text-dark-900 dark:text-dark-50">{formatPrice((item.sale_price_snapshot ?? item.price_snapshot) * item.qty)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Fiyat Özeti */}
                          <div>
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                              Fiyat Özeti
                            </h4>
                            <div className="space-y-1.5 rounded-lg bg-white dark:bg-dark-800 p-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-dark-500 dark:text-dark-400">Ara Toplam</span>
                                <span className="text-dark-900 dark:text-dark-50">{formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-dark-500 dark:text-dark-400">Kargo</span>
                                <span className="text-dark-900 dark:text-dark-50">{order.shipping === 0 ? "Ücretsiz" : formatPrice(order.shipping)}</span>
                              </div>
                              {order.discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-green-600">İndirim</span>
                                  <span className="text-green-600">-{formatPrice(order.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-dark-100 pt-1.5 font-bold">
                                <span className="text-dark-900 dark:text-dark-50">Toplam</span>
                                <span className="text-dark-900 dark:text-dark-50">{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-dark-400">
                    Aramayla eşleşen sipariş bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
