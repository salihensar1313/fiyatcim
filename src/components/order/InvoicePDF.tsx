"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CONTACT, SITE_NAME } from "@/lib/constants";
import { ORDER_STATUS_LABELS } from "@/types";
import type { Order, Address } from "@/types";

function formatAddr(a: Address) {
  return `${a.ad} ${a.soyad}, ${a.adres}, ${a.ilce}/${a.il} ${a.posta_kodu}`;
}

interface InvoicePDFProps {
  order: Order;
}

export default function InvoicePDF({ order }: InvoicePDFProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8" />
        <title>Fatura — ${order.order_no}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; font-size: 13px; line-height: 1.5; padding: 40px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #dc2626; }
          .brand { font-size: 24px; font-weight: 800; color: #dc2626; }
          .brand-sub { font-size: 11px; color: #6b7280; margin-top: 4px; }
          .invoice-title { text-align: right; }
          .invoice-title h1 { font-size: 20px; font-weight: 700; color: #111827; }
          .invoice-title p { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
          .meta-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; margin-bottom: 6px; }
          .meta-box p { font-size: 12px; color: #374151; }
          .meta-box .value { font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
          td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
          .text-right { text-align: right; }
          .summary { margin-left: auto; width: 280px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: #374151; }
          .summary-row.total { border-top: 2px solid #111827; margin-top: 8px; padding-top: 10px; font-size: 15px; font-weight: 700; color: #111827; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; }
          .status-badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #dcfce7; color: #166534; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const orderDate = new Date(order.created_at).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dark-200 px-3 py-1.5 text-xs font-medium text-dark-600 dark:text-dark-300 transition-colors hover:bg-dark-50 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-700"
      >
        <Printer size={14} />
        Fatura
      </button>

      {/* Hidden invoice content for printing */}
      <div ref={invoiceRef} className="hidden">
        {/* Header */}
        <div className="invoice-header">
          <div>
            <div className="brand">{SITE_NAME}</div>
            <div className="brand-sub">{CONTACT.address} &bull; {CONTACT.email}</div>
          </div>
          <div className="invoice-title">
            <h1>FATURA</h1>
            <p>{order.order_no} &bull; {orderDate}</p>
          </div>
        </div>

        {/* Meta Grid */}
        <div className="meta-grid">
          <div className="meta-box">
            <h3>Fatura Adresi</h3>
            <p>{formatAddr(order.billing_address)}</p>
            <p>Tel: {order.billing_address.telefon}</p>
          </div>
          <div className="meta-box">
            <h3>Teslimat Adresi</h3>
            <p>{formatAddr(order.shipping_address)}</p>
            <p>Tel: {order.shipping_address.telefon}</p>
          </div>
          <div className="meta-box">
            <h3>Sipariş Durumu</h3>
            <p><span className="status-badge">{ORDER_STATUS_LABELS[order.status]}</span></p>
          </div>
          <div className="meta-box">
            <h3>Ödeme Bilgisi</h3>
            <p className="value">{order.payment_provider === "iyzico" ? "Kredi Kartı (iyzico)" : order.payment_provider === "paytr" ? "Kredi Kartı (PayTR)" : "Havale/EFT"}</p>
          </div>
        </div>

        {/* Items Table */}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ürün</th>
              <th className="text-right">Birim Fiyat</th>
              <th className="text-right">Adet</th>
              <th className="text-right">KDV</th>
              <th className="text-right">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, i) => {
              const unitPrice = item.sale_price_snapshot || item.price_snapshot;
              const lineTotal = unitPrice * item.qty;
              return (
                <tr key={item.id}>
                  <td>{i + 1}</td>
                  <td>{item.name_snapshot}</td>
                  <td className="text-right">{formatPrice(unitPrice)}</td>
                  <td className="text-right">{item.qty}</td>
                  <td className="text-right">%{item.tax_rate_snapshot}</td>
                  <td className="text-right">{formatPrice(lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Summary */}
        <div className="summary">
          <div className="summary-row">
            <span>Ara Toplam</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Kargo</span>
            <span>{order.shipping === 0 ? "Ücretsiz" : formatPrice(order.shipping)}</span>
          </div>
          {order.discount > 0 && (
            <div className="summary-row">
              <span>İndirim</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Genel Toplam</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>Bu belge {SITE_NAME} tarafından elektronik ortamda oluşturulmuştur.</p>
          <p>{CONTACT.email} &bull; {CONTACT.address}</p>
        </div>
      </div>
    </>
  );
}
