"use client";

import { X } from "lucide-react";
import type { ReturnRequest } from "@/types";
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from "@/types";
import { ADMIN_BADGE_GREEN, ADMIN_BADGE_RED, ADMIN_BADGE_ORANGE, ADMIN_BADGE_BLUE, ADMIN_BADGE_GRAY } from "@/lib/admin-classes";

const STATUS_BADGE: Record<string, string> = {
  pending: ADMIN_BADGE_ORANGE,
  approved: ADMIN_BADGE_BLUE,
  rejected: ADMIN_BADGE_RED,
  completed: ADMIN_BADGE_GREEN,
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtPrice(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

interface Props {
  returnReq: ReturnRequest;
  onClose: () => void;
}

export default function ReturnDetailModal({ returnReq: r, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-dark-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4 dark:border-dark-700">
          <div>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Detayı</h2>
            <p className="text-xs text-dark-500 dark:text-dark-400">{r.returnNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Status + Dates */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Durum</span>
              <div className="mt-1">
                <span className={STATUS_BADGE[r.status] || ADMIN_BADGE_GRAY}>
                  {RETURN_STATUS_LABELS[r.status]}
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Talep Tarihi</span>
              <p className="mt-1 font-medium text-dark-900 dark:text-dark-100">{fmtDate(r.requestedAt)}</p>
            </div>
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Sipariş No</span>
              <p className="mt-1 font-mono font-medium text-dark-900 dark:text-dark-100">{r.orderNumber}</p>
            </div>
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Müşteri</span>
              <p className="mt-1 font-medium text-dark-900 dark:text-dark-100">{r.customerName}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <span className="text-xs text-dark-500 dark:text-dark-400">İade Sebebi</span>
            <p className="mt-1 text-sm font-medium text-dark-900 dark:text-dark-100">
              {RETURN_REASON_LABELS[r.reason]}
            </p>
            {r.description && (
              <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">{r.description}</p>
            )}
          </div>

          {/* Items */}
          <div>
            <span className="text-xs text-dark-500 dark:text-dark-400">Ürünler</span>
            <div className="mt-2 space-y-2">
              {r.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-dark-50 px-3 py-2 dark:bg-dark-700">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dark-900 dark:text-dark-100">{item.productName}</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">{item.qty} adet</p>
                  </div>
                  <span className="ml-3 whitespace-nowrap text-sm font-semibold text-dark-900 dark:text-dark-100">
                    {fmtPrice(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Amount */}
          {r.refundAmount != null && (
            <div className="flex items-center justify-between rounded-lg bg-primary-50 px-4 py-3 dark:bg-primary-900/20">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">İade Tutarı</span>
              <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{fmtPrice(r.refundAmount)}</span>
            </div>
          )}

          {/* Timeline */}
          <div>
            <span className="text-xs text-dark-500 dark:text-dark-400">Durum Geçmişi</span>
            <div className="mt-2 space-y-1.5 text-xs">
              <TimelineRow label="Talep oluşturuldu" date={r.requestedAt} />
              {r.approvedAt && <TimelineRow label="Onaylandı" date={r.approvedAt} color="text-blue-600 dark:text-blue-400" />}
              {r.rejectedAt && <TimelineRow label="Reddedildi" date={r.rejectedAt} color="text-red-600 dark:text-red-400" />}
              {r.completedAt && <TimelineRow label="Tamamlandı" date={r.completedAt} color="text-green-600 dark:text-green-400" />}
            </div>
          </div>

          {/* Rejection Reason */}
          {r.rejectionReason && (
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Red Nedeni</span>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{r.rejectionReason}</p>
            </div>
          )}

          {/* Notes */}
          {r.notes && (
            <div>
              <span className="text-xs text-dark-500 dark:text-dark-400">Notlar</span>
              <p className="mt-1 text-sm text-dark-700 dark:text-dark-300">{r.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-dark-100 px-6 py-4 dark:border-dark-700">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, date, color }: { label: string; date: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={color || "text-dark-600 dark:text-dark-400"}>{label}</span>
      <span className="text-dark-400 dark:text-dark-500">{fmtDate(date)}</span>
    </div>
  );
}
