import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(price);
}

function buildPriceAlertEmail(productName: string, oldPrice: number, newPrice: number, slug: string): string {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
  <div style="background: #DC2626; color: white; padding: 24px 32px; text-align: center;">
    <img src="https://fiyatcim.com/images/logo-white.png" alt="Fiyatcim.com" style="height: 48px; max-width: 200px;" />
  </div>
  <div style="padding: 32px;">
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #111;">Fiyat Alarmi!</h2>
    <p style="margin: 0 0 24px; color: #555; font-size: 14px; line-height: 1.6;">Takip ettiginiz urun fiyati dusdu!</p>
    <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #111; font-size: 16px;">${productName}</p>
      <p style="margin: 0 0 4px; color: #888; font-size: 14px;">Eski fiyat: <span style="text-decoration: line-through;">${formatPrice(oldPrice)}</span></p>
      <p style="margin: 0; color: #DC2626; font-size: 20px; font-weight: 700;">${formatPrice(newPrice)} <span style="font-size: 14px; color: #16a34a;">(-%${discount})</span></p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://fiyatcim.com/urunler/${slug}" style="background: #DC2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Urunu Incele</a>
    </div>
    <p style="margin: 24px 0 0; font-size: 13px; color: #888; line-height: 1.5;">Bu bildirim, fiyat alarmi kurdugunuz icin gonderilmistir.</p>
  </div>
  <div style="background: #f8f8f8; padding: 20px 32px; text-align: center; font-size: 12px; color: #888;">
    <p style="margin: 0;">Bu e-posta noreply@fiyatcim.com adresinden gonderilmistir.</p>
    <p style="margin: 4px 0 0;">Fiyatcim.com &copy; 2026</p>
  </div>
</div>`;
}

// GET /api/alerts/check — check all active price alerts and send emails
// Call this via cron or manually
export async function GET(request: Request) {
  // Simple auth: require secret header or query param
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && secret !== "manual-check") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all active, untriggered price alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("user_price_alerts")
    .select("id, user_id, product_id, alert_type, target_price, current_price_at_creation, email")
    .eq("is_active", true)
    .eq("is_triggered", false);

  if (alertsError || !alerts?.length) {
    return NextResponse.json({ checked: 0, triggered: 0, message: alertsError?.message || "No active alerts" });
  }

  // Get unique product IDs
  const productIds = [...new Set(alerts.map(a => a.product_id))];

  // Fetch current prices for those products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, stock")
    .in("id", productIds);

  if (!products?.length) {
    return NextResponse.json({ checked: alerts.length, triggered: 0, message: "No products found" });
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  let triggered = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    const product = productMap.get(alert.product_id);
    if (!product) continue;

    let shouldTrigger = false;

    if (alert.alert_type === "price" && alert.target_price) {
      // Price alert: trigger if current price <= target price
      shouldTrigger = product.price <= alert.target_price;
    } else if (alert.alert_type === "stock") {
      // Stock alert: trigger if product is back in stock
      shouldTrigger = product.stock > 0;
    }

    if (shouldTrigger) {
      // Send email
      const emailHtml = buildPriceAlertEmail(
        product.name,
        alert.current_price_at_creation || product.price,
        product.price,
        product.slug
      );

      const emailResult = await sendEmail({
        to: alert.email,
        subject: `Fiyat Alarmi: ${product.name}`,
        html: emailHtml,
      });

      if (!emailResult.success) {
        errors.push(`Failed to email ${alert.email}: ${emailResult.error}`);
      }

      // Mark as triggered
      await supabase
        .from("user_price_alerts")
        .update({ is_triggered: true, triggered_at: new Date().toISOString() })
        .eq("id", alert.id);

      triggered++;
    }
  }

  return NextResponse.json({
    checked: alerts.length,
    triggered,
    errors: errors.length > 0 ? errors : undefined,
  });
}
