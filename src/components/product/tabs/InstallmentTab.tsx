"use client";

import { CreditCard } from "lucide-react";
import type { Product } from "@/types";
import { formatPrice, getEffectivePrice } from "@/lib/utils";

interface InstallmentTabProps {
  product: Product;
}

const BANKS = [
  { name: "Visa / Mastercard", logo: "💳" },
  { name: "American Express", logo: "💳" },
  { name: "Troy", logo: "💳" },
];

const INSTALLMENTS = [1, 2, 3, 6, 9, 12];

export default function InstallmentTab({ product }: InstallmentTabProps) {
  const effectivePrice = getEffectivePrice(product.price, product.sale_price);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <CreditCard size={28} className="shrink-0 text-blue-600" />
        <div>
          <h3 className="text-lg font-bold text-blue-800">Taksit Seçenekleri</h3>
          <p className="mt-0.5 text-sm text-blue-700">
            Ürün fiyatı: <span className="font-bold">{formatPrice(effectivePrice)}</span>
          </p>
        </div>
      </div>

      {/* Taksit Tablosu */}
      <div className="overflow-hidden rounded-xl border border-dark-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark-800 text-white">
              <th className="px-4 py-3 text-left font-semibold">Banka / Kart</th>
              <th className="px-4 py-3 text-center font-semibold">Taksit</th>
              <th className="px-4 py-3 text-right font-semibold">Aylık</th>
              <th className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {BANKS.map((bank) =>
              INSTALLMENTS.map((inst, idx) => {
                const monthly = effectivePrice / inst;
                const total = effectivePrice; // No interest for demo
                return (
                  <tr
                    key={`${bank.name}-${inst}`}
                    className={`border-t border-dark-100 ${idx % 2 === 0 ? "bg-white" : "bg-dark-50"}`}
                  >
                    {idx === 0 ? (
                      <td
                        rowSpan={INSTALLMENTS.length}
                        className="border-r border-dark-100 px-4 py-3 align-middle font-medium text-dark-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{bank.logo}</span>
                          <span className="text-xs sm:text-sm">{bank.name}</span>
                        </div>
                      </td>
                    ) : null}
                    <td className="px-4 py-2.5 text-center text-dark-700">
                      {inst === 1 ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                          Tek Çekim
                        </span>
                      ) : (
                        <span>{inst} Taksit</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-dark-900">
                      {formatPrice(monthly)}
                    </td>
                    <td className="hidden px-4 py-2.5 text-right text-dark-500 sm:table-cell">
                      {formatPrice(total)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-dark-100 bg-dark-50 p-4 text-center">
        <p className="text-xs text-dark-400">
          Taksit seçenekleri bankanıza ve kart tipinize göre farklılık gösterebilir.
          Gerçek taksit tutarları ödeme adımında hesaplanır. Tablodaki tutarlar faizsiz olarak gösterilmektedir.
        </p>
      </div>
    </div>
  );
}
