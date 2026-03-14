import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/orders/track
 * Guest order tracking — looks up order by order_no + email.
 * No auth required. Rate limiting via simple IP check could be added later.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderNo = (body.orderNo || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!orderNo || !email) {
      return NextResponse.json(
        { error: "Sipariş numarası ve e-posta adresi zorunludur." },
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
        { error: "Sipariş bulunamadı. Lütfen sipariş numaranızı ve e-posta adresinizi kontrol ediniz." },
        { status: 404 }
      );
    }

    // Return sanitized order data (no internal IDs exposed beyond what's needed)
    return NextResponse.json({
      order: {
        order_no: data.order_no,
        status: data.status,
        payment_status: data.payment_status,
        subtotal: data.subtotal,
        shipping: data.shipping,
        discount: data.discount,
        total: data.total,
        shipping_address: data.shipping_address,
        shipping_company: data.shipping_company,
        tracking_no: data.tracking_no,
        created_at: data.created_at,
        items: data.order_items || [],
        status_logs: data.order_status_logs || [],
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
