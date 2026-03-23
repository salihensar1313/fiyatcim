import { NextRequest, NextResponse } from "next/server";
import { getCouponByCode } from "@/lib/queries";

/**
 * POST /api/coupons/validate
 *
 * Server-side kupon doğrulama endpoint'i.
 * Client-side kupon katalog/doğrulama mantığı yerine kullanılır.
 *
 * GÜVENLIK: Kupon doğrulama tamamen server-side yapılır.
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal } = body as { code?: string; cartTotal?: number };

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ valid: false, error: "Kupon kodu gereklidir." }, { status: 400 });
    }

    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json({ valid: false, error: "Gecersiz sepet tutari." }, { status: 400 });
    }

    // TODO: Kullanıcı başına kupon limiti için userId alınacak (coupon_usages tablosu gelince)

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

    // TODO: Kullanıcı başına kupon kullanım kontrolü (DB tabanlı)
    // if (userId) { ... check coupon_usages table ... }

    // Kupon geçerli — sadece indirim bilgisini dön, kupon detaylarını client'a gösterme
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
