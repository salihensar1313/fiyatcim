import type { Product } from "@/types";

/**
 * Akıllı ürün önerisi — kural tabanlı (AI değil)
 * Sıralama: aynı kategori > aynı marka > fiyat benzerliği > son görüntülenenler
 */
export function getRecommendations(
  current: Product,
  allProducts: Product[],
  recentlyViewedIds: string[] = [],
  limit = 8,
): Product[] {
  const candidates = allProducts.filter(
    (p) => p.id !== current.id && p.is_active && !p.deleted_at && p.stock > 0,
  );

  const currentPrice = current.sale_price || current.price;

  const scored = candidates.map((p) => {
    let score = 0;

    // Aynı kategori — en güçlü sinyal
    if (p.category_id === current.category_id) score += 50;

    // Aynı marka
    if (p.brand_id === current.brand_id) score += 30;

    // Fiyat benzerliği (±%30 bandında → bonus)
    const pPrice = p.sale_price || p.price;
    const ratio = pPrice / currentPrice;
    if (ratio >= 0.7 && ratio <= 1.3) score += 20;
    if (ratio >= 0.85 && ratio <= 1.15) score += 10; // daha yakınsa ekstra

    // Son görüntülenenlerle benzerlik
    if (recentlyViewedIds.includes(p.id)) score += 15;

    // İndirimli ürün bonusu
    if (p.sale_price && p.sale_price < p.price) score += 5;

    return { product: p, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}

/**
 * En iyi alternatifler — aynı kategori, farklı marka, benzer fiyat
 */
export function getAlternatives(
  current: Product,
  allProducts: Product[],
  limit = 6,
): Product[] {
  const currentPrice = current.sale_price || current.price;

  const candidates = allProducts.filter((p) => {
    if (p.id === current.id) return false;
    if (!p.is_active || p.deleted_at) return false;
    if (p.stock <= 0) return false;

    // Aynı kategori olmalı
    if (p.category_id !== current.category_id) return false;

    // Farklı marka tercih edilir ama zorunlu değil (az ürün varsa)
    return true;
  });

  const scored = candidates.map((p) => {
    let score = 0;
    const pPrice = p.sale_price || p.price;
    const ratio = pPrice / currentPrice;

    // Farklı marka — asıl alternatif
    if (p.brand_id !== current.brand_id) score += 40;

    // Fiyat benzerliği
    if (ratio >= 0.7 && ratio <= 1.3) score += 30;
    if (ratio >= 0.85 && ratio <= 1.15) score += 15;

    // İndirimli ise
    if (p.sale_price && p.sale_price < p.price) score += 10;

    // Stok durumu
    if (p.stock > p.critical_stock) score += 5;

    return { product: p, score, priceDiff: pPrice - currentPrice };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.product);
}
