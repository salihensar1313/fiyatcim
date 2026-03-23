/**
 * Paraşüt e-Fatura API İstemcisi
 *
 * Paraşüt API entegrasyonu için temel iskelet.
 * API key ve client credentials .env'den okunur.
 *
 * Docs: https://apidocs.parasut.com/
 */

import type { InvoiceInfo, Address, OrderItem } from "@/types";

// ==========================================
// CONFIG
// ==========================================

const PARASUT_API_URL = process.env.PARASUT_API_URL || "https://api.parasut.com/v4";
const PARASUT_COMPANY_ID = process.env.PARASUT_COMPANY_ID || "";
const PARASUT_CLIENT_ID = process.env.PARASUT_CLIENT_ID || "";
const PARASUT_CLIENT_SECRET = process.env.PARASUT_CLIENT_SECRET || "";
const PARASUT_USERNAME = process.env.PARASUT_USERNAME || "";
const PARASUT_PASSWORD = process.env.PARASUT_PASSWORD || "";

// ==========================================
// TYPES
// ==========================================

interface ParasutTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  created_at: number;
}

interface ParasutContact {
  id: string;
  type: "contacts";
  attributes: {
    name: string;
    tax_number?: string;
    tax_office?: string;
    contact_type: "person" | "company";
    city?: string;
    district?: string;
    address?: string;
  };
}

interface ParasutInvoiceItem {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: string;
  vat_rate: string;
}

// ==========================================
// AUTH — OAuth2 Resource Owner Password
// ==========================================

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const res = await fetch("https://api.parasut.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "password",
      client_id: PARASUT_CLIENT_ID,
      client_secret: PARASUT_CLIENT_SECRET,
      username: PARASUT_USERNAME,
      password: PARASUT_PASSWORD,
      redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paraşüt OAuth hatası: ${res.status} — ${err}`);
  }

  const data: ParasutTokenResponse = await res.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: (data.created_at + data.expires_in) * 1000,
  };

  return data.access_token;
}

// ==========================================
// CONTACTS — Müşteri Oluştur / Güncelle
// ==========================================

export async function createContact(
  invoiceInfo: InvoiceInfo,
  address: Address
): Promise<ParasutContact> {
  const token = await getAccessToken();

  const isCompany = invoiceInfo.invoiceType === "kurumsal";

  const attributes: Record<string, unknown> = {
    name: isCompany ? invoiceInfo.companyName : invoiceInfo.fullName,
    contact_type: isCompany ? "company" : "person",
    tax_office: isCompany ? invoiceInfo.taxOffice : undefined,
    tax_number: isCompany ? invoiceInfo.taxNumber : invoiceInfo.tcKimlik,
    city: address.il,
    district: address.ilce,
    address: address.adres,
    phone: address.telefon,
  };

  const res = await fetch(`${PARASUT_API_URL}/${PARASUT_COMPANY_ID}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        type: "contacts",
        attributes,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paraşüt müşteri oluşturma hatası: ${res.status} — ${err}`);
  }

  const json = await res.json();
  return json.data as ParasutContact;
}

// ==========================================
// E-FATURA — Satış Faturası Oluştur
// ==========================================

export async function createSalesInvoice(
  contactId: string,
  orderItems: OrderItem[],
  orderId: string
): Promise<string> {
  const token = await getAccessToken();

  const items: ParasutInvoiceItem[] = orderItems.map((item) => ({
    name: item.name_snapshot,
    quantity: item.qty,
    unit_price: String(
      ((item.sale_price_snapshot || item.price_snapshot) / (1 + item.tax_rate_snapshot / 100)).toFixed(2)
    ),
    vat_rate: String(item.tax_rate_snapshot),
  }));

  const res = await fetch(`${PARASUT_API_URL}/${PARASUT_COMPANY_ID}/sales_invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        type: "sales_invoices",
        attributes: {
          item_type: "invoice",
          description: `Sipariş #${orderId}`,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date().toISOString().split("T")[0],
          invoice_series: "FC",
          currency: "TRL",
        },
        relationships: {
          contact: {
            data: {
              id: contactId,
              type: "contacts",
            },
          },
          details: {
            data: items.map((_, i) => ({
              type: "sales_invoice_details",
              attributes: items[i],
            })),
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paraşüt fatura oluşturma hatası: ${res.status} — ${err}`);
  }

  const json = await res.json();
  return json.data.id as string;
}

// ==========================================
// E-FATURA — E-Arşiv / E-Fatura Gönder
// ==========================================

export async function convertToEInvoice(salesInvoiceId: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PARASUT_API_URL}/${PARASUT_COMPANY_ID}/e_invoices`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        data: {
          type: "e_invoices",
          relationships: {
            invoice: {
              data: {
                id: salesInvoiceId,
                type: "sales_invoices",
              },
            },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paraşüt e-fatura dönüştürme hatası: ${res.status} — ${err}`);
  }
}

// ==========================================
// HELPER — Yapılandırma kontrolü
// ==========================================

export function isParasutConfigured(): boolean {
  return !!(PARASUT_COMPANY_ID && PARASUT_CLIENT_ID && PARASUT_CLIENT_SECRET && PARASUT_USERNAME && PARASUT_PASSWORD);
}
