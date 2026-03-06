"use client";

import { RotateCcw } from "lucide-react";
import { useOrders } from "@/context/OrderContext";

/**
 * İade Talepleri — Demo
 * Sipariş durumu "refunded" olan siparişler burada listelenir.
 * Sprint 3'te iade talep akışı (müşteriden gelen) eklenecek.
 */
export default function AdminReturnsPage() {
  const { orders } = useOrders();
  const refunded = orders.filter((o) => o.status === "refunded");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">İade Talepleri</h1>
        <p className="text-sm text-dark-500 dark:text-dark-400">İade ve değişim yönetimi</p>
      </div>

      {refunded.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <RotateCcw size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Talebi Yok</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Siparişler sayfasından durumu &quot;İade Edildi&quot; olarak değiştirilen siparişler burada görünür.
          </p>
          <p className="mt-1 text-xs text-dark-400">
            Sprint 3&apos;te müşteri tarafından iade talep akışı eklenecek.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-dark-100 bg-dark-50 dark:bg-dark-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Sipariş No</th>
                  <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Tarih</th>
                  <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Tutar</th>
                  <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-50">
                {refunded.map((order) => (
                  <tr key={order.id} className="hover:bg-dark-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-dark-900 dark:text-dark-50">{order.order_no}</td>
                    <td className="px-4 py-3 text-dark-500 dark:text-dark-400">
                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-4 py-3 text-dark-700 dark:text-dark-200">{order.total.toLocaleString("tr-TR")}₺</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-700">
                        İade Edildi
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
