import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/sms";

/**
 * POST /api/auth/verify-otp
 *
 * Telefon numarasina gonderilen OTP kodunu dogrular.
 * Body: { phone: string, code: string }
 *
 * Basarili: { success: true, verified: true }
 * Hatali kod: { success: true, verified: false }
 * Hata: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code } = body as { phone?: string; code?: string };

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Gecerli bir telefon numarasi giriniz" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "6 haneli dogrulama kodunu giriniz" },
        { status: 400 }
      );
    }

    const verified = await verifyOTP(phone, code);

    return NextResponse.json({ success: true, verified });
  } catch (err) {
    console.error("[verify-otp] Hata:", err);
    return NextResponse.json(
      { success: false, error: "Beklenmedik bir hata olustu" },
      { status: 500 }
    );
  }
}
