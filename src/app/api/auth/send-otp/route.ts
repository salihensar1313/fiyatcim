import { NextRequest, NextResponse } from "next/server";
import { sendOTP, hasActiveOTP } from "@/lib/sms";

/**
 * POST /api/auth/send-otp
 *
 * Telefon numarasina OTP kodu gonderir.
 * Body: { phone: string }
 *
 * Basarili: { success: true, code?: string }
 *   - code yalnizca mock modda doner (test icin)
 *
 * Hata: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body as { phone?: string };

    if (!phone || typeof phone !== "string" || phone.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Gecerli bir telefon numarasi giriniz" },
        { status: 400 }
      );
    }

    // Cooldown kontrolu — ayni numaraya cok sik gonderimi engelle
    if (hasActiveOTP(phone)) {
      return NextResponse.json(
        { success: false, error: "Zaten aktif bir dogrulama kodunuz var. Lutfen bekleyin." },
        { status: 429 }
      );
    }

    const result = await sendOTP(phone);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "SMS gonderilemedi" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      // Mock modda test icin kodu dondur
      ...(result.code ? { code: result.code } : {}),
    });
  } catch (err) {
    console.error("[send-otp] Hata:", err);
    return NextResponse.json(
      { success: false, error: "Beklenmedik bir hata olustu" },
      { status: 500 }
    );
  }
}
