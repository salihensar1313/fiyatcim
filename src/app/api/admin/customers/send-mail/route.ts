import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/customers/send-mail
 * Body: { emails: string[], subject: string, html: string }
 * Seçili müşterilere toplu mail gönder
 */
export async function POST(request: NextRequest) {
  try {
    const { emails, subject, html } = await request.json();

    if (!emails?.length || !subject || !html) {
      return NextResponse.json({ error: "emails, subject ve html zorunlu" }, { status: 400 });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY eksik" }, { status: 500 });
    }

    let sent = 0;
    let failed = 0;

    // Batch 50, rate limit
    const BATCH_SIZE = 50;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((to: string) =>
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Fiyatcim <noreply@fiyatcim.com>",
              to,
              subject,
              html,
            }),
          }).then((r) => {
            if (r.ok) return "ok";
            throw new Error(`${r.status}`);
          })
        )
      );

      sent += results.filter((r) => r.status === "fulfilled").length;
      failed += results.filter((r) => r.status === "rejected").length;

      if (i + BATCH_SIZE < emails.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: emails.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
