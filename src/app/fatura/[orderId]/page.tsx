"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, Download, Loader2 } from "lucide-react";

/**
 * /fatura/[orderId]
 *
 * Yazdirilabilir fatura sayfasi.
 * API'den fatura HTML'ini ceker ve iframe icinde gosterir.
 * Kullanici "Yazdir / PDF Kaydet" butonu ile cikti alabilir.
 */

export default function FaturaPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceHTML, setInvoiceHTML] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function fetchInvoice() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/invoice/download?orderId=${encodeURIComponent(orderId)}`);

        if (!res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json();
            setError(data.error || "Fatura yuklenemedi");
          } else {
            setError("Fatura yuklenemedi. Lutfen tekrar deneyin.");
          }
          return;
        }

        const html = await res.text();
        setInvoiceHTML(html);
      } catch {
        setError("Baglanti hatasi. Lutfen internet baglantinizi kontrol edin.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [orderId]);

  const handlePrint = () => {
    const iframe = document.getElementById("invoice-frame") as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleOpenNewTab = () => {
    window.open(`/api/invoice/download?orderId=${encodeURIComponent(orderId)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar — yazdirmada gizlenir */}
      <div className="sticky top-0 z-10 border-b bg-white shadow-sm print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Geri Don
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download size={16} />
              Yeni Sekmede Ac
            </button>
            <button
              onClick={handlePrint}
              disabled={!invoiceHTML}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Printer size={16} />
              Yazdir / PDF Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Icerik */}
      <div className="mx-auto max-w-4xl px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600 mb-3" />
            <p className="text-gray-500">Fatura hazirlaniyor...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Geri don
            </button>
          </div>
        )}

        {invoiceHTML && !loading && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              id="invoice-frame"
              srcDoc={invoiceHTML}
              className="w-full border-0"
              style={{ minHeight: "900px" }}
              title="Fatura Onizleme"
            />
          </div>
        )}
      </div>
    </div>
  );
}
