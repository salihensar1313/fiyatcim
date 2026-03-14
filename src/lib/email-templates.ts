import { CONTACT } from "@/lib/constants";

/** Escape HTML special characters to prevent XSS in email templates */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderEmailData {
  orderNo: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(price);
}

/** Full HTML email wrapper — mobile-responsive with fluid layout */
function emailWrapper(content: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="tr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Fiyatcim.com</title>
  <style type="text/css">
    /* Reset */
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100% !important; }

    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-body { padding: 20px 16px !important; }
      .email-header { padding: 20px 16px !important; }
      .email-footer { padding: 16px !important; }
      .email-logo { height: 80px !important; max-width: 280px !important; }
      .email-title { font-size: 18px !important; }
      .email-text { font-size: 14px !important; }
      .email-table { font-size: 13px !important; }
      .email-total { font-size: 16px !important; }
      .info-box { padding: 12px !important; }
      .stack-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Outer wrapper for background -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Main container -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          ${content}
        </table>
        <!-- End container -->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Email header with logo and title */
function emailHeader(title: string, bgColor = "#1a1a2e"): string {
  return `
  <tr>
    <td class="email-header" align="center" style="background-color: ${bgColor}; padding: 28px 24px; text-align: center;">
      <img class="email-logo" src="https://fiyatcim.com/images/logo-white.png" alt="Fiyatcim.com" width="300" height="75" style="height: 75px; width: 300px; max-width: 100%; display: block; margin: 0 auto; object-fit: contain;" />
      <h1 class="email-title" style="margin: 12px 0 0; font-size: 20px; font-weight: 700; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${title}</h1>
    </td>
  </tr>`;
}

/** Email footer */
function emailFooter(): string {
  return `
  <tr>
    <td class="email-footer" style="background-color: #f8f8f8; padding: 20px 24px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Bu e-posta ${CONTACT.email} adresinden gönderilmiştir.</p>
      <p style="margin: 6px 0 0; font-size: 12px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
    </td>
  </tr>`;
}

/** Reusable info box for status messages */
function infoBox(text: string, bgColor: string, borderColor: string, textColor: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
    <tr>
      <td class="info-box" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; font-weight: 600; color: ${textColor}; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${text}</p>
      </td>
    </tr>
  </table>`;
}

/** Tracking link */
function trackingLink(): string {
  return `
  <p style="margin: 0; font-size: 13px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    Siparişinizi <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626; text-decoration: underline;">sipariş takip</a> sayfasından takip edebilirsiniz.
  </p>`;
}

export function orderConfirmationEmail(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td class="email-table" style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${escapeHtml(item.name)}
        </td>
        <td class="email-table" style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: center; font-size: 14px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${item.quantity}
        </td>
        <td class="email-table" style="padding: 10px 0; border-bottom: 1px solid #eeeeee; text-align: right; font-size: 14px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: nowrap;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const content = `
  ${emailHeader("Sipariş Onayı")}
  <tr>
    <td class="email-body" style="padding: 28px 32px;">
      <p style="margin: 0 0 4px; font-size: 16px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #555555; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Siparişiniz başarıyla alındı! Aşağıda sipariş detaylarınızı bulabilirsiniz.
      </p>

      ${infoBox(`Sipariş No: ${escapeHtml(data.orderNo)}`, "#f0fdf4", "#bbf7d0", "#166534")}

      <!-- Product table -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #eeeeee;">
            <th class="email-table" style="text-align: left; padding: 8px 0; color: #555555; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Ürün</th>
            <th class="email-table" style="text-align: center; padding: 8px 0; color: #555555; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 50px;">Adet</th>
            <th class="email-table" style="text-align: right; padding: 8px 0; color: #555555; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: nowrap;">Tutar</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
        <tr>
          <td style="text-align: right; padding: 4px 0; font-size: 14px; color: #555555; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Ara Toplam: ${formatPrice(data.subtotal)}
          </td>
        </tr>
        ${data.discount > 0 ? `<tr><td style="text-align: right; padding: 4px 0; font-size: 14px; color: #DC2626; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">İndirim: -${formatPrice(data.discount)}</td></tr>` : ""}
        <tr>
          <td style="text-align: right; padding: 4px 0; font-size: 14px; color: #555555; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Kargo: ${data.shipping > 0 ? formatPrice(data.shipping) : "Ücretsiz"}
          </td>
        </tr>
        <tr>
          <td class="email-total" style="text-align: right; padding: 8px 0 0; font-size: 18px; font-weight: 700; color: #111111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Toplam: ${formatPrice(data.total)}
          </td>
        </tr>
      </table>

      <!-- Shipping Address -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
        <tr>
          <td class="info-box" style="background-color: #f8fafc; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 4px; font-weight: 600; font-size: 14px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Teslimat Adresi</p>
            <p style="margin: 0; font-size: 13px; color: #555555; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;">${escapeHtml(data.shippingAddress)}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
        <tr><td>${trackingLink()}</td></tr>
      </table>
    </td>
  </tr>
  ${emailFooter()}`;

  return emailWrapper(content);
}

export function orderShippedEmail(data: { orderNo: string; customerName: string; trackingCode?: string }): string {
  const content = `
  ${emailHeader("Siparişiniz Kargoya Verildi")}
  <tr>
    <td class="email-body" style="padding: 28px 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #555555; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz kargoya verilmiştir.
      </p>

      ${data.trackingCode ? infoBox(`Kargo Takip No: ${escapeHtml(data.trackingCode)}`, "#eff6ff", "#bfdbfe", "#1e40af") : ""}

      ${trackingLink()}
    </td>
  </tr>
  ${emailFooter()}`;

  return emailWrapper(content);
}

export function orderDeliveredEmail(data: { orderNo: string; customerName: string }): string {
  const content = `
  ${emailHeader("Siparişiniz Teslim Edildi", "#16a34a")}
  <tr>
    <td class="email-body" style="padding: 28px 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #555555; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz başarıyla teslim edilmiştir.
      </p>

      ${infoBox("Bizi tercih ettiğiniz için teşekkür ederiz!", "#f0fdf4", "#bbf7d0", "#166534")}

      ${trackingLink()}
    </td>
  </tr>
  ${emailFooter()}`;

  return emailWrapper(content);
}

export function orderCancelledEmail(data: { orderNo: string; customerName: string }): string {
  const content = `
  ${emailHeader("Siparişiniz İptal Edildi")}
  <tr>
    <td class="email-body" style="padding: 28px 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #555555; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz iptal edilmiştir.
      </p>

      ${infoBox("Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.", "#fef2f2", "#fecaca", "#991b1b")}

      <p style="margin: 0; font-size: 13px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Detaylar için <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626; text-decoration: underline;">sipariş takip</a> sayfasını ziyaret edebilirsiniz.
      </p>
    </td>
  </tr>
  ${emailFooter()}`;

  return emailWrapper(content);
}

export function orderRefundedEmail(data: { orderNo: string; customerName: string }): string {
  const content = `
  ${emailHeader("İade İşleminiz Tamamlandı")}
  <tr>
    <td class="email-body" style="padding: 28px 32px;">
      <p style="margin: 0 0 16px; font-size: 16px; color: #333333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
      </p>
      <p style="margin: 0 0 20px; color: #555555; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişinizin iade işlemi tamamlanmıştır.
      </p>

      ${infoBox("İade tutarı ödeme yönteminize göre birkaç iş günü içinde hesabınıza yansıyacaktır.", "#eff6ff", "#bfdbfe", "#1e40af")}

      <p style="margin: 0; font-size: 13px; color: #888888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        Detaylar için <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626; text-decoration: underline;">sipariş takip</a> sayfasını ziyaret edebilirsiniz.
      </p>
    </td>
  </tr>
  ${emailFooter()}`;

  return emailWrapper(content);
}
