"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";

/**
 * Misafir Sipariş Takip — G36
 *
 * Privacy kuralı: order_no + email eşleşmeden sipariş detayı gösterilmez.
 * Artık doğrudan API endpoint'i kullanılıyor — login gerekmez.
 */

interface TrackingOrder {
  order_no: string;
  status: OrderStatus;
  payment_status: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shipping_address: { ad: string; soyad: string; adres: string; ilce: string; il: string; telefon: string; posta_kodu: string };
  shipping_company: string | null;
  tracking_no: string | null;
  created_at: string;
  items: Array<{
    id: string;
    name_snapshot: string;
    qty: number;
    price_snapshot: number;
    sale_price_snapshot: number | null;
  }>;
}

const STATUS_STEPS: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

const STATUS_ICONS: Record<string, React.ElementType> = {
  paid: CheckCircle,
  preparing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
  pending_payment: Clock,
};

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="container-custom py-8 text-center text-dark-500 dark:text-dark-400">Yükleniyor...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();

  const [orderNo, setOrderNo] = useState(searchParams.get("order_no") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [foundOrder, setFoundOrder] = useState<TrackingOrder | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rate limiting: max 5 attempts per 60 seconds
  const [attempts, setAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);

  const handleSearch = useCallback(async (searchOrderNo?: string, searchEmail?: string) => {
    const oNo = (searchOrderNo || orderNo).trim();
    const em = (searchEmail || email).trim().toLowerCase();

    if (!oNo || !em) {
      setError("Sipariş numarası ve e-posta adresi zorunludur.");
      return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now < lockUntil) {
      const remaining = Math.ceil((lockUntil - now) / 1000);
      setError(`Çok fazla deneme yaptınız. ${remaining} saniye sonra tekrar deneyin.`);
      return;
    }

    // Track attempts
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= 5) {
      setLockUntil(now + 60_000);
      setAttempts(0);
      setError("Çok fazla deneme yaptınız. 60 saniye sonra tekrar deneyin.");
      return;
    }

    setSearched(true);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: oNo, email: em }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFoundOrder(null);
        setError(data.error || "Sipariş bulunamadı.");
      } else {
        setFoundOrder(data.order);
        setAttempts(0);
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      setFoundOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderNo, email, lockUntil, attempts]);

  // URL'den gelen parametreleri otomatik ara
  useEffect(() => {
    const urlOrderNo = searchParams.get("order_no");
    const urlEmail = searchParams.get("email");
    if (urlOrderNo && urlEmail) {
      handleSearch(urlOrderNo, urlEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStepStatus = (step: OrderStatus, currentStatus: OrderStatus) => {
    const stepIndex = STATUS_STEPS.indexOf(step);
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);

    if (currentStatus === "cancelled" || currentStatus === "refunded") {
      return "inactive";
    }
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "inactive";
  };

  return (
    <div className="container-custom py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Sipariş Takip</h1>
        <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
          Sipariş numaranız ve e-posta adresiniz ile siparişinizi takip edebilirsiniz.
        </p>

        {/* Search Form */}
        <div className="mt-6 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Sipariş Numarası</label>
              <input
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="FC-2026-123456"
                className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-3 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
              />
            </div>
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? "Sorgulanıyor..." : "Sipariş Sorgula"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Result */}
        {foundOrder && (
          <div className="mt-6 space-y-4">
            {/* Order Header */}
            <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-500">Sipariş No</p>
                  <p className="font-mono text-lg font-bold text-dark-900 dark:text-dark-50">{foundOrder.order_no}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-dark-500">Tarih</p>
                  <p className="text-sm font-medium text-dark-700 dark:text-dark-200">
                    {new Date(foundOrder.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  foundOrder.status === "delivered" ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                  foundOrder.status === "cancelled" || foundOrder.status === "refunded" ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                  "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                }`}>
                  {(() => {
                    const Icon = STATUS_ICONS[foundOrder.status] || Clock;
                    return <Icon size={14} />;
                  })()}
                  {ORDER_STATUS_LABELS[foundOrder.status]}
                </span>
              </div>
            </div>

            {/* Progress Steps */}
            {foundOrder.status !== "cancelled" && foundOrder.status !== "refunded" && (
              <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <h3 className="mb-4 text-sm font-bold text-dark-900 dark:text-dark-50">Sipariş Durumu</h3>
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const status = getStepStatus(step, foundOrder.status);
                    const Icon = STATUS_ICONS[step] || Clock;

                    return (
                      <div key={step} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            status === "completed" ? "bg-green-500 text-white" :
                            status === "active" ? "bg-primary-600 text-white" :
                            "bg-dark-100 dark:bg-dark-700 text-dark-500"
                          }`}>
                            <Icon size={18} />
                          </div>
                          <p className={`mt-2 text-center text-xs font-medium ${
                            status === "inactive" ? "text-dark-500" : "text-dark-700 dark:text-dark-200"
                          }`}>
                            {ORDER_STATUS_LABELS[step]}
                          </p>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className="mx-2 flex-1">
                            <div className={`h-0.5 w-full ${
                              status === "completed" ? "bg-green-500" : "bg-dark-200 dark:bg-dark-600"
                            }`} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tracking Info */}
            {foundOrder.tracking_no && (
              <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <h3 className="mb-2 text-sm font-bold text-dark-900 dark:text-dark-50">Kargo Bilgileri</h3>
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-primary-600" />
                  <div>
                    {foundOrder.shipping_company && (
                      <p className="text-sm font-medium text-dark-700 dark:text-dark-200">{foundOrder.shipping_company}</p>
                    )}
                    <p className="text-sm text-dark-500 dark:text-dark-400">Takip No: {foundOrder.tracking_no}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
              <h3 className="mb-4 text-sm font-bold text-dark-900 dark:text-dark-50">Sipariş Detayı</h3>
              <div className="space-y-3">
                {foundOrder.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b border-dark-50 dark:border-dark-700 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-dark-900 dark:text-dark-50">{item.name_snapshot}</p>
                      <p className="text-xs text-dark-500">{item.qty} adet</p>
                    </div>
                    <p className="text-sm font-medium text-dark-700 dark:text-dark-200">
                      {((item.sale_price_snapshot || item.price_snapshot) * item.qty).toLocaleString("tr-TR")}₺
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 space-y-2 border-t border-dark-100 dark:border-dark-700 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500 dark:text-dark-400">Ara Toplam</span>
                  <span className="text-dark-700 dark:text-dark-200">{foundOrder.subtotal.toLocaleString("tr-TR")}₺</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500 dark:text-dark-400">Kargo</span>
                  <span className="text-dark-700 dark:text-dark-200">
                    {foundOrder.shipping === 0 ? "Ücretsiz" : `${foundOrder.shipping.toLocaleString("tr-TR")}₺`}
                  </span>
                </div>
                {foundOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-500 dark:text-dark-400">İndirim</span>
                    <span className="text-green-600">-{foundOrder.discount.toLocaleString("tr-TR")}₺</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dark-100 dark:border-dark-700 pt-2 text-base font-bold">
                  <span className="text-dark-900 dark:text-dark-50">Toplam</span>
                  <span className="text-dark-900 dark:text-dark-50">{foundOrder.total.toLocaleString("tr-TR")}₺</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {foundOrder.shipping_address && (
              <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <h3 className="mb-2 text-sm font-bold text-dark-900 dark:text-dark-50">Teslimat Adresi</h3>
                <p className="text-sm text-dark-600 dark:text-dark-300">
                  {foundOrder.shipping_address.ad} {foundOrder.shipping_address.soyad}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {foundOrder.shipping_address.adres}
                </p>
                <p className="text-sm text-dark-500 dark:text-dark-400">
                  {foundOrder.shipping_address.ilce} / {foundOrder.shipping_address.il}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state after search */}
        {searched && !foundOrder && !error && !loading && (
          <div className="mt-8 text-center">
            <Search size={48} className="mx-auto text-dark-200" />
            <p className="mt-4 text-dark-500 dark:text-dark-400">Sipariş bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}
