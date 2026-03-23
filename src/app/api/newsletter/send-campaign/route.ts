import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * POST /api/newsletter/send-campaign
 * Admin-only: Tüm aktif abonelere kampanya maili gönder
 * Body: { subject, html, testOnly?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { subject, html, testOnly } = await request.json();

    if (!subject || !html) {
      return NextResponse.json({ error: "subject ve html zorunlu" }, { status: 400 });
    }

    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) {
      return NextResponse.json({ error: "RESEND_API_KEY eksik" }, { status: 500 });
    }

    const supabase = createServiceClient();

    // Aktif aboneleri çek
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true)
      .order("subscribed_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const emails = subscribers?.map((s) => s.email) || [];

    if (emails.length === 0) {
      return NextResponse.json({ error: "Aktif abone bulunamadı" }, { status: 404 });
    }

    // Test modu: sadece ilk 1 kişiye gönder
    const targets = testOnly ? emails.slice(0, 1) : emails;

    let sent = 0;
    let failed = 0;

    // Resend batch: max 100 kişi per request, 2/sn rate limit
    const BATCH_SIZE = 50;
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
      const batch = targets.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((to) =>
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

      // Rate limit: 150ms bekle
      if (i + BATCH_SIZE < targets.length) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    return NextResponse.json({
      success: true,
      total: targets.length,
      sent,
      failed,
      testOnly: !!testOnly,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
