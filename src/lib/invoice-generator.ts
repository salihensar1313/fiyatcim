import type { Order, OrderItem, InvoiceInfo, Address } from "@/types";
import { SITE_NAME, SITE_URL, CONTACT } from "@/lib/constants";

/**
 * Fatura HTML Uretici
 *
 * Siparis bilgilerinden yazdirilabilir fatura HTML'i uretir.
 * Browser'in window.print() fonksiyonu ile PDF olarak kaydedilebilir.
 */

interface InvoiceData {
  order: Order;
  items: OrderItem[];
  invoiceInfo?: InvoiceInfo;
  billingAddress: Address;
  shippingAddress: Address;
}

/** Tarihi Turkce formatta dondurur: 22 Mart 2026 */
function formatDateTR(dateStr: string): string {
  const months = [
    "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
    "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Para birimini formatlar */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Urun birim fiyatini hesaplar (indirimli veya normal) */
function getUnitPrice(item: OrderItem): number {
  return item.sale_price_snapshot ?? item.price_snapshot;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const { order, items, invoiceInfo, billingAddress, shippingAddress } = data;

  const invoiceDate = formatDateTR(order.created_at);
  const invoiceNo = `FTR-${order.order_no}`;

  // Satici bilgileri
  const sellerInfo = `
    <div class="seller-info">
      <h3>${SITE_NAME}</h3>
      <p>${CONTACT.address}</p>
      <p>Tel: ${CONTACT.phone}</p>
      <p>E-posta: ${CONTACT.email}</p>
      <p>Web: ${SITE_URL}</p>
    </div>
  `;

  // Alici bilgileri
  let buyerName = `${billingAddress.ad} ${billingAddress.soyad}`;
  let buyerExtra = "";

  if (invoiceInfo?.wantsInvoice) {
    if (invoiceInfo.invoiceType === "kurumsal") {
      buyerName = invoiceInfo.companyName || buyerName;
      buyerExtra = `
        <p><strong>Vergi Dairesi:</strong> ${invoiceInfo.taxOffice || "-"}</p>
        <p><strong>Vergi No:</strong> ${invoiceInfo.taxNumber || "-"}</p>
      `;
    } else {
      buyerName = invoiceInfo.fullName || buyerName;
      buyerExtra = `
        <p><strong>TC Kimlik No:</strong> ${invoiceInfo.tcKimlik || "-"}</p>
      `;
    }
  }

  const buyerInfo = `
    <div class="buyer-info">
      <h3>Alici Bilgileri</h3>
      <p><strong>${buyerName}</strong></p>
      ${buyerExtra}
      <p>${billingAddress.adres}</p>
      <p>${billingAddress.ilce} / ${billingAddress.il}</p>
      <p>Tel: ${billingAddress.telefon}</p>
    </div>
  `;

  // Urun satirlari
  const itemRows = items
    .map((item, idx) => {
      const unitPrice = getUnitPrice(item);
      const lineTotal = unitPrice * item.qty;
      const taxAmount = item.tax_amount || 0;

      return `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${item.name_snapshot}</td>
          <td class="center">${item.qty}</td>
          <td class="right">${formatCurrency(unitPrice)}</td>
          <td class="center">%${item.tax_rate_snapshot || 20}</td>
          <td class="right">${formatCurrency(taxAmount)}</td>
          <td class="right">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");

  // Toplam hesaplama
  const subtotal = order.subtotal;
  const shipping = order.shipping;
  const discount = order.discount;
  const total = order.total;

  // Teslimat adresi
  const deliveryInfo = `
    <div class="delivery-info">
      <h4>Teslimat Adresi</h4>
      <p>${shippingAddress.ad} ${shippingAddress.soyad}</p>
      <p>${shippingAddress.adres}</p>
      <p>${shippingAddress.ilce} / ${shippingAddress.il}</p>
      <p>Tel: ${shippingAddress.telefon}</p>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fatura - ${invoiceNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      background: #fff;
      padding: 20px;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #ddd;
      padding: 30px;
    }

    /* Header */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #dc2626;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .invoice-header h1 {
      font-size: 28px;
      color: #dc2626;
      font-weight: 700;
    }

    .invoice-header h2 {
      font-size: 18px;
      color: #666;
      margin-top: 4px;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta p {
      margin-bottom: 4px;
      font-size: 12px;
    }

    .invoice-meta strong {
      color: #333;
    }

    /* Info boxes */
    .info-row {
      display: flex;
      gap: 30px;
      margin-bottom: 25px;
    }

    .seller-info, .buyer-info {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
    }

    .seller-info h3, .buyer-info h3 {
      font-size: 13px;
      color: #dc2626;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }

    .seller-info p, .buyer-info p {
      margin-bottom: 3px;
      font-size: 11px;
      line-height: 1.5;
    }

    /* Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .items-table thead {
      background: #dc2626;
      color: #fff;
    }

    .items-table th {
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 600;
      text-align: left;
    }

    .items-table td {
      padding: 8px 10px;
      font-size: 11px;
      border-bottom: 1px solid #e5e7eb;
    }

    .items-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    .center { text-align: center; }
    .right { text-align: right; }

    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }

    .totals-table {
      width: 300px;
      border-collapse: collapse;
    }

    .totals-table td {
      padding: 6px 10px;
      font-size: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .totals-table .total-row {
      background: #dc2626;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }

    .totals-table .total-row td {
      border-bottom: none;
      padding: 10px;
    }

    /* Delivery & Notes */
    .bottom-section {
      display: flex;
      gap: 30px;
      margin-bottom: 25px;
    }

    .delivery-info {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
    }

    .delivery-info h4 {
      font-size: 12px;
      color: #dc2626;
      margin-bottom: 8px;
    }

    .delivery-info p {
      font-size: 11px;
      margin-bottom: 3px;
    }

    .payment-info {
      flex: 1;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
    }

    .payment-info h4 {
      font-size: 12px;
      color: #dc2626;
      margin-bottom: 8px;
    }

    .payment-info p {
      font-size: 11px;
      margin-bottom: 3px;
    }

    /* Footer */
    .invoice-footer {
      text-align: center;
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
      color: #999;
      font-size: 10px;
    }

    .invoice-footer p {
      margin-bottom: 3px;
    }

    /* Print styles */
    @media print {
      body {
        padding: 0;
        background: #fff;
      }

      .invoice-container {
        border: none;
        padding: 0;
        max-width: 100%;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div>
        <h1>${SITE_NAME}</h1>
        <h2>FATURA</h2>
      </div>
      <div class="invoice-meta">
        <p><strong>Fatura No:</strong> ${invoiceNo}</p>
        <p><strong>Siparis No:</strong> ${order.order_no}</p>
        <p><strong>Fatura Tarihi:</strong> ${invoiceDate}</p>
        <p><strong>Duzenleme Saati:</strong> ${new Date(order.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>

    <!-- Satici & Alici -->
    <div class="info-row">
      ${sellerInfo}
      ${buyerInfo}
    </div>

    <!-- Urunler Tablosu -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="center" style="width:40px">#</th>
          <th>Urun Adi</th>
          <th class="center" style="width:60px">Adet</th>
          <th class="right" style="width:100px">Birim Fiyat</th>
          <th class="center" style="width:60px">KDV</th>
          <th class="right" style="width:90px">KDV Tutari</th>
          <th class="right" style="width:110px">Tutar</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Toplam -->
    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Ara Toplam</td>
          <td class="right">${formatCurrency(subtotal)}</td>
        </tr>
        ${shipping > 0 ? `
        <tr>
          <td>Kargo</td>
          <td class="right">${formatCurrency(shipping)}</td>
        </tr>
        ` : `
        <tr>
          <td>Kargo</td>
          <td class="right" style="color: #16a34a;">Ucretsiz</td>
        </tr>
        `}
        ${discount > 0 ? `
        <tr>
          <td>Indirim</td>
          <td class="right" style="color: #dc2626;">-${formatCurrency(discount)}</td>
        </tr>
        ` : ""}
        <tr class="total-row">
          <td>GENEL TOPLAM</td>
          <td class="right">${formatCurrency(total)}</td>
        </tr>
      </table>
    </div>

    <!-- Alt Bilgiler -->
    <div class="bottom-section">
      ${deliveryInfo}
      <div class="payment-info">
        <h4>Odeme Bilgileri</h4>
        <p><strong>Odeme Yontemi:</strong> ${order.payment_provider === "iyzico" ? "Kredi Karti (iyzico)" : order.payment_provider === "paytr" ? "Kredi Karti (PayTR)" : "Kredi Karti"}</p>
        <p><strong>Odeme Durumu:</strong> ${order.payment_status === "success" ? "Odendi" : "Beklemede"}</p>
        ${order.payment_ref ? `<p><strong>Odeme Ref:</strong> ${order.payment_ref}</p>` : ""}
      </div>
    </div>

    <!-- Footer -->
    <div class="invoice-footer">
      <p>Bu fatura ${SITE_NAME} tarafindan elektronik ortamda olusturulmustur.</p>
      <p>${SITE_URL} | ${CONTACT.email} | ${CONTACT.phone}</p>
      <p>Bu belge bilgi amaclidir. Resmi e-fatura icin Parasut entegrasyonu gereklidir.</p>
    </div>
  </div>
</body>
</html>`;
}
