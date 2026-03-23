import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// In-memory rate limiter (per email)
const loginAttempts = new Map<
  string,
  { count: number; firstAttempt: number; locked: boolean; alertSent: boolean }
>();

const MAX_ATTEMPTS = 5; // email uyarisi gonderilecek esik
const LOCK_THRESHOLD = 10; // hesap kilitlenecek esik
const LOCK_DURATION = 15 * 60 * 1000; // 15 dakika
const WINDOW = 30 * 60 * 1000; // 30 dakikalik pencere

function getAttempts(email: string) {
  const now = Date.now();
  const entry = loginAttempts.get(email);

  // Pencere suresi dolmussa sifirla
  if (entry && now - entry.firstAttempt > WINDOW) {
    loginAttempts.delete(email);
    return null;
  }

  return entry || null;
}

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const entry = loginAttempts.get(email);

  if (!entry) {
    loginAttempts.set(email, {
      count: 1,
      firstAttempt: now,
      locked: false,
      alertSent: false,
    });
    return 1;
  }

  entry.count++;

  if (entry.count >= LOCK_THRESHOLD) {
    entry.locked = true;
  }

  return entry.count;
}

function clearAttempts(email: string) {
  loginAttempts.delete(email);
}

async function sendSecurityAlert(email: string, attemptCount: number, ip: string) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fiyatcim Guvenlik <guvenlik@fiyatcim.com>",
        to: email,
        subject: "Fiyatcim - Supheli Giris Denemesi",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc2626; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0; font-size: 18px;">Guvenlik Uyarisi</h2>
            </div>
            <div style="background: #1e293b; padding: 24px; border-radius: 0 0 8px 8px; color: #e2e8f0;">
              <p style="margin-top: 0;">Merhaba,</p>
              <p>Hesabiniza <strong>${attemptCount}</strong> basarisiz giris denemesi yapildi.</p>
              <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0; color: #94a3b8;">IP Adresi: <strong style="color: #f1f5f9;">${ip}</strong></p>
                <p style="margin: 4px 0; color: #94a3b8;">Tarih: <strong style="color: #f1f5f9;">${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</strong></p>
                <p style="margin: 4px 0; color: #94a3b8;">Deneme Sayisi: <strong style="color: #ef4444;">${attemptCount}</strong></p>
              </div>
              ${attemptCount >= LOCK_THRESHOLD
                ? `<p style="color: #ef4444; font-weight: bold;">Hesabiniz guvenlik nedeniyle 15 dakika sureyle kilitlendi.</p>`
                : `<p>Eger bu giris denemelerini siz yapmadiyseniz, sifrenizi hemen degistirmenizi oneririz.</p>`
              }
              <a href="https://www.fiyatcim.com/sifremi-unuttum" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 12px; font-weight: bold;">
                Sifremi Sifirla
              </a>
              <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                Bu email Fiyatcim.com guvenlik sistemi tarafindan otomatik gonderilmistir.
              </p>
            </div>
          </div>
        `,
      }),
    });
  } catch (e) {
    console.warn("[security] Failed to send alert email:", e);
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Gecersiz istek formati." },
        { status: 400 }
      );
    }
    const email = (String(body.email || "")).trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve sifre gerekli." },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "bilinmiyor";

    // Hesap kilitli mi kontrol et
    const attempts = getAttempts(email);
    if (attempts?.locked) {
      const elapsed = Date.now() - attempts.firstAttempt;
      const remaining = Math.ceil(
        (LOCK_DURATION - (elapsed % LOCK_DURATION)) / 60000
      );

      if (elapsed < LOCK_DURATION + WINDOW) {
        return NextResponse.json(
          {
            error: `Cok fazla basarisiz deneme. Hesabiniz ${remaining} dakika sureyle kilitlendi.`,
            locked: true,
            remainingMinutes: remaining,
          },
          { status: 429 }
        );
      } else {
        // Kilit suresi doldu, sifirla
        clearAttempts(email);
      }
    }

    // Supabase Auth ile giris yap
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Basarisiz deneme kaydet
      const count = recordFailedAttempt(email);
      const entry = getAttempts(email);

      // 5. denemede email uyarisi gonder
      if (count === MAX_ATTEMPTS && entry && !entry.alertSent) {
        entry.alertSent = true;
        sendSecurityAlert(email, count, ip); // fire-and-forget
      }

      // 10. denemede tekrar email + kilit bilgisi
      if (count === LOCK_THRESHOLD) {
        sendSecurityAlert(email, count, ip);
      }

      // Kilit mesaji
      if (count >= LOCK_THRESHOLD) {
        return NextResponse.json(
          {
            error: `Cok fazla basarisiz deneme. Hesabiniz 15 dakika sureyle kilitlendi.`,
            locked: true,
            remainingMinutes: 15,
          },
          { status: 429 }
        );
      }

      // Normal hata
      const remaining = LOCK_THRESHOLD - count;
      return NextResponse.json(
        {
          error:
            remaining <= 3
              ? `Yanlis sifre. ${remaining} deneme hakkiniz kaldi.`
              : "Gecersiz e-posta veya sifre.",
          attemptsRemaining: remaining,
        },
        { status: 401 }
      );
    }

    // Basarili giris — sayaci sifirla
    clearAttempts(email);

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
      },
    });
  } catch (e) {
    console.error("[auth/login] Error:", e);
    return NextResponse.json(
      { error: "Sunucu hatasi. Lutfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
