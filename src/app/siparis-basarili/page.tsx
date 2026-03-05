"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Copy, Check } from "lucide-react";
import { useOrders } from "@/context/OrderContext";
import { formatPrice } from "@/lib/utils";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNo = searchParams.get("order");
  const { getOrderByNo } = useOrders();
  const [copied, setCopied] = useState(false);

  const order = orderNo ? getOrderByNo(orderNo) : undefined;
  const displayOrderNo = order?.order_no || orderNo || "\u2014";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayOrderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = displayOrderNo;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 animate-bounce items-center justify-center rounded-full bg-green-100" style={{ animationDuration: "1s", animationIterationCount: "2" }}>
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-dark-900">{"Sipari\u015Finiz Al\u0131nd\u0131!"}</h1>
          <p className="mt-2 text-dark-600">
            {"Sipari\u015Finiz ba\u015Far\u0131yla olu\u015Fturuldu. Sipari\u015F detaylar\u0131n\u0131z e-posta adresinize g\u00F6nderilecektir."}
          </p>

          <div className="mt-6 rounded-xl border-2 border-green-200 bg-green-50 p-5">
            <p className="text-sm font-medium text-green-700">{"Sipari\u015F Numaran\u0131z"}</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-2xl font-extrabold tracking-wider text-green-800">
                {displayOrderNo}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                title={"Sipari\u015F numaras\u0131n\u0131 kopyala"}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    {"Kopyaland\u0131"}
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Kopyala
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-green-600">
              {"Bu numara size \u00F6zeldir. Sipari\u015F takibi i\u00E7in saklay\u0131n\u0131z."}
            </p>
          </div>

          {order && (
            <div className="mt-4 rounded-xl border border-dark-100 bg-white p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-500">{"Sipari\u015F Tarihi"}</span>
                <span className="font-medium text-dark-900">
                  {new Date(order.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-dark-500">{"\u00DCr\u00FCn Say\u0131s\u0131"}</span>
                <span className="font-medium text-dark-900">{order.items?.length ?? 0} {"\u00FCr\u00FCn"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-dark-100 pt-2">
                <span className="font-bold text-dark-900">Toplam</span>
                <span className="text-lg font-bold text-primary-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/hesabim/siparislerim"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              <Package size={16} />
              {"Sipari\u015Flerim"}
            </Link>
            <Link
              href="/urunler"
              className="flex items-center justify-center gap-2 rounded-lg border border-dark-200 px-6 py-3 text-sm font-semibold text-dark-700 hover:bg-dark-50"
            >
              {"Al\u0131\u015Fveri\u015Fe Devam"}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
