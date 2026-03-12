"use client";

import { useState } from "react";
import {
  Activity,
  ShoppingBag,
  Truck,
  Trash2,
  Edit,
  Plus,
  CheckCircle,
  XCircle,
  BarChart3,
  Warehouse,
  RotateCcw,
} from "lucide-react";
import { useActivityLog } from "@/context/ActivityLogContext";
import { timeAgo } from "@/lib/utils";
import { ADMIN_CARD, ADMIN_EMPTY_STATE } from "@/lib/admin-classes";
import type { ActivityLogType } from "@/types/admin";

type FilterType = "all" | ActivityLogType;

const LOG_ICONS: Record<ActivityLogType, typeof Activity> = {
  order_status: ShoppingBag,
  product_create: Plus,
  product_update: Edit,
  product_delete: Trash2,
  review_approve: CheckCircle,
  review_reject: XCircle,
  bulk_order_update: BarChart3,
  tracking_added: Truck,
  stock_update: Warehouse,
  return_request: RotateCcw,
};

const LOG_COLORS: Record<ActivityLogType, string> = {
  order_status: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  product_create: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  product_update: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  product_delete: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  review_approve: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  review_reject: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  bulk_order_update: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  tracking_added: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  stock_update: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  return_request: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
};

const LOG_LABELS: Record<ActivityLogType, string> = {
  order_status: "Sipariş Durumu",
  product_create: "Ürün Ekleme",
  product_update: "Ürün Güncelleme",
  product_delete: "Ürün Silme",
  review_approve: "Yorum Onay",
  review_reject: "Yorum Red",
  bulk_order_update: "Toplu Güncelleme",
  tracking_added: "Kargo Takip",
  stock_update: "Stok Güncelleme",
  return_request: "İade Talebi",
};

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "order_status", label: "Siparişler" },
  { key: "product_create", label: "Ürün Ekleme" },
  { key: "product_update", label: "Ürün Güncelleme" },
  { key: "review_approve", label: "Yorumlar" },
  { key: "stock_update", label: "Stok" },
  { key: "tracking_added", label: "Kargo" },
  { key: "return_request", label: "İadeler" },
];

export default function AdminActivityPage() {
  const { logs, clearLogs } = useActivityLog();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredLogs = filter === "all"
    ? logs
    : logs.filter((l) => {
        if (filter === "review_approve") return l.type === "review_approve" || l.type === "review_reject";
        return l.type === filter;
      });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Aktivite Geçmişi</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">
            Admin işlem kayıtları ({logs.length} kayıt)
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => { if (confirm("Tüm aktivite geçmişini temizlemek istediğinize emin misiniz?")) clearLogs(); }}
            className="rounded-lg border border-dark-200 px-3 py-2 text-xs text-dark-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-dark-600 dark:text-dark-400 dark:hover:border-red-800 dark:hover:text-red-400"
          >
            Geçmişi Temizle
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === opt.key
                ? "bg-primary-600 text-white"
                : "bg-dark-100 text-dark-600 hover:bg-dark-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredLogs.length === 0 ? (
        <div className={ADMIN_EMPTY_STATE}>
          <Activity size={48} className="mx-auto mb-3 text-dark-200 dark:text-dark-600" />
          <p className="text-dark-500 dark:text-dark-400">
            {filter === "all" ? "Henüz aktivite kaydı yok" : "Bu kategoride kayıt bulunamadı"}
          </p>
          <p className="mt-1 text-xs text-dark-400">
            Admin işlemleri otomatik olarak burada kaydedilir
          </p>
        </div>
      ) : (
        <div className={`${ADMIN_CARD} divide-y divide-dark-50 dark:divide-dark-700`}>
          {filteredLogs.map((log) => {
            const LogIcon = LOG_ICONS[log.type] || Activity;
            const colorClass = LOG_COLORS[log.type] || "bg-dark-100 text-dark-600";
            const label = LOG_LABELS[log.type] || log.type;

            return (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                  <LogIcon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-dark-800 dark:text-dark-200">{log.message}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="rounded bg-dark-100 px-1.5 py-0.5 text-[10px] font-medium text-dark-500 dark:bg-dark-700 dark:text-dark-400">
                      {label}
                    </span>
                    <span className="text-xs text-dark-400">{timeAgo(log.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
