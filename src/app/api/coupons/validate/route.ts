import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCouponByCode } from "@/lib/queries";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/coupons/validate
 *
 * Server-side kupon doğrulama endpoint'i.
 * Kullanıcı başına kupon kullanım sınırı — userId server-side auth'tan alınır.
 *
 * GÜVENLIK: Kupon doğrulama tamamen server-side yapılır.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body as { code?: string; cartTotal?: number };

    // Get userId from server-side auth (NOT from client body)
    let userId: string | null = null;
    try {
      const authClient = await createServerSupabaseClient();
      const { data: { user } } = await authClient.auth.getUser();
      userId = user?.id ?? null;
    } catch { /* guest user — no userId */ }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ valid: false, error: "Kupon kodu gereklidir." }, { status: 400 });
    }

    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json({ valid: false, error: "Gecersiz sepet tutari." }, { status: 400 });
    }

    // DB'den kupon al
    const coupon = await getCouponByCode(code.trim().toUpperCase());

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Kupon bulunamadi." });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: "Bu kupon artik aktif degil." });
    }

    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return NextResponse.json({ valid: false, error: "Kupon suresi dolmus." });
    }

    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: "Kupon kullanim limiti dolmus." });
    }

    if (cartTotal < coupon.min_cart) {
      return NextResponse.json({
        valid: false,
        error: `Minimum sepet tutari ${coupon.min_cart}₺ olmalidir.`,
      });
    }

    // Kullanıcı başına kupon kullanım kontrolü — orders tablosundan
    if (userId) {
      const { count } = await supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("coupon_code", code.trim().toUpperCase())
        .neq("status", "cancelled");

      if (count && count > 0) {
        return NextResponse.json({
          valid: false,
          error: "Bu kuponu daha once kullandiniz.",
        });
      }
    }

    // Kupon geçerli — sadece indirim bilgisini dön
    const discount = coupon.type === "percent"
      ? Math.round(cartTotal * (coupon.value / 100) * 100) / 100
      : coupon.value;

    return NextResponse.json({
      valid: true,
      discount,
      couponId: coupon.id,
      type: coupon.type,
      value: coupon.value,
    });
  } catch (err) {
    console.error("[coupons/validate] Error:", err);
    return NextResponse.json({ valid: false, error: "Kupon dogrulanamadi." }, { status: 500 });
  }
}
