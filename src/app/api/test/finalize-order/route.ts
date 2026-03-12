import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// DEV-ONLY: Test endpoint to simulate payment finalization
// Calls finalize_paid_order RPC which deducts stock and confirms order

const requestSchema = z.object({
  order_id: z.string().min(1, "order_id gerekli"),
  action: z.enum(["paid", "refund"]).optional().default("paid"),
});

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Geçersiz istek" }, { status: 400 });
  }

  const { order_id, action } = parsed.data;

  const supabase = await createServerSupabaseClient();

  if (action === "refund") {
    // Refund: restore stock
    const { error } = await supabase.rpc("finalize_refund_order", {
      p_order_id: order_id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: "refund", order_id });
  }

  // Default: finalize payment
  const paymentRef = `TEST-${Date.now().toString(36).toUpperCase()}`;
  const { error } = await supabase.rpc("finalize_paid_order", {
    p_order_id: order_id,
    p_payment_ref: paymentRef,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, action: "paid", order_id, payment_ref: paymentRef });
}
