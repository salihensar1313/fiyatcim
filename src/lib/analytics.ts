/**
 * GA4 Enhanced E-Commerce Event Tracking
 *
 * Tüm e-commerce eventleri merkezi olarak buradan gönderilir.
 * GA_ID yoksa hiçbir şey yapmaz (safe no-op).
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

import type { Product } from "@/types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(...args);
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(...args);
  }
}

function mapItem(product: Product, index?: number) {
  return {
    item_id: product.sku || product.id,
    item_name: product.name,
    item_brand: product.brand?.name || "",
    item_category: product.category?.name || "",
    price: product.sale_price || product.price,
    discount: product.sale_price ? product.price - product.sale_price : 0,
    index: index ?? 0,
  };
}

// ==========================================
// GA4 + Meta Pixel Events
// ==========================================

/** Ürün görüntüleme (PDP) */
export function trackViewItem(product: Product) {
  const item = mapItem(product);
  gtag("event", "view_item", {
    currency: "TRY",
    value: item.price,
    items: [item],
  });
  fbq("track", "ViewContent", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    value: item.price,
    currency: "TRY",
  });
}

/** Sepete ekleme */
export function trackAddToCart(product: Product, quantity = 1) {
  const item = mapItem(product);
  gtag("event", "add_to_cart", {
    currency: "TRY",
    value: item.price * quantity,
    items: [{ ...item, quantity }],
  });
  fbq("track", "AddToCart", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    value: item.price * quantity,
    currency: "TRY",
  });
}

/** Sepetten çıkarma */
export function trackRemoveFromCart(product: Product, quantity = 1) {
  const item = mapItem(product);
  gtag("event", "remove_from_cart", {
    currency: "TRY",
    value: item.price * quantity,
    items: [{ ...item, quantity }],
  });
}

/** Ürün listesi görüntüleme (homepage sections, category page) */
export function trackViewItemList(listName: string, products: Product[]) {
  gtag("event", "view_item_list", {
    item_list_id: listName.toLowerCase().replace(/\s+/g, "_"),
    item_list_name: listName,
    items: products.slice(0, 10).map((p, i) => mapItem(p, i)),
  });
}

/** Ürün kartına tıklama */
export function trackSelectItem(product: Product, listName?: string) {
  const item = mapItem(product);
  gtag("event", "select_item", {
    item_list_name: listName || "general",
    items: [item],
  });
}

/** Checkout başlangıcı */
export function trackBeginCheckout(items: { product: Product; qty: number }[], total: number) {
  gtag("event", "begin_checkout", {
    currency: "TRY",
    value: total,
    items: items.map((i, idx) => ({ ...mapItem(i.product, idx), quantity: i.qty })),
  });
  fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.product.sku || i.product.id),
    num_items: items.reduce((sum, i) => sum + i.qty, 0),
    value: total,
    currency: "TRY",
  });
}

/** Satın alma tamamlandı */
export function trackPurchase(orderId: string, total: number, items: { product: Product; qty: number }[]) {
  gtag("event", "purchase", {
    transaction_id: orderId,
    currency: "TRY",
    value: total,
    items: items.map((i, idx) => ({ ...mapItem(i.product, idx), quantity: i.qty })),
  });
  fbq("track", "Purchase", {
    content_ids: items.map((i) => i.product.sku || i.product.id),
    content_type: "product",
    value: total,
    currency: "TRY",
  });
}

/** Arama */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function trackSearch(query: string, resultCount?: number) {
  gtag("event", "search", {
    search_term: query,
  });
  fbq("track", "Search", {
    search_string: query,
    content_category: "products",
  });
}

/** Favorilere ekleme */
export function trackAddToWishlist(product: Product) {
  const item = mapItem(product);
  gtag("event", "add_to_wishlist", {
    currency: "TRY",
    value: item.price,
    items: [item],
  });
  fbq("track", "AddToWishlist", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    value: item.price,
    currency: "TRY",
  });
}
