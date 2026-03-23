import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/sms";

// Rate limiter — max 5 attempts per phone per 5 minutes
const otpAttempts = new Map<string, { count: number; firstAt: number }>();
const OTP_MAX = 5;
const OTP_WINDOW = 5 * 60 * 1000;

function checkOtpRate(phone: string): boolean {
  const now = Date.now();
  const entry = otpAttempts.get(phone);

  if (!entry || now - entry.firstAt > OTP_WINDOW) {
    otpAttempts.set(phone, { count: 1, firstAt: now });
    return false; // not limited
  }

  entry.count++;
  return entry.count > OTP_MAX;
}

/**
 * POST /api/auth/verify-otp
 *
 * Telefon numarasina gonderilen OTP kodunu dogrular.
 * Body: { phone: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Gecersiz istek formati." },
        { status: 400 }
      );
    }
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

    // Rate limit check
    if (checkOtpRate(phone.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Cok fazla deneme yapildi. 5 dakika sonra tekrar deneyin.",
        },
        { status: 429 }
      );
    }

    const verified = await verifyOTP(phone, code);

    // Basarili dogrulamada sayaci sifirla
    if (verified) {
      otpAttempts.delete(phone.trim());
    }

    return NextResponse.json({ success: true, verified });
  } catch (err) {
    console.error("[verify-otp] Hata:", err);
    return NextResponse.json(
      { success: false, error: "Beklenmedik bir hata olustu" },
      { status: 500 }
    );
  }
}
