import { NextRequest, NextResponse } from "next/server";
import { isParasutConfigured, createContact, createSalesInvoice, convertToEInvoice } from "@/lib/parasut";
import type { InvoiceInfo, Address, OrderItem } from "@/types";
import { logger } from "@/lib/logger";

/**
 * POST /api/invoice/create
 *
 * Sipariş tamamlandıktan sonra Paraşüt üzerinden e-fatura oluşturur.
 * Şu an iskelet — API key eklendiğinde aktif olacak.
 *
 * Body: { orderId, invoiceInfo, address, items }
 */

interface CreateInvoiceBody {
  orderId: string;
  invoiceInfo: InvoiceInfo;
  address: Address;
  items: OrderItem[];
}

export async function POST(request: NextRequest) {
  // Origin kontrolü
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı" }, { status: 403 });
  }

  if (!isParasutConfigured()) {
    return NextResponse.json(
      { error: "Paraşüt API yapılandırılmamış. .env dosyasına PARASUT_* değişkenlerini ekleyin." },
      { status: 503 }
    );
  }

  try {
    const body: CreateInvoiceBody = await request.json();
    const { orderId, invoiceInfo, address, items } = body;

    if (!orderId || !invoiceInfo || !address || !items?.length) {
      return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
    }

    if (!invoiceInfo.wantsInvoice) {
      return NextResponse.json({ error: "Fatura talebi yok" }, { status: 400 });
    }

    // 1. Paraşüt'te müşteri oluştur
    const contact = await createContact(invoiceInfo, address);

    // 2. Satış faturası oluştur
    const salesInvoiceId = await createSalesInvoice(contact.id, items, orderId);

    // 3. E-fatura / e-arşiv olarak gönder
    await convertToEInvoice(salesInvoiceId);

    return NextResponse.json({
      success: true,
      contactId: contact.id,
      salesInvoiceId,
    });
  } catch (err) {
    logger.error("invoice_create_failed", { fn: "POST", error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fatura oluşturulamadı" },
      { status: 500 }
    );
  }
}
