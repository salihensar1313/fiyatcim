import type { Product } from "@/types";

// Turkish character normalization map
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

/** Normalize Turkish characters and lowercase */
export function normalize(text: string): string {
  return text
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] || ch)
    .toLowerCase()
    .trim();
}

/** Tokenize a string into searchable words */
function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s\-_/.,;:()]+/)
    .filter((t) => t.length > 0);
}

// Field weights for scoring
const FIELD_WEIGHTS = {
  sku: 10,
  name: 5,
  brand: 4,
  category: 3,
  short_desc: 2,
  description: 1,
} as const;

export interface SearchResult {
  product: Product;
  score: number;
  matchedFields: string[];
}

export interface GroupedSuggestions {
  products: SearchResult[];
  categories: { name: string; slug: string; count: number }[];
  brands: { name: string; slug: string; count: number }[];
}

/** Score a single product against query tokens */
function scoreProduct(product: Product, queryTokens: string[]): SearchResult | null {
  let totalScore = 0;
  const matchedFields = new Set<string>();

  const fields: { key: keyof typeof FIELD_WEIGHTS; value: string }[] = [
    { key: "sku", value: product.sku || "" },
    { key: "name", value: product.name || "" },
    { key: "brand", value: product.brand?.name || "" },
    { key: "category", value: product.category?.name || "" },
    { key: "short_desc", value: product.short_desc || "" },
    { key: "description", value: product.description || "" },
  ];

  for (const queryToken of queryTokens) {
    let tokenMatched = false;

    for (const field of fields) {
      const fieldTokens = tokenize(field.value);
      const normalizedField = normalize(field.value);
      const weight = FIELD_WEIGHTS[field.key];

      // Exact token match (highest score)
      if (fieldTokens.includes(queryToken)) {
        totalScore += weight * 3;
        matchedFields.add(field.key);
        tokenMatched = true;
        continue;
      }

      // Token starts with query (prefix match)
      if (fieldTokens.some((ft) => ft.startsWith(queryToken))) {
        totalScore += weight * 2;
        matchedFields.add(field.key);
        tokenMatched = true;
        continue;
      }

      // Substring match in the full field
      if (normalizedField.includes(queryToken)) {
        totalScore += weight * 1;
        matchedFields.add(field.key);
        tokenMatched = true;
      }
    }

    // If any query token doesn't match at all, heavily penalize
    if (!tokenMatched) {
      totalScore -= 10;
    }
  }

  if (totalScore <= 0) return null;

  return { product, score: totalScore, matchedFields: Array.from(matchedFields) };
}

/** Search products with token-based weighted scoring */
export function searchProducts(products: Product[], query: string): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const queryTokens = tokenize(trimmed);
  if (queryTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const product of products) {
    if (!product.is_active || product.deleted_at) continue;
    const result = scoreProduct(product, queryTokens);
    if (result) results.push(result);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/** Get grouped suggestions for autocomplete (products + categories + brands) */
export function getGroupedSuggestions(
  products: Product[],
  query: string,
  maxProducts = 4,
  maxCategories = 2,
  maxBrands = 2
): GroupedSuggestions {
  const results = searchProducts(products, query);

  // Unique categories from results
  const categoryMap = new Map<string, { name: string; slug: string; count: number }>();
  const brandMap = new Map<string, { name: string; slug: string; count: number }>();

  for (const r of results) {
    const cat = r.product.category;
    if (cat) {
      const existing = categoryMap.get(cat.id);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(cat.id, { name: cat.name, slug: cat.slug, count: 1 });
      }
    }

    const brand = r.product.brand;
    if (brand) {
      const existing = brandMap.get(brand.id);
      if (existing) {
        existing.count++;
      } else {
        brandMap.set(brand.id, { name: brand.name, slug: brand.slug, count: 1 });
      }
    }
  }

  return {
    products: results.slice(0, maxProducts),
    categories: Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxCategories),
    brands: Array.from(brandMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxBrands),
  };
}

/** Highlight matching text with <mark> tags */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const queryTokens = tokenize(query);
  let result = text;

  for (const token of queryTokens) {
    // Case-insensitive, Turkish-aware highlight
    const regex = new RegExp(
      `(${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    result = result.replace(regex, "<mark>$1</mark>");
  }

  return result;
}

/** Popular search terms (static for demo) */
export const POPULAR_SEARCHES = [
  "Güvenlik Kamerası",
  "Alarm Sistemi",
  "Akıllı Kilit",
  "DVR",
  "NVR",
  "IP Kamera",
  "Hareket Sensörü",
  "Video Kapı Zili",
];
