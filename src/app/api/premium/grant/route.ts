import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.isAdmin) return auth.response;

    const { email, notes } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email gerekli" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Kullanıcıyı email ile bul (tüm sayfaları tara)
    let user = null;
    let page = 1;
    while (!user) {
      const { data: users } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (!users?.users?.length) break;
      user = users.users.find((u) => u.email === email);
      page++;
    }

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Aktif premium var mı kontrol et
    const { data: existing } = await supabase
      .from("user_premium_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Kullanıcı zaten premium" }, { status: 409 });
    }

    // Premium oluştur
    const { error } = await supabase.from("user_premium_memberships").insert({
      user_id: user.id,
      status: "active",
      price_paid: 1,
      payment_method: "admin_granted",
      notes: notes || "Admin tarafından atandı",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Premium hoşgeldin e-postası gönder
    try {
      await sendPremiumWelcomeEmail(email, user.user_metadata?.ad || "Değerli Müşterimiz");
    } catch {
      // E-posta hatası premium atamasını engellemez
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

async function sendPremiumWelcomeEmail(email: string, name: string) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) return;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:32px 24px;text-align:center">
        <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);border-radius:16px;padding:12px;margin-bottom:16px">
          <span style="font-size:32px">👑</span>
        </div>
        <h1 style="color:#fff;margin:0;font-size:24px">Premium'a Hoş Geldiniz!</h1>
        <p style="color:#f59e0b;margin:8px 0 0;font-size:16px;font-weight:700">Tüm ayrıcalıklarınız aktif</p>
      </div>
      <div style="padding:24px">
        <p style="color:#333;margin:0 0 16px">Merhaba <strong>${name}</strong>,</p>
        <p style="color:#555;margin:0 0 24px;line-height:1.6">Fiyatcim Premium ailesine katıldığınız için teşekkür ederiz! Artık tüm premium ayrıcalıklardan yararlanabilirsiniz.</p>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:16px">
          <h3 style="color:#92400e;margin:0 0 12px;font-size:14px">Premium Ayrıcalıklarınız:</h3>
          <ul style="color:#78350f;margin:0;padding:0 0 0 16px;font-size:13px;line-height:2">
            <li>🔧 Ücretsiz Profesyonel Kurulum</li>
            <li>🚚 Tüm Siparişlerde Ücretsiz Kargo</li>
            <li>📺 1 Ay Netflix Hediye</li>
            <li>🎵 1 Ay Spotify Premium Hediye</li>
            <li>🛡️ +1 Yıl Uzatılmış Garanti</li>
            <li>📞 7/24 Öncelikli Destek Hattı</li>
            <li>⚡ Aynı Gün Kargo</li>
            <li>🔄 Yıllık Bakım Ziyareti</li>
          </ul>
        </div>

        <p style="color:#555;font-size:13px;margin:0 0 24px;line-height:1.5">
          Netflix ve Spotify hediye kodlarınız ayrı bir e-posta ile gönderilecektir.
          Kurulum hizmeti için sipariş sonrası ekibimiz sizinle iletişime geçecektir.
        </p>

        <a href="https://www.fiyatcim.com/urunler" style="display:block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;padding:14px;border-radius:8px;text-align:center;font-weight:700;font-size:16px">
          Alışverişe Başla
        </a>
      </div>
      <div style="background:#f8f8f8;padding:16px 24px;text-align:center">
        <p style="margin:0;font-size:11px;color:#888">Bu e-posta Fiyatcim.com Premium sistemi tarafından gönderilmiştir.</p>
      </div>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Fiyatcim Premium <noreply@fiyatcim.com>",
      to: email,
      subject: "👑 Premium'a Hoş Geldiniz! | Fiyatcim",
      html,
    }),
  });
}
