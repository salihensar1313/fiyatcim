import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, orderShippedEmail, orderDeliveredEmail, orderCancelledEmail, orderRefundedEmail } from "@/lib/email-templates";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/* ─── In-memory rate limiter (per IP + per recipient) ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX_IP = 5; // max 5 requests per minute per IP
const RATE_LIMIT_MAX_RECIPIENT = 3; // max 3 emails per minute per recipient

let lastCleanup = Date.now();

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();

  // Lazy cleanup: purge stale entries every 5 minutes (serverless-safe, no setInterval)
  if (now - lastCleanup > 5 * 60_000) {
    lastCleanup = now;
    rateLimitMap.forEach((entry, k) => {
      if (now > entry.resetAt) rateLimitMap.delete(k);
    });
  }

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > max;
}

const emailRequestSchema = z.object({
  type: z.enum(["order_confirmation", "order_shipped", "order_delivered", "order_cancelled", "order_refunded"]),
  to: z.string().email("Geçerli bir e-posta adresi gerekli"),
  data: z.record(z.string(), z.unknown()).refine((d) => typeof d.orderNo === "string", {
    message: "data.orderNo gerekli",
  }),
});

export async function POST(request: NextRequest) {
  try {
    // ─── Origin validation (CSRF protection) ───
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).hostname;
        const expectedHost = host.split(":")[0]; // strip port
        if (originHost !== expectedHost) {
          return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
      }
    }

    // ─── Authentication check ───
    const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    if (!IS_DEMO) {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Oturum açmanız gerekli." }, { status: 401 });
      }
    }

    // ─── Rate limiting (IP-based) ───
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(`ip:${ip}`, RATE_LIMIT_MAX_IP)) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
    }

    const body = await request.json();

    const parsed = emailRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz istek" }, { status: 400 });
    }

    const { type, data, to } = parsed.data;

    // ─── Rate limiting (per-recipient) ───
    if (isRateLimited(`to:${to}`, RATE_LIMIT_MAX_RECIPIENT)) {
      return NextResponse.json({ error: "Bu adrese çok fazla e-posta gönderildi." }, { status: 429 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailData = data as any;

    // Sanitize orderNo for subject line (strip control chars & limit length)
    const safeOrderNo = String(emailData.orderNo || "").replace(/[\x00-\x1f\x7f]/g, "").slice(0, 30);

    let subject = "";
    let html = "";

    switch (type) {
      case "order_confirmation":
        subject = `Sipariş Onayı - ${safeOrderNo} | Fiyatcim`;
        html = orderConfirmationEmail(emailData);
        break;
      case "order_shipped":
        subject = `Siparişiniz Kargoya Verildi - ${safeOrderNo} | Fiyatcim`;
        html = orderShippedEmail(emailData);
        break;
      case "order_delivered":
        subject = `Siparişiniz Teslim Edildi - ${safeOrderNo} | Fiyatcim`;
        html = orderDeliveredEmail(emailData);
        break;
      case "order_cancelled":
        subject = `Siparişiniz İptal Edildi - ${safeOrderNo} | Fiyatcim`;
        html = orderCancelledEmail(emailData);
        break;
      case "order_refunded":
        subject = `İade İşleminiz Tamamlandı - ${safeOrderNo} | Fiyatcim`;
        html = orderRefundedEmail(emailData);
        break;
    }

    const result = await sendEmail({ to, subject, html });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    console.error("[API/email] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
