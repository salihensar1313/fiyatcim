import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/mfa — MFA işlemleri
 *
 * action: "enroll" | "verify" | "unenroll" | "challenge"
 *
 * enroll: TOTP QR kodu oluştur
 * verify: TOTP kodunu doğrula ve faktörü aktifleştir
 * challenge: Giriş sırasında MFA challenge oluştur
 * unenroll: MFA'yı kaldır
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, accessToken, factorId, code, challengeId } = body as {
      action: string;
      accessToken?: string;
      factorId?: string;
      code?: string;
      challengeId?: string;
    };

    if (!accessToken) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    // User's own supabase client (with their token)
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    switch (action) {
      case "enroll": {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Fiyatcim Authenticator",
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        });
      }

      case "verify": {
        if (!factorId || !code) {
          return NextResponse.json({ error: "factorId ve code gerekli." }, { status: 400 });
        }

        // Create challenge
        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
          factorId,
        });
        if (challengeErr) return NextResponse.json({ error: challengeErr.message }, { status: 400 });

        // Verify with the code
        const { data: verifyData, error: verifyErr } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.id,
          code,
        });
        if (verifyErr) return NextResponse.json({ error: verifyErr.message }, { status: 400 });

        return NextResponse.json({ success: true, session: verifyData });
      }

      case "challenge": {
        if (!factorId) {
          return NextResponse.json({ error: "factorId gerekli." }, { status: 400 });
        }
        const { data, error } = await supabase.auth.mfa.challenge({ factorId });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ challengeId: data.id });
      }

      case "verify-challenge": {
        if (!factorId || !challengeId || !code) {
          return NextResponse.json({ error: "factorId, challengeId ve code gerekli." }, { status: 400 });
        }
        const { data, error } = await supabase.auth.mfa.verify({
          factorId,
          challengeId,
          code,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, session: data });
      }

      case "unenroll": {
        if (!factorId) {
          return NextResponse.json({ error: "factorId gerekli." }, { status: 400 });
        }
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true });
      }

      case "list": {
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({
          factors: data.totp.map(f => ({
            id: f.id,
            friendlyName: f.friendly_name,
            status: f.status,
            createdAt: f.created_at,
          })),
        });
      }

      default:
        return NextResponse.json({ error: "Geçersiz action." }, { status: 400 });
    }
  } catch (err) {
    console.error("[auth/mfa] Error:", err);
    return NextResponse.json({ error: "MFA işlemi başarısız." }, { status: 500 });
  }
}
