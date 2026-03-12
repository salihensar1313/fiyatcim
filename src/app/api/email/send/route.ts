import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, orderShippedEmail } from "@/lib/email-templates";

/* ─── Simple in-memory rate limiter ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const emailRequestSchema = z.object({
  type: z.enum(["order_confirmation", "order_shipped"]),
  to: z.string().email("Geçerli bir e-posta adresi gerekli"),
  data: z.record(z.string(), z.unknown()).refine((d) => typeof d.orderNo === "string", {
    message: "data.orderNo gerekli",
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
    }

    const body = await request.json();

    const parsed = emailRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz istek" }, { status: 400 });
    }

    const { type, data, to } = parsed.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emailData = data as any;

    let subject = "";
    let html = "";

    switch (type) {
      case "order_confirmation":
        subject = `Sipariş Onayı - ${emailData.orderNo} | Fiyatcim`;
        html = orderConfirmationEmail(emailData);
        break;
      case "order_shipped":
        subject = `Siparişiniz Kargoya Verildi - ${emailData.orderNo} | Fiyatcim`;
        html = orderShippedEmail(emailData);
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
