import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { CONTACT } from "@/lib/constants";

/* ─── Simple in-memory rate limiter ─── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const contactSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalı").max(100),
  email: z.string().email("Geçerli bir e-posta adresi gerekli"),
  phone: z.string().max(20).optional().default(""),
  subject: z.string().max(50).optional().default("Genel"),
  message: z.string().min(10, "Mesajınız en az 10 karakter olmalı").max(2000),
});

const SUBJECT_LABELS: Record<string, string> = {
  satis: "Satış / Sipariş",
  destek: "Teknik Destek",
  iade: "İade & Değişim",
  isbirligi: "İş Birliği",
  diger: "Diğer",
};

export async function POST(request: NextRequest) {
  try {
    // CSRF: origin check
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).hostname;
        const expectedHost = host.split(":")[0];
        if (originHost !== expectedHost) {
          return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
      }
    }

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`contact:${ip}`)) {
      return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz bekleyin." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz istek" }, { status: 400 });
    }

    const { name, email, phone, subject, message } = parsed.data;
    const subjectLabel = SUBJECT_LABELS[subject] || subject || "Genel";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">
          Yeni İletişim Formu — ${subjectLabel}
        </h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">Ad Soyad:</td><td>${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">E-posta:</td><td><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; font-weight: bold;">Telefon:</td><td>${escapeHtml(phone)}</td></tr>` : ""}
          <tr><td style="padding: 8px 0; font-weight: bold;">Konu:</td><td>${escapeHtml(subjectLabel)}</td></tr>
        </table>
        <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-weight: bold; margin-bottom: 8px;">Mesaj:</p>
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
        <p style="margin-top: 16px; font-size: 12px; color: #64748b;">
          Bu e-posta fiyatcim.com iletişim formundan gönderilmiştir.
        </p>
      </div>
    `;

    const result = await sendEmail({
      to: CONTACT.email,
      subject: `[İletişim] ${subjectLabel} — ${name} | Fiyatcim`,
      html,
    });

    if (!result.success) {
      console.error("[Contact] Email send failed:", result.error);
      return NextResponse.json({ error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact] Error:", err);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
