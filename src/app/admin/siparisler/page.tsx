"use client";

import { Fragment, useState, useMemo } from "react";
import {
  ShoppingBag, Eye, ChevronDown, MapPin, Package, Phone, Search,
  CheckSquare, Square, Download, Truck, FileText, Printer,
} from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import { useActivityLog } from "@/context/ActivityLogContext";
import { useToast } from "@/components/ui/Toast";
import { formatPrice, timeAgo, downloadCsv } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types";
import { ADMIN_CARD, ADMIN_INPUT, ADMIN_SELECT } from "@/lib/admin-classes";
import type { OrderStatus, Order } from "@/types";
import { logger } from "@/lib/logger";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  preparing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400",
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

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled", "refunded"];
const BULK_TARGET_STATUSES: OrderStatus[] = ["paid", "preparing", "shipped", "delivered", "cancelled"];

// Kargo firmaları
const SHIPPING_PROVIDERS = ["Yurtiçi Kargo", "Aras Kargo", "MNG Kargo", "PTT Kargo", "Sürat Kargo", "Diğer"];

const EMAIL_STATUS_MAP: Partial<Record<OrderStatus, string>> = {
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
  refunded: "order_refunded",
};

function sendOrderStatusEmail(order: Order, newStatus: OrderStatus) {
  const emailType = EMAIL_STATUS_MAP[newStatus];
  if (!emailType || !order.customer_email) return;

  const addr = order.shipping_address;
  const customerName = `${addr.ad} ${addr.soyad}`.trim() || "Müşteri";

  fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: emailType,
      to: order.customer_email,
      data: {
        orderNo: order.order_no,
        customerName,
        trackingCode: order.tracking_no || undefined,
      },
    }),
  }).catch((err) => logger.warn("order_status_email_failed", { fn: "sendOrderStatusEmail", error: err instanceof Error ? err.message : String(err) }));
}

export default function AdminOrdersPage() {
  const { getAllOrders, updateOrderStatus } = useOrders();
  const { addLog } = useActivityLog();
  const { showToast } = useToast();
  const orders = getAllOrders();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  // Tracking state per order
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { no: string; provider: string }>>({});

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

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  };

  // Bulk status update
  const handleBulkUpdate = () => {
    if (!bulkStatus) return;
    const target = bulkStatus as OrderStatus;
    let updated = 0;
    let skipped = 0;

    selectedIds.forEach((id) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;

      // Terminal durumlardan geri dönüş engeli
      if (TERMINAL_STATUSES.includes(order.status)) {
        skipped++;
        return;
      }

      const transitions = ALLOWED_TRANSITIONS[order.status];
      if (!transitions.includes(target)) {
        skipped++;
        return;
      }

      updateOrderStatus(id, target);
      sendOrderStatusEmail(order, target);
      updated++;
    });

    addLog("bulk_order_update", `${updated} sipariş "${ORDER_STATUS_LABELS[target]}" durumuna güncellendi${skipped > 0 ? `, ${skipped} sipariş atlandı` : ""}`, "order");

    if (updated > 0 && skipped > 0) {
      showToast(`${updated} sipariş güncellendi, ${skipped} sipariş atlandı (terminal durum)`, "success");
    } else if (updated > 0) {
      showToast(`${updated} sipariş güncellendi`, "success");
    } else {
      showToast("Hiçbir sipariş güncellenemedi", "error");
    }

    setSelectedIds(new Set());
    setBulkStatus("");
  };

  // Single status change with log + email
  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    updateOrderStatus(orderId, newStatus);
    addLog("order_status", `Sipariş #${order?.order_no || orderId.slice(0, 8)} durumu "${ORDER_STATUS_LABELS[newStatus]}" olarak güncellendi`, "order", orderId);
    if (order) {
      sendOrderStatusEmail(order, newStatus);
    }
  };

  // Export selected
  const handleExportSelected = () => {
    const selected = orders.filter((o) => selectedIds.has(o.id));
    if (selected.length === 0) return;

    const headers = ["Sipariş No", "Tarih", "Müşteri", "Toplam", "Durum", "Kargo Firma", "Takip No"];
    const rows = selected.map((o) => [
      o.order_no,
      new Date(o.created_at).toLocaleDateString("tr-TR"),
      `${o.shipping_address.ad} ${o.shipping_address.soyad}`,
      o.total,
      ORDER_STATUS_LABELS[o.status],
      o.shipping_company,
      o.tracking_no,
    ]);
    downloadCsv(`fiyatcim-siparisler-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  // Tracking save
  const handleTrackingSave = (order: Order) => {
    const input = trackingInputs[order.id];
    if (!input?.no?.trim()) return;

    // Update order tracking via updateOrderStatus hack — we need to modify tracking fields
    // Since OrderContext doesn't have dedicated tracking update, we store in localStorage directly
    const stored = JSON.parse(localStorage.getItem("fiyatcim_orders") || "[]");
    const idx = stored.findIndex((o: Order) => o.id === order.id);
    if (idx >= 0) {
      stored[idx].tracking_no = input.no.trim();
      stored[idx].shipping_company = input.provider || null;
      localStorage.setItem("fiyatcim_orders", JSON.stringify(stored));
    }

    addLog("tracking_added", `Sipariş #${order.order_no} kargo takip no eklendi: ${input.no.trim()}`, "order", order.id);
    showToast("Kargo takip bilgisi kaydedildi", "success");

    setTrackingInputs((prev) => {
      const next = { ...prev };
      delete next[order.id];
      return next;
    });
  };

  // Export all filtered orders to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Sipariş No", "Müşteri", "E-posta", "Tarih", "Durum", "Toplam"];
    const rows = filtered.map((o) => [
      o.order_no,
      `${o.shipping_address.ad} ${o.shipping_address.soyad}`,
      o.customer_email || "",
      new Date(o.created_at).toLocaleDateString("tr-TR"),
      ORDER_STATUS_LABELS[o.status],
      o.total,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`siparisler-${today}.csv`, headers, rows);
  };

  // Invoice print
  const handlePrintInvoice = (order: Order) => {
    const addr = order.shipping_address;
    const invoiceNo = `FTR-${order.order_no}`;
    const invoiceHtml = `
      <!DOCTYPE html>
      <html><head><title>Fatura - ${invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #DC2626; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { color: #DC2626; margin: 0; font-size: 24px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-box { background: #f8f8f8; padding: 12px; border-radius: 8px; }
        .info-box h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #888; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f0f0f0; text-align: left; padding: 8px; font-size: 12px; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 13px; }
        .totals { text-align: right; }
        .totals p { margin: 4px 0; font-size: 13px; }
        .totals .grand { font-size: 18px; font-weight: bold; color: #DC2626; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <div class="header">
          <div><h1>Fiyatcim.com</h1><p style="margin:4px 0 0;color:#888;font-size:12px;">Fatura</p></div>
          <div style="text-align:right"><p style="margin:0;font-weight:bold;">${invoiceNo}</p><p style="margin:4px 0 0;font-size:12px;color:#888;">${new Date(order.created_at).toLocaleDateString("tr-TR")}</p></div>
        </div>
        <div class="info-grid">
          <div class="info-box"><h3>Müşteri Bilgileri</h3><p style="margin:0;font-weight:bold;">${addr.ad} ${addr.soyad}</p><p style="margin:2px 0;font-size:12px;">${addr.adres}</p><p style="margin:2px 0;font-size:12px;">${addr.ilce}/${addr.il}</p>${addr.telefon ? `<p style="margin:2px 0;font-size:12px;">${addr.telefon}</p>` : ""}</div>
          <div class="info-box"><h3>Sipariş Bilgileri</h3><p style="margin:0;"><strong>Sipariş No:</strong> ${order.order_no}</p><p style="margin:2px 0;font-size:12px;"><strong>Durum:</strong> ${ORDER_STATUS_LABELS[order.status]}</p>${order.tracking_no ? `<p style="margin:2px 0;font-size:12px;"><strong>Kargo Takip:</strong> ${order.tracking_no}</p>` : ""}</div>
        </div>
        <table><thead><tr><th>Ürün</th><th>Adet</th><th>Birim Fiyat</th><th style="text-align:right">Toplam</th></tr></thead><tbody>
        ${(order.items || []).map((item) => `<tr><td>${item.name_snapshot}</td><td>${item.qty}</td><td>${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(item.sale_price_snapshot || item.price_snapshot)}</td><td style="text-align:right">${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format((item.sale_price_snapshot || item.price_snapshot) * item.qty)}</td></tr>`).join("")}
        </tbody></table>
        <div class="totals">
          <p>Ara Toplam: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(order.subtotal)}</p>
          ${order.discount > 0 ? `<p style="color:#22c55e">İndirim: -${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(order.discount)}</p>` : ""}
          <p>Kargo: ${order.shipping === 0 ? "Ücretsiz" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(order.shipping)}</p>
          <p class="grand">Toplam: ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(order.total)}</p>
        </div>
        <div class="footer"><p>Fiyatcim.com &copy; ${new Date().getFullYear()} | Bu belge bilgi amaçlıdır.</p></div>
      </body></html>
    `;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(invoiceHtml);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  };

  if (orders.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Siparişler</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Sipariş yönetimi</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 py-20">
          <ShoppingBag size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Henüz Sipariş Yok</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Müşteriler sipariş verdiğinde burada görüntülenecek.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = selectedIds.size === filtered.length && filtered.length > 0;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Siparişler</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">{orders.length} sipariş</p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-lg border border-dark-200 bg-white px-4 py-2 text-sm font-medium text-dark-700 transition-colors hover:bg-dark-50 disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200 dark:hover:bg-dark-600"
        >
          <Download size={16} />
          CSV İndir
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 px-4 py-2">
        <Search size={16} className="text-dark-400" />
        <input
          type="text"
          placeholder="Sipariş kodu, müşteri adı veya telefon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-dark-400 dark:text-dark-100"
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            {selectedIds.size} sipariş seçili
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className={`${ADMIN_SELECT} text-xs`}
            >
              <option value="">Durum Seç</option>
              {BULK_TARGET_STATUSES.map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus}
              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              Uygula
            </button>
          </div>
          <button
            onClick={handleExportSelected}
            className="flex items-center gap-1 rounded-lg border border-dark-200 bg-white px-3 py-1.5 text-xs font-medium text-dark-600 transition-colors hover:bg-dark-50 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-300"
          >
            <Download size={12} /> CSV Export
          </button>
        </div>
      )}

      <div className={ADMIN_CARD}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-100 bg-dark-50 text-left dark:border-dark-700 dark:bg-dark-800/50">
                <th className="px-3 py-3">
                  <button onClick={toggleSelectAll} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                    {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
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
                const isSelected = selectedIds.has(order.id);
                const addr = order.shipping_address;
                const trackInput = trackingInputs[order.id] || { no: order.tracking_no || "", provider: order.shipping_company || "" };

                return (
                  <Fragment key={order.id}>
                    <tr className={`border-b border-dark-50 last:border-0 dark:border-dark-700 ${isSelected ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}`}>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleSelect(order.id)} className="text-dark-400 hover:text-dark-600 dark:hover:text-dark-200">
                          {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-dark-900 dark:text-dark-50">{order.order_no}</td>
                      <td className="px-4 py-3 text-dark-500 dark:text-dark-400">{timeAgo(order.created_at)}</td>
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
                            className={`rounded p-1 transition-colors ${isExpanded ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30" : "text-dark-400 hover:bg-dark-50 hover:text-dark-600 dark:hover:bg-dark-700"}`}
                            title="Detay"
                          >
                            <Eye size={16} />
                          </button>
                          {transitions.length > 0 && (
                            <div className="relative">
                              <select
                                className={`${ADMIN_SELECT} appearance-none pr-6 text-xs`}
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) handleStatusChange(order.id, e.target.value as OrderStatus);
                                }}
                              >
                                <option value="">Durum</option>
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
                        <td colSpan={7} className="border-b border-dark-100 bg-dark-50 px-6 py-4 dark:border-dark-700 dark:bg-dark-800/50">
                          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {/* Teslimat Adresi */}
                            <div>
                              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                                <MapPin size={13} /> Teslimat Adresi
                              </h4>
                              <div className="rounded-lg bg-white p-3 text-sm dark:bg-dark-700">
                                <p className="font-medium text-dark-900 dark:text-dark-50">{addr.ad} {addr.soyad}</p>
                                <p className="mt-1 text-dark-600 dark:text-dark-300">{addr.adres}</p>
                                <p className="text-dark-600 dark:text-dark-300">{addr.ilce} / {addr.il}</p>
                                {addr.telefon && (
                                  <p className="mt-1 flex items-center gap-1 text-dark-500 dark:text-dark-400">
                                    <Phone size={12} /> {addr.telefon}
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
                                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white p-3 text-sm dark:bg-dark-700">
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-medium text-dark-900 dark:text-dark-50">{item.name_snapshot}</p>
                                      <p className="text-xs text-dark-500 dark:text-dark-400">x{item.qty}</p>
                                    </div>
                                    <span className="shrink-0 font-medium text-dark-900 dark:text-dark-50">
                                      {formatPrice((item.sale_price_snapshot || item.price_snapshot) * item.qty)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Kargo Takip */}
                            <div>
                              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                                <Truck size={13} /> Kargo Takip
                              </h4>
                              <div className="space-y-2 rounded-lg bg-white p-3 dark:bg-dark-700">
                                {order.tracking_no && !trackingInputs[order.id] ? (
                                  <div>
                                    <p className="text-xs text-dark-500 dark:text-dark-400">Kargo Firma</p>
                                    <p className="text-sm font-medium text-dark-900 dark:text-dark-50">{order.shipping_company || "-"}</p>
                                    <p className="mt-2 text-xs text-dark-500 dark:text-dark-400">Takip No</p>
                                    <p className="font-mono text-sm font-medium text-dark-900 dark:text-dark-50">{order.tracking_no}</p>
                                    <button
                                      onClick={() => setTrackingInputs((prev) => ({
                                        ...prev,
                                        [order.id]: { no: order.tracking_no || "", provider: order.shipping_company || "" },
                                      }))}
                                      className="mt-2 text-xs text-primary-600 hover:underline"
                                    >
                                      Düzenle
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <select
                                      value={trackInput.provider}
                                      onChange={(e) => setTrackingInputs((prev) => ({
                                        ...prev,
                                        [order.id]: { ...trackInput, provider: e.target.value },
                                      }))}
                                      className={`${ADMIN_SELECT} w-full text-xs`}
                                    >
                                      <option value="">Kargo Firması Seçin</option>
                                      {SHIPPING_PROVIDERS.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Takip numarası..."
                                      value={trackInput.no}
                                      onChange={(e) => setTrackingInputs((prev) => ({
                                        ...prev,
                                        [order.id]: { ...trackInput, no: e.target.value },
                                      }))}
                                      className={`${ADMIN_INPUT} text-xs`}
                                    />
                                    <button
                                      onClick={() => handleTrackingSave(order)}
                                      disabled={!trackInput.no.trim()}
                                      className="w-full rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                                    >
                                      Kaydet
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Fatura / Fiyat Özeti */}
                            <div>
                              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dark-500 dark:text-dark-400">
                                <FileText size={13} /> Fatura Bilgileri
                              </h4>
                              <div className="space-y-1.5 rounded-lg bg-white p-3 text-sm dark:bg-dark-700">
                                <div className="flex justify-between">
                                  <span className="text-dark-500 dark:text-dark-400">Fatura No</span>
                                  <span className="font-mono text-xs font-medium text-dark-900 dark:text-dark-50">FTR-{order.order_no}</span>
                                </div>
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
                                <div className="flex justify-between border-t border-dark-100 pt-1.5 font-bold dark:border-dark-600">
                                  <span className="text-dark-900 dark:text-dark-50">Toplam</span>
                                  <span className="text-dark-900 dark:text-dark-50">{formatPrice(order.total)}</span>
                                </div>
                                <button
                                  onClick={() => handlePrintInvoice(order)}
                                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dark-200 py-1.5 text-xs font-medium text-dark-600 transition-colors hover:bg-dark-50 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-600"
                                >
                                  <Printer size={12} /> Fatura Yazdır
                                </button>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-400">
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
