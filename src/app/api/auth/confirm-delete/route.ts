import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/confirm-delete
 *
 * E-postadaki token ile hesap silme işlemini gerçekleştirir.
 * Body: { token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token?: string };

    if (!token || typeof token !== "string" || token.length < 32) {
      return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Token'ı bul ve doğrula
    const { data: tokenRecord, error: tokenError } = await adminClient
      .from("account_deletion_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
    }

    // Süre kontrolü
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: "Bu bağlantının süresi dolmuş. Lütfen yeni bir silme talebi oluşturun." }, { status: 400 });
    }

    // Zaten kullanılmış mı
    if (tokenRecord.used_at) {
      return NextResponse.json({ error: "Bu bağlantı zaten kullanılmış." }, { status: 400 });
    }

    const userId = tokenRecord.user_id;

    // Token'ı kullanıldı olarak işaretle
    await adminClient
      .from("account_deletion_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenRecord.id);

    // İlgili verileri sil
    // 1. Fiyat alarmları
    await adminClient.from("user_price_alerts").delete().eq("user_id", userId);

    // 2. Adresler
    await adminClient.from("addresses").delete().eq("user_id", userId);

    // 3. Sepet
    await adminClient.from("user_carts").delete().eq("user_id", userId);

    // 4. Reviewlar (soft delete — anonim yap)
    await adminClient.from("reviews").update({ user_id: null }).eq("user_id", userId);

    // 5. Silme token'larını temizle
    await adminClient.from("account_deletion_tokens").delete().eq("user_id", userId);

    // 6. Profil sil
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // 7. Auth kullanıcısını sil
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[confirm-delete] User delete error:", deleteError.message);
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen destek ile iletişime geçin." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Hesabınız başarıyla silindi.",
    });
  } catch (err) {
    console.error("[confirm-delete] Error:", err);
    return NextResponse.json({ error: "Bir hata oluştu." }, { status: 500 });
  }
}
