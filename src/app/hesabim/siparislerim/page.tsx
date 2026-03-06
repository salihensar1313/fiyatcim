"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import type { OrderStatus } from "@/types";
import InvoicePDF from "@/components/order/InvoicePDF";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { getOrdersByUser } = useOrders();

  const orders = user ? getOrdersByUser(user.id) : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">Siparişlerim</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <Package size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Henüz Siparişiniz Yok</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Sipariş oluşturduğunuzda burada görüntülenecektir.
          </p>
          <Link
            href="/urunler"
            className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Alışverişe Başla
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-dark-900 dark:text-dark-50">{order.order_no}</p>
                  <p className="text-xs text-dark-500 dark:text-dark-400">
                    {new Date(order.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <InvoicePDF order={order} />
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-bold text-dark-900 dark:text-dark-50">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mt-3 border-t border-dark-100 pt-3">
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-dark-600 dark:text-dark-300">
                          {item.name_snapshot} <span className="text-dark-400">x{item.qty}</span>
                        </span>
                        <span className="text-dark-900 dark:text-dark-50">
                          {formatPrice((item.sale_price_snapshot || item.price_snapshot) * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
