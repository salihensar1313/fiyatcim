import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/alerts — list user's active alerts
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_price_alerts")
    .select("id, product_id, alert_type, target_price, current_price_at_creation, is_triggered, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/alerts — create a new alert
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { productId, alertType, targetPrice, currentPrice } = body;

  if (!productId || !alertType) {
    return NextResponse.json({ error: "productId and alertType required" }, { status: 400 });
  }

  if (alertType === "price" && (!targetPrice || targetPrice <= 0)) {
    return NextResponse.json({ error: "Valid targetPrice required for price alerts" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_price_alerts")
    .upsert({
      user_id: user.id,
      product_id: productId,
      alert_type: alertType,
      target_price: alertType === "price" ? targetPrice : null,
      current_price_at_creation: currentPrice || null,
      email: user.email || "",
      is_triggered: false,
      is_active: true,
    }, { onConflict: "user_id,product_id,alert_type" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// DELETE /api/alerts — remove an alert
export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const alertType = searchParams.get("alertType");

  if (!productId || !alertType) {
    return NextResponse.json({ error: "productId and alertType required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_price_alerts")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("alert_type", alertType);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
