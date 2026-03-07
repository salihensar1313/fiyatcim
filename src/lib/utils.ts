import { CURRENCY, FREE_SHIPPING_THRESHOLD, DEFAULT_SHIPPING_COST } from "./constants";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatUSD(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getDiscountPercent(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function getEffectivePrice(price: number, salePrice: number | null): number {
  return salePrice && salePrice < price ? salePrice : price;
}

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_COST;
}

export function calculateTax(price: number, taxRate: number): number {
  // KDV dahil fiyattan KDV tutarını çıkar
  // Fiyat = Net + KDV → Fiyat = Net * (1 + taxRate/100) → KDV = Fiyat - Fiyat / (1 + taxRate/100)
  return price - price / (1 + taxRate / 100);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function generateStars(rating: number): number[] {
  return Array.from({ length: 5 }, (_, i) => (i < Math.floor(rating) ? 1 : i < rating ? 0.5 : 0));
}

export function getStockStatus(stock: number, criticalStock: number): {
  label: string;
  color: string;
} {
  if (stock === 0) return { label: "Tükendi", color: "text-red-600" };
  if (stock <= criticalStock) return { label: "Son Birkaç Ürün", color: "text-orange-600" };
  return { label: "Stokta", color: "text-green-600" };
}

// ==========================================
// ADMIN UTILITIES
// ==========================================

export function timeAgo(date: string | null | undefined): string {
  if (!date) return "Bilinmiyor";

  const now = Date.now();
  const then = new Date(date).getTime();

  if (isNaN(then)) return "Geçersiz tarih";

  const diff = now - then;

  // Future date
  if (diff < 0) return "Az önce";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "Az önce";
  if (minutes < 60) return `${minutes} dakika önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days < 7) return `${days} gün önce`;
  if (weeks < 5) return `${weeks} hafta önce`;
  if (months < 12) return `${months} ay önce`;
  return `${years} yıl önce`;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const escape = (val: string | number | null | undefined): string => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ].join("\n");

  // BOM for Turkish characters in Excel
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
