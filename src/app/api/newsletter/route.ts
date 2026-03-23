import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

// Rate limiter
const subHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = subHits.get(ip);
  if (!entry || now > entry.resetAt) {
    subHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count++;
  return entry.count > 3;
}

/**
 * POST /api/newsletter
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Cok fazla istek." }, { status: 429 });
    }

    const body = await request.json();
    const email = (String(body.email || "")).trim().toLowerCase();

    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json({ error: "Gecerli bir e-posta adresi giriniz." }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert — duplicate'leri sessizce yönet
    const { error } = await adminClient
      .from("newsletter_subscribers")
      .upsert(
        { email, source: "homepage", subscribed_at: new Date().toISOString(), is_active: true },
        { onConflict: "email" }
      );

    if (error) {
      console.error("[newsletter] Insert error:", error.message, error.code, error.details);
      return NextResponse.json({ error: "Kayit basarisiz: " + error.message }, { status: 500 });
    }

    // Hoşgeldin e-postası gönder
    await sendEmail({
      to: email,
      subject: "Fiyatcim Bültenine Hoş Geldiniz!",
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <div style="background:#1a1a2e;padding:28px 24px;text-align:center">
          <img src="https://fiyatcim.com/images/logo-white.png" alt="Fiyatcim.com" width="300" height="75" style="height:75px;width:300px;max-width:100%;display:block;margin:0 auto;object-fit:contain"/>
          <h1 style="margin:12px 0 0;font-size:20px;font-weight:700;color:#fff">Bültene Hoş Geldiniz!</h1>
        </div>
        <div style="padding:28px 32px">
          <p style="margin:0 0 16px;font-size:16px;color:#333">Merhaba,</p>
          <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6">
            Fiyatcim.com bültenine kaydınız başarıyla tamamlandı! Bundan sonra en güncel kampanyalar, fiyat düşüşleri ve yeni ürün duyurularından ilk siz haberdar olacaksınız.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr><td align="center">
              <a href="https://fiyatcim.com/kampanyalar" style="display:inline-block;background:#DC2626;color:#fff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px">Kampanyaları Keşfet</a>
            </td></tr>
          </table>
        </div>
        <div style="background:#f8f8f8;padding:20px 24px;text-align:center">
          <p style="margin:0;font-size:12px;color:#888">Bu e-posta destek@fiyatcim.com adresinden gönderilmiştir.</p>
          <p style="margin:6px 0 0;font-size:12px;color:#888">Fiyatcim.com &copy; 2026</p>
        </div>
      </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[newsletter] Error:", err);
    return NextResponse.json({ error: "Hata: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
