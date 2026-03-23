import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Rate limiter — max 5 requests per IP per 5 minutes
const trackAttempts = new Map<string, { count: number; firstAt: number }>();
const TRACK_MAX = 5;
const TRACK_WINDOW = 5 * 60 * 1000;

function checkTrackRate(ip: string): boolean {
  const now = Date.now();
  const entry = trackAttempts.get(ip);

  if (!entry || now - entry.firstAt > TRACK_WINDOW) {
    trackAttempts.set(ip, { count: 1, firstAt: now });
    return false;
  }

  entry.count++;
  return entry.count > TRACK_MAX;
}

/**
 * POST /api/orders/track
 * Guest order tracking — looks up order by order_no + email.
 * Rate limited: 5 requests per IP per 5 minutes.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (checkTrackRate(ip)) {
      return NextResponse.json(
        { error: "Cok fazla istek. Lutfen 5 dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Gecersiz istek formati." },
        { status: 400 }
      );
    }
    const orderNo = (String(body.orderNo || "")).trim();
    const email = (String(body.email || "")).trim().toLowerCase();

    if (!orderNo || !email) {
      return NextResponse.json(
        { error: "Siparis numarasi ve e-posta adresi zorunludur." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*), order_status_logs(*)")
      .eq("order_no", orderNo)
      .eq("customer_email", email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error:
            "Siparis bulunamadi. Lutfen siparis numaranizi ve e-posta adresinizi kontrol ediniz.",
        },
        { status: 404 }
      );
    }

    // Return sanitized order data (no shipping_address to prevent data leak)
    return NextResponse.json({
      order: {
        order_no: data.order_no,
        status: data.status,
        payment_status: data.payment_status,
        total: data.total,
        shipping_company: data.shipping_company,
        tracking_no: data.tracking_no,
        created_at: data.created_at,
        items: (data.order_items || []).map((item: Record<string, unknown>) => ({
          name_snapshot: item.name_snapshot,
          qty: item.qty,
          price_snapshot: item.price_snapshot,
          image_snapshot: item.image_snapshot,
        })),
        status_logs: data.order_status_logs || [],
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Bir hata olustu. Lutfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
