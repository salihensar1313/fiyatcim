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

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
`;

const headerStyle = `
  background: #DC2626;
  color: white;
  padding: 24px 32px;
  text-align: center;
`;

const bodyStyle = `padding: 32px;`;

const footerStyle = `
  background: #f8f8f8;
  padding: 20px 32px;
  text-align: center;
  font-size: 12px;
  color: #888;
`;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(price);
}

export function orderConfirmationEmail(data: OrderEmailData): string {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          ${escapeHtml(item.name)}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px;">Sipariş Onayı</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fiyatcim.com</p>
      </div>

      <div style="${bodyStyle}">
        <p style="margin: 0 0 4px; font-size: 16px;">
          Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #555; font-size: 14px;">
          Siparişiniz başarıyla alındı! Aşağıda sipariş detaylarınızı bulabilirsiniz.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: #166534;">
            Sipariş No: ${escapeHtml(data.orderNo)}
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #eee;">
              <th style="text-align: left; padding: 8px 0; color: #555;">Ürün</th>
              <th style="text-align: center; padding: 8px 0; color: #555;">Adet</th>
              <th style="text-align: right; padding: 8px 0; color: #555;">Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="margin-top: 16px; text-align: right; font-size: 14px;">
          <p style="margin: 4px 0; color: #555;">Ara Toplam: ${formatPrice(data.subtotal)}</p>
          ${data.discount > 0 ? `<p style="margin: 4px 0; color: #DC2626;">İndirim: -${formatPrice(data.discount)}</p>` : ""}
          <p style="margin: 4px 0; color: #555;">Kargo: ${data.shipping > 0 ? formatPrice(data.shipping) : "Ücretsiz"}</p>
          <p style="margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #111;">
            Toplam: ${formatPrice(data.total)}
          </p>
        </div>

        <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px;">
          <p style="margin: 0 0 4px; font-weight: 600; font-size: 14px; color: #333;">Teslimat Adresi</p>
          <p style="margin: 0; font-size: 13px; color: #555;">${escapeHtml(data.shippingAddress)}</p>
        </div>

        <p style="margin: 24px 0 0; font-size: 13px; color: #888;">
          Siparişinizi <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626;">sipariş takip</a> sayfasından takip edebilirsiniz.
        </p>
      </div>

      <div style="${footerStyle}">
        <p style="margin: 0;">Bu e-posta ${CONTACT.email} adresinden gönderilmiştir.</p>
        <p style="margin: 4px 0 0;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

export function orderShippedEmail(data: { orderNo: string; customerName: string; trackingCode?: string }): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px;">Siparişiniz Kargoya Verildi</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fiyatcim.com</p>
      </div>

      <div style="${bodyStyle}">
        <p style="margin: 0 0 16px; font-size: 16px;">
          Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #555; font-size: 14px;">
          <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz kargoya verilmiştir.
        </p>

        ${
          data.trackingCode
            ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #1e40af;">
                  Kargo Takip No: ${escapeHtml(data.trackingCode)}
                </p>
              </div>`
            : ""
        }

        <p style="margin: 0; font-size: 13px; color: #888;">
          Siparişinizi <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626;">sipariş takip</a> sayfasından takip edebilirsiniz.
        </p>
      </div>

      <div style="${footerStyle}">
        <p style="margin: 0;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

export function orderDeliveredEmail(data: { orderNo: string; customerName: string }): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle} background: #16a34a;">
        <h1 style="margin: 0; font-size: 22px;">Siparişiniz Teslim Edildi</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fiyatcim.com</p>
      </div>

      <div style="${bodyStyle}">
        <p style="margin: 0 0 16px; font-size: 16px;">
          Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #555; font-size: 14px;">
          <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz başarıyla teslim edilmiştir.
        </p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: #166534;">
            Bizi tercih ettiğiniz için teşekkür ederiz!
          </p>
        </div>

        <p style="margin: 0; font-size: 13px; color: #888;">
          Siparişinizi <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626;">sipariş takip</a> sayfasından görüntüleyebilirsiniz.
        </p>
      </div>

      <div style="${footerStyle}">
        <p style="margin: 0;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

export function orderCancelledEmail(data: { orderNo: string; customerName: string }): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px;">Siparişiniz İptal Edildi</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fiyatcim.com</p>
      </div>

      <div style="${bodyStyle}">
        <p style="margin: 0 0 16px; font-size: 16px;">
          Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #555; font-size: 14px;">
          <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişiniz iptal edilmiştir.
        </p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">
            Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.
          </p>
        </div>

        <p style="margin: 0; font-size: 13px; color: #888;">
          Detaylar için <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626;">sipariş takip</a> sayfasını ziyaret edebilirsiniz.
        </p>
      </div>

      <div style="${footerStyle}">
        <p style="margin: 0;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}

export function orderRefundedEmail(data: { orderNo: string; customerName: string }): string {
  return `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin: 0; font-size: 22px;">İade İşleminiz Tamamlandı</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Fiyatcim.com</p>
      </div>

      <div style="${bodyStyle}">
        <p style="margin: 0 0 16px; font-size: 16px;">
          Merhaba <strong>${escapeHtml(data.customerName)}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #555; font-size: 14px;">
          <strong>${escapeHtml(data.orderNo)}</strong> numaralı siparişinizin iade işlemi tamamlanmıştır.
        </p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 600; color: #1e40af;">
            İade tutarı ödeme yönteminize göre birkaç iş günü içinde hesabınıza yansıyacaktır.
          </p>
        </div>

        <p style="margin: 0; font-size: 13px; color: #888;">
          Detaylar için <a href="https://fiyatcim.com/siparis-takip" style="color: #DC2626;">sipariş takip</a> sayfasını ziyaret edebilirsiniz.
        </p>
      </div>

      <div style="${footerStyle}">
        <p style="margin: 0;">Fiyatcim.com &copy; ${new Date().getFullYear()}</p>
      </div>
    </div>
  `;
}
