"use client";

import { useState, useMemo } from "react";
import { RotateCcw, Eye, Check, X, CheckCircle2, Database } from "lucide-react";
import { useReturns } from "@/context/ReturnContext";
import { useActivityLog } from "@/context/ActivityLogContext";
import ReturnDetailModal from "@/components/admin/ReturnDetailModal";
import {
  ADMIN_CARD, ADMIN_TABLE_TH, ADMIN_TABLE_BODY_ROW, ADMIN_TABLE_HEADER_ROW,
  ADMIN_EMPTY_STATE, ADMIN_BADGE_GREEN, ADMIN_BADGE_RED, ADMIN_BADGE_ORANGE,
  ADMIN_BADGE_BLUE, ADMIN_BADGE_GRAY, ADMIN_BTN_SECONDARY,
  ADMIN_INPUT,
} from "@/lib/admin-classes";
import type { ReturnRequest, ReturnStatus } from "@/types";
import { RETURN_REASON_LABELS, RETURN_STATUS_LABELS } from "@/types";

// ==========================================
// HELPERS
// ==========================================

const STATUS_BADGE: Record<ReturnStatus, string> = {
  pending: ADMIN_BADGE_ORANGE,
  approved: ADMIN_BADGE_BLUE,
  rejected: ADMIN_BADGE_RED,
  completed: ADMIN_BADGE_GREEN,
};

type TabKey = "all" | ReturnStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Bekleyen" },
  { key: "approved", label: "Onaylanan" },
  { key: "rejected", label: "Reddedilen" },
  { key: "completed", label: "Tamamlanan" },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ==========================================
// COMPONENT
// ==========================================

export default function AdminReturnsPage() {
  const { returns, updateReturnStatus, seedDemoReturns } = useReturns();
  const { addLog } = useActivityLog();

  const [tab, setTab] = useState<TabKey>("all");
  const [detailReturn, setDetailReturn] = useState<ReturnRequest | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Counts
  const counts = useMemo(() => {
    const c = { all: 0, pending: 0, approved: 0, rejected: 0, completed: 0 };
    returns.forEach((r) => { c.all++; c[r.status]++; });
    return c;
  }, [returns]);

  // Filtered
  const filtered = useMemo(
    () => (tab === "all" ? returns : returns.filter((r) => r.status === tab)),
    [returns, tab]
  );

  // Actions
  function handleApprove(r: ReturnRequest) {
    const ok = updateReturnStatus(r.id, "approved");
    if (ok) addLog("return_request", `İade talebi ${r.returnNumber} onaylandı`, "return", r.id);
  }

  function handleRejectConfirm() {
    if (!rejectId) return;
    const r = returns.find((x) => x.id === rejectId);
    if (!r) return;
    const ok = updateReturnStatus(rejectId, "rejected", { rejectionReason: rejectReason || undefined });
    if (ok) addLog("return_request", `İade talebi ${r.returnNumber} reddedildi`, "return", r.id);
    setRejectId(null);
    setRejectReason("");
  }

  function handleComplete(r: ReturnRequest) {
    const ok = updateReturnStatus(r.id, "completed");
    if (ok) addLog("return_request", `İade talebi ${r.returnNumber} tamamlandı`, "return", r.id);
  }

  function handleSeedDemo() {
    seedDemoReturns();
    addLog("return_request", "Demo iade verileri oluşturuldu", "return");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">İade Talepleri</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">İade ve değişim yönetimi</p>
        </div>
        {returns.length === 0 && (
          <button onClick={handleSeedDemo} className={ADMIN_BTN_SECONDARY}>
            <Database size={16} /> Demo Veri Oluştur
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${ADMIN_CARD} flex flex-col items-center px-3 py-3 transition-shadow ${
              tab === t.key ? "ring-2 ring-primary-500" : ""
            }`}
          >
            <span className="text-2xl font-bold text-dark-900 dark:text-dark-50">{counts[t.key]}</span>
            <span className="text-xs text-dark-500 dark:text-dark-400">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className={ADMIN_EMPTY_STATE}>
          <RotateCcw size={48} className="mx-auto mb-4 text-dark-200 dark:text-dark-600" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">
            {tab === "all" ? "Henüz iade talebi yok" : `${TABS.find((t) => t.key === tab)?.label} iade talebi yok`}
          </h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            İade talepleri oluşturulduğunda burada görünecek.
          </p>
        </div>
      ) : (
        <div className={`${ADMIN_CARD} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={ADMIN_TABLE_HEADER_ROW}>
                <tr>
                  <th className={ADMIN_TABLE_TH}>Talep No</th>
                  <th className={ADMIN_TABLE_TH}>Sipariş No</th>
                  <th className={ADMIN_TABLE_TH + " hidden sm:table-cell"}>Müşteri</th>
                  <th className={ADMIN_TABLE_TH + " hidden md:table-cell"}>Tarih</th>
                  <th className={ADMIN_TABLE_TH + " hidden lg:table-cell"}>Ürünler</th>
                  <th className={ADMIN_TABLE_TH + " hidden md:table-cell"}>Sebep</th>
                  <th className={ADMIN_TABLE_TH}>Durum</th>
                  <th className={ADMIN_TABLE_TH + " text-right"}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={ADMIN_TABLE_BODY_ROW}>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-dark-900 dark:text-dark-100">
                      {r.returnNumber}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-dark-700 dark:text-dark-300">
                      {r.orderNumber}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-dark-700 dark:text-dark-300 sm:table-cell">
                      {r.customerName}
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-dark-500 dark:text-dark-400 md:table-cell">
                      {fmtDate(r.requestedAt)}
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="max-w-[200px]">
                        {r.items.map((item, i) => (
                          <p key={i} className="truncate text-xs text-dark-600 dark:text-dark-400">
                            {item.qty}x {item.productName}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-dark-600 dark:text-dark-400 md:table-cell">
                      {RETURN_REASON_LABELS[r.reason]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[r.status] || ADMIN_BADGE_GRAY}>
                        {RETURN_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail */}
                        <button
                          onClick={() => setDetailReturn(r)}
                          className="rounded-lg p-1.5 text-dark-400 hover:bg-dark-100 dark:hover:bg-dark-700"
                          title="Detay"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Approve — only pending */}
                        {r.status === "pending" && (
                          <button
                            onClick={() => handleApprove(r)}
                            className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Onayla"
                          >
                            <Check size={16} />
                          </button>
                        )}

                        {/* Reject — only pending */}
                        {r.status === "pending" && (
                          <button
                            onClick={() => { setRejectId(r.id); setRejectReason(""); }}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Reddet"
                          >
                            <X size={16} />
                          </button>
                        )}

                        {/* Complete — only approved */}
                        {r.status === "approved" && (
                          <button
                            onClick={() => handleComplete(r)}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Tamamla"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailReturn && (
        <ReturnDetailModal returnReq={detailReturn} onClose={() => setDetailReturn(null)} />
      )}

      {/* Reject Reason Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectId(null)}>
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-dark-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">İade Talebini Reddet</h3>
            <label className="mb-1 block text-xs text-dark-500 dark:text-dark-400">Red Nedeni (opsiyonel)</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Örn: 14 günlük iade süresi dolmuş"
              className={ADMIN_INPUT}
            />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setRejectId(null)} className={ADMIN_BTN_SECONDARY + " flex-1"}>
                İptal
              </button>
              <button
                onClick={handleRejectConfirm}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
