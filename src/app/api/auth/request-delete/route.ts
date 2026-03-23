import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { accountDeletionEmail } from "@/lib/email-templates";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/request-delete
 *
 * Hesap silme talebi oluşturur ve onay e-postası gönderir.
 * Hesap yalnızca e-postadaki linke tıklanarak silinebilir.
 */
export async function POST() {
  try {
    // Kullanıcıyı session'dan al
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Kullanıcı profil bilgisini al (isim için)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("ad, soyad")
      .eq("user_id", user.id)
      .single();

    const userName = profile ? `${profile.ad} ${profile.soyad}`.trim() : "Kullanıcı";

    // Mevcut aktif token var mı kontrol et (spam önleme)
    const { data: existingTokens } = await adminClient
      .from("account_deletion_tokens")
      .select("id, created_at")
      .eq("user_id", user.id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingTokens && existingTokens.length > 0) {
      const lastCreated = new Date(existingTokens[0].created_at);
      const cooldownMs = 5 * 60 * 1000; // 5 dakika
      if (Date.now() - lastCreated.getTime() < cooldownMs) {
        return NextResponse.json(
          { error: "Az önce bir silme talebi gönderildi. Lütfen e-postanızı kontrol edin." },
          { status: 429 }
        );
      }
    }

    // Token oluştur
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat

    // Token'ı DB'ye kaydet
    const { error: insertError } = await adminClient
      .from("account_deletion_tokens")
      .insert({
        user_id: user.id,
        token,
        email: user.email,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[request-delete] Token insert error:", insertError.message);
      return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
    }

    // Onay e-postası gönder
    const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.fiyatcim.com"}/auth/delete-confirm?token=${token}`;
    const emailHtml = accountDeletionEmail(userName, confirmUrl);

    const emailResult = await sendEmail({
      to: user.email!,
      subject: "Hesap Silme Onayı | Fiyatcim",
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error("[request-delete] Email send error:", emailResult.error);
      return NextResponse.json({ error: "E-posta gönderilemedi. Lütfen tekrar deneyin." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Hesap silme onay e-postası gönderildi. Lütfen e-postanızı kontrol edin.",
    });
  } catch (err) {
    console.error("[request-delete] Error:", err);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
