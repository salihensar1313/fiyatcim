import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateInvoiceHTML } from "@/lib/invoice-generator";

/**
 * GET /api/invoice/download?orderId=xxx
 *
 * Siparis ID'sine gore fatura HTML'i uretir.
 * Browser'da acildiginda yazdirilabilir format gosterir.
 * Kullanici window.print() ile PDF olarak kaydedebilir.
 *
 * Guvenlik: Kullanicinin kendi siparisini gormesi icin auth kontrolu yapar.
 * Admin kullanicilar tum faturalari gorebilir.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json(
      { error: "Siparis ID'si gerekli" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Kullanici auth kontrolu
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Bu islemi gerceklestirmek icin giris yapmaniz gerekiyor" },
        { status: 401 }
      );
    }

    // Siparisi cek
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Siparis bulunamadi" },
        { status: 404 }
      );
    }

    // Yetki kontrolu: kullanicinin kendi siparisi mi?
    // Admin profili kontrolu
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    const isOwner = order.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Bu faturaya erisim yetkiniz yok" },
        { status: 403 }
      );
    }

    // Fatura HTML'i uret
    const html = generateInvoiceHTML({
      order,
      items: order.order_items || [],
      invoiceInfo: order.invoice_info,
      billingAddress: order.billing_address,
      shippingAddress: order.shipping_address,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("[Invoice Download] Hata:", err);
    return NextResponse.json(
      { error: "Fatura olusturulamadi" },
      { status: 500 }
    );
  }
}
