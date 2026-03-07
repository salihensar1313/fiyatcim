import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail, orderShippedEmail } from "@/lib/email-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, to } = body;

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let subject = "";
    let html = "";

    switch (type) {
      case "order_confirmation":
        subject = `Sipariş Onayı - ${data.orderNo} | Fiyatcim`;
        html = orderConfirmationEmail(data);
        break;
      case "order_shipped":
        subject = `Siparişiniz Kargoya Verildi - ${data.orderNo} | Fiyatcim`;
        html = orderShippedEmail(data);
        break;
      default:
        return NextResponse.json({ error: "Unknown email type" }, { status: 400 });
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
