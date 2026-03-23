// ============================================================
// CimBot V2 — NLP Engine
// Intent Detection, Entity Extraction, Sentiment Analysis, Fuzzy Matching
// ============================================================

import type { Intent, Sentiment, BudgetEntity, NLPResult } from "../types";

// ─── Turkish Character Normalization ───
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
  â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

export function normalize(text: string): string {
  return text
    .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] || ch)
    .toLowerCase()
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[\s\-_/.,;:()!?'"]+/)
    .filter((t) => t.length > 0);
}

// ─── Levenshtein Distance for Fuzzy Matching ───
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(input: string, target: string, maxDistance = 2): boolean {
  const a = normalize(input);
  const b = normalize(target);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  if (Math.abs(a.length - b.length) > maxDistance) return false;
  return levenshtein(a, b) <= maxDistance;
}

// ─── Intent Detection ───

interface IntentPattern {
  intent: Intent;
  keywords: string[];
  patterns?: RegExp[];
  weight: number;   // higher = more confident
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Greetings
  {
    intent: "GREETING",
    keywords: ["merhaba", "selam", "hey", "naber", "nasilsin", "nasılsın", "gunaydin", "iyi gunler", "iyi aksamlar", "hosgeldin", "sa", "selamun", "hello", "hi"],
    weight: 8,
  },
  // Farewell
  {
    intent: "FAREWELL",
    keywords: ["gorusuruz", "hosca kal", "bye", "bay bay", "gule gule", "iyi geceler", "kendine iyi bak", "gorusmek uzere"],
    weight: 8,
  },
  // Thanks
  {
    intent: "THANKS",
    keywords: ["tesekkur", "sagol", "eyvallah", "sagolasin", "minnettar", "tesekkurler", "cok tesekkurler", "thanks", "mersi"],
    weight: 7,
  },
  // Budget
  {
    intent: "BUDGET",
    keywords: ["butce", "butcem", "param", "fiyat araligi", "harcayabilirim", "ayirabilirim"],
    patterns: [
      /\d[\d.,]*\s*(tl|₺|lira|bin\s*tl|bin\s*lira)/i,
      /butce[ms]?\s*(var|yok|\d)/i,
      /(ucuz|pahali|uygun|ekonomik|hesapli)/i,
      /(\d{3,})\s*(butce|butcem|param|harcayabilirim|ayirabilirim)/i,
      /(butce|butcem|param|harcayabilirim|ayirabilirim)\s*(\d{3,})/i,
      /(\d{3,})\s*(tl|₺|lira)\s*(butce|butcem|param|var)/i,
      /(param|butcem)\s*(var|yok)/i,
    ],
    weight: 12,
  },
  // Product Search / Recommendation
  {
    intent: "PRODUCT_SEARCH",
    keywords: ["urun", "ara", "bul", "goster", "oner", "tavsiye", "bakiyorum", "istiyorum", "lazim", "ihtiyac", "almak", "satin"],
    weight: 6,
  },
  {
    intent: "RECOMMEND",
    keywords: ["oner", "onerirsin", "tavsiye", "en iyi", "hangi", "hangisi", "seceyim", "ne alayim", "ne onerirsin", "oneriniz"],
    weight: 7,
  },
  // Categories
  {
    intent: "CATEGORY",
    keywords: [
      "kamera", "kameralar", "guvenlik kamerasi", "ip kamera", "dome", "bullet", "ptz",
      "alarm", "alarm sistemi", "alarm seti", "hirsiz alarmi",
      "akilli kilit", "kilit", "parmak izi", "kartli kilit",
      "yangin", "duman dedektor", "yangin algilama", "gaz dedektor",
      "diafon", "video diafon", "kapi zilim", "interkom",
      "sensor", "hareket sensoru", "pir", "manyetik kontak",
      "nvr", "dvr", "kayit cihazi",
      "akilli ev", "otomasyon", "wifi", "zigbee",
      "gecis kontrol", "turnikeler", "kartli gecis",
    ],
    weight: 7,
  },
  // Brands
  {
    intent: "BRAND",
    keywords: [
      "hikvision", "dahua", "unv", "uniview", "reolink", "imou",
      "yale", "desi", "kale", "blitzlock",
      "gst", "sens",
      "ajax", "paradox", "pyronix",
    ],
    weight: 8,
  },
  // Compare
  {
    intent: "COMPARE",
    keywords: ["karsilastir", "fark", "farki", "hangisi daha", "vs", "versus", "arasi", "arasindaki"],
    weight: 7,
  },
  // Cart
  {
    intent: "CART_ADD",
    keywords: ["sepete ekle", "sepetim", "al", "satin al", "ekle"],
    patterns: [/(sepet|ekle|satin\s*al)/i, /(ilkini|ikincisini|ucuncusunu|sonuncuyu)\s*(ekle|al)/i],
    weight: 8,
  },
  {
    intent: "CART_VIEW",
    keywords: ["sepetim", "sepette ne var", "sepeti gor"],
    weight: 7,
  },
  // Order tracking
  {
    intent: "ORDER_TRACK",
    keywords: ["siparis", "kargo", "takip", "nerede", "teslimat", "gonderim", "siparis takip"],
    weight: 7,
  },
  // Support
  {
    intent: "SUPPORT",
    keywords: ["yardim", "sorun", "ariza", "iade", "garanti", "degisim", "sikayet", "musteri hizmetleri", "destek"],
    weight: 6,
  },
  // Installation
  {
    intent: "INSTALL",
    keywords: ["kurulum", "montaj", "nasil yapilir", "baglanir", "takilir", "monte", "kablo", "ayar"],
    weight: 6,
  },
  // Pricing
  {
    intent: "PRICING",
    keywords: ["fiyat", "kac para", "ne kadar", "ucuz", "pahali", "maliyet", "tutar"],
    weight: 7,
  },
  // Discount
  {
    intent: "DISCOUNT",
    keywords: ["indirim", "kampanya", "kupon", "firsat", "promosyon", "ucuzluk", "cok uygun"],
    weight: 7,
  },
  // Specs
  {
    intent: "SPECS",
    keywords: ["ozellik", "megapiksel", "mp", "cozunurluk", "kanal", "gece gorus", "ir", "poe", "wifi"],
    patterns: [/\d+\s*(mp|megapiksel|kanal|ch)/i],
    weight: 6,
  },
  // Refinements
  {
    intent: "REFINE_CHEAPER",
    keywords: ["daha ucuz", "daha uygun", "ucuzunu", "hesaplisi", "butceme uygun"],
    weight: 8,
  },
  {
    intent: "REFINE_EXPENSIVE",
    keywords: ["daha iyi", "daha kaliteli", "daha pahali", "ust segment", "premium"],
    weight: 8,
  },
  {
    intent: "REFINE_DIFFERENT",
    keywords: ["baska", "farkli", "alternatif", "degisik", "baska bir sey", "bunlar degil"],
    weight: 7,
  },
  // Select Product
  {
    intent: "SELECT_PRODUCT",
    keywords: ["ilki", "ilkini", "ikinci", "ikincisi", "ucuncu", "ucuncusu", "sonuncu", "birinci", "bu"],
    patterns: [/(ilk|ikinci|ucuncu|dorduncu|sonuncu|birinci)\s*(urun|sini|sunu|nu)?/i, /(\d)\.\s*(urun|sira)/i],
    weight: 8,
  },
  // Show More
  {
    intent: "SHOW_MORE",
    keywords: ["daha fazla", "devam", "devamini goster", "diger urunler", "baska goster", "dahasi", "daha cok"],
    patterns: [/daha\s*fazla\s*(goster|oner)?/i, /devam(ini)?\s*(goster|et)?/i, /baska(larini)?\s*goster/i],
    weight: 8,
  },
  // Stock Check
  {
    intent: "STOCK_CHECK",
    keywords: ["stok", "stokta", "mevcut", "var mi", "kaldi mi", "bitti mi", "tukendi"],
    patterns: [/stok(ta)?\s*(var|yok|kaldi|mi)/i, /(bu\s*urun|urun)\s*(var|stok)/i, /mevcut\s*mu/i],
    weight: 8,
  },
  // Shipping Info
  {
    intent: "SHIPPING_INFO",
    keywords: ["kargo suresi", "kac gunde", "ne zaman gelir", "kargo ucreti", "teslimat suresi", "ucretsiz kargo"],
    patterns: [/kargo\s*(suresi|ucreti|bedava|ucretsiz|ne\s*kadar)/i, /kac\s*gun(de|e)?/i, /ne\s*zaman\s*(gelir|ulasir|teslim)/i],
    weight: 8,
  },
  // Package Deal
  {
    intent: "PACKAGE_DEAL",
    keywords: ["paket", "set", "komple", "full set", "kamera seti", "alarm seti", "toplu", "her sey"],
    patterns: [/(komple|full)\s*(set|sistem|paket)/i, /kamera\s*(ve|\+)\s*(nvr|kayit)/i, /alarm\s*(ve|\+)\s*(sensor|dedekt)/i, /her\s*sey\s*(dahil|bir\s*arada)/i],
    weight: 8,
  },
  // Casual
  {
    intent: "CASUAL",
    keywords: ["hava", "futbol", "mac", "yemek", "film", "muzik", "saka", "espri", "ask", "sevgili"],
    weight: 3,
  },
  // Profanity (Turkish curse words — simplified detection)
  {
    intent: "PROFANITY",
    keywords: [],
    patterns: [
      /\b(sik|bok|amk|aq|orospu|pic|piç|yavşak|göt|yarrak|sikerim|sg|amina|ananı|gerizekalı|aptal|salak|mal)\b/i,
    ],
    weight: 10,
  },
];

// ─── Category & Brand Mapping ───
// Loaded dynamically but with fallback keywords

const CATEGORY_KEYWORDS: Record<string, { slug: string; name: string; keywords: string[] }> = {
  kamera: {
    slug: "guvenlik-kameralari",
    name: "Güvenlik Kameraları",
    keywords: ["kamera", "kameralar", "ip kamera", "dome", "bullet", "ptz", "turret", "guvenlik kamerasi", "cctv", "goz"],
  },
  alarm: {
    slug: "alarm-sistemleri",
    name: "Alarm Sistemleri",
    keywords: ["alarm", "hirsiz", "siren", "hareket sensoru", "manyetik", "alarm seti", "alarm sistemi", "pir"],
  },
  akilli_ev: {
    slug: "akilli-ev-sistemleri",
    name: "Akıllı Ev Sistemleri",
    keywords: ["akilli ev", "otomasyon", "zigbee"],
  },
  akilli_kilit: {
    slug: "akilli-kilit",
    name: "Akıllı Kilit",
    keywords: ["akilli kilit", "kilit", "parmak izi", "kartli kilit", "wifi kilit", "parmak izli kilit", "sifre kilit"],
  },
  gecis_kontrol: {
    slug: "gecis-kontrol-sistemleri",
    name: "Geçiş Kontrol Sistemleri",
    keywords: ["gecis kontrol", "turnikeler", "kartli gecis", "bariyer", "gecis", "pdks"],
  },
  yangin: {
    slug: "yangin-algilama",
    name: "Yangın Algılama",
    keywords: ["yangin", "duman", "dedektor", "gaz dedektor", "yangin algilama", "smoke", "co"],
  },
  kayit: {
    slug: "guvenlik-kameralari",
    name: "Kayıt Cihazları",
    keywords: ["nvr", "dvr", "kayit cihazi", "kaydedici", "xvr"],
  },
};

const BRAND_KEYWORDS: Record<string, { slug: string; name: string; keywords: string[] }> = {
  hikvision: { slug: "hikvision", name: "Hikvision", keywords: ["hikvision", "hik", "hikvisn"] },
  dahua: { slug: "dahua", name: "Dahua", keywords: ["dahua", "dhua"] },
  unv: { slug: "unv", name: "UNV", keywords: ["unv", "uniview", "uni"] },
  reolink: { slug: "reolink", name: "Reolink", keywords: ["reolink"] },
  imou: { slug: "imou", name: "İmou", keywords: ["imou"] },
  yale: { slug: "yale", name: "Yale", keywords: ["yale"] },
  desi: { slug: "desi", name: "Desi", keywords: ["desi"] },
  kale: { slug: "kale", name: "Kale", keywords: ["kale"] },
  blitzlock: { slug: "blitzlock", name: "Blitzlock", keywords: ["blitzlock", "blitz"] },
  gst: { slug: "gst", name: "GST", keywords: ["gst"] },
  sens: { slug: "sens", name: "Sens", keywords: ["sens"] },
  ajax: { slug: "ajax", name: "Ajax", keywords: ["ajax"] },
  paradox: { slug: "paradox", name: "Paradox", keywords: ["paradox"] },
  pyronix: { slug: "pyronix", name: "Pyronix", keywords: ["pyronix"] },
};

// ─── Intent Detection ───
function detectIntents(normalizedText: string, tokens: string[]): { intent: Intent; score: number }[] {
  const scores: Map<Intent, number> = new Map();

  for (const pattern of INTENT_PATTERNS) {
    let matched = false;
    let matchScore = 0;

    // Keyword matching (with fuzzy)
    for (const keyword of pattern.keywords) {
      const kwNorm = normalize(keyword);
      const kwTokens = kwNorm.split(/\s+/);

      // Multi-word keyword: check substring
      if (kwTokens.length > 1) {
        if (normalizedText.includes(kwNorm)) {
          matchScore += pattern.weight * 2;
          matched = true;
        }
      } else {
        // Single word: exact or fuzzy
        for (const token of tokens) {
          if (token === kwNorm) {
            matchScore += pattern.weight * 2;
            matched = true;
          } else if (token.startsWith(kwNorm) || kwNorm.startsWith(token)) {
            matchScore += pattern.weight * 1.5;
            matched = true;
          } else if (kwNorm.length >= 4 && fuzzyMatch(token, kwNorm, 1)) {
            matchScore += pattern.weight;
            matched = true;
          }
        }
      }
    }

    // Regex pattern matching
    if (pattern.patterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedText)) {
          matchScore += pattern.weight * 2.5;
          matched = true;
        }
      }
    }

    if (matched) {
      const existing = scores.get(pattern.intent) || 0;
      scores.set(pattern.intent, existing + matchScore);
    }
  }

  return Array.from(scores.entries())
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);
}

// ─── Budget Extraction ───
function extractBudget(text: string): BudgetEntity | null {
  const normalized = normalize(text);

  // Turkish word numbers
  const wordNumbers: Record<string, number> = {
    "bir": 1, "iki": 2, "uc": 3, "dort": 4, "bes": 5,
    "alti": 6, "yedi": 7, "sekiz": 8, "dokuz": 9, "on": 10,
    "yirmi": 20, "otuz": 30, "kirk": 40, "elli": 50,
    "altmis": 60, "yetmis": 70, "seksen": 80, "doksan": 90,
    "yuz": 100, "bin": 1000,
  };

  // Pattern: "3000 TL", "5.000₺", "3,000 lira"
  const exactMatch = text.match(/(\d[\d.,]*)\s*(tl|₺|lira)/i);
  if (exactMatch) {
    const num = parseFloat(exactMatch[1].replace(/[.,]/g, ""));
    if (!isNaN(num) && num > 0) {
      return { exact: num, max: num };
    }
  }

  // Pattern: "3 bin TL", "5 bin lira"
  const binMatch = text.match(/(\d+)\s*bin\s*(tl|₺|lira)?/i);
  if (binMatch) {
    const num = parseInt(binMatch[1]) * 1000;
    if (!isNaN(num) && num > 0) {
      return { exact: num, max: num };
    }
  }

  // Pattern: "iki bin", "üç bin"
  for (const [word, value] of Object.entries(wordNumbers)) {
    const regex = new RegExp(`${word}\\s*bin\\s*(tl|₺|lira)?`, "i");
    if (regex.test(normalized)) {
      return { exact: value * 1000, max: value * 1000 };
    }
  }

  // Range: "1000-3000 TL", "1000 ile 3000"
  const rangeMatch = text.match(/(\d[\d.,]*)\s*[-–]\s*(\d[\d.,]*)\s*(tl|₺|lira)?/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1].replace(/[.,]/g, ""));
    const max = parseFloat(rangeMatch[2].replace(/[.,]/g, ""));
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  // "1000 ile 3000 arası"
  const ileMatch = text.match(/(\d[\d.,]*)\s*(ile|ila)\s*(\d[\d.,]*)/i);
  if (ileMatch) {
    const min = parseFloat(ileMatch[1].replace(/[.,]/g, ""));
    const max = parseFloat(ileMatch[3].replace(/[.,]/g, ""));
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  // "5000 10000 tl arası" (space-separated range — from quick reply buttons)
  const spaceRangeMatch = text.match(/(\d{3,}[\d.,]*)\s+(\d{3,}[\d.,]*)\s*(tl|₺|lira)?\s*(arasi|arası|araligi|aralığı)?/i);
  if (spaceRangeMatch) {
    const min = parseFloat(spaceRangeMatch[1].replace(/[.,]/g, ""));
    const max = parseFloat(spaceRangeMatch[2].replace(/[.,]/g, ""));
    if (!isNaN(min) && !isNaN(max) && max > min) {
      return { min, max };
    }
  }

  // Pattern: "200000 bütçem var", "50000 param var", "200000 harcayabilirim"
  const budgetKeywordMatch = text.match(/(\d[\d.,]*)\s*(butce|butcem|param|harcayabilirim|ayirabilirim)/i);
  if (budgetKeywordMatch) {
    const num = parseFloat(budgetKeywordMatch[1].replace(/[.,]/g, ""));
    if (!isNaN(num) && num > 0) {
      return { exact: num, max: num };
    }
  }

  // Reverse: "bütçem 200000", "param 50000"
  const reverseBudgetMatch = text.match(/(butce|butcem|param|harcayabilirim|ayirabilirim)\s*(\d[\d.,]*)/i);
  if (reverseBudgetMatch) {
    const num = parseFloat(reverseBudgetMatch[2].replace(/[.,]/g, ""));
    if (!isNaN(num) && num > 0) {
      return { exact: num, max: num };
    }
  }

  // Bare number with budget context words nearby: "200000 bütçem var" or "bütçem var 200000"
  if (/(butce|butcem|param|harcayabilirim|ayirabilirim)/i.test(normalized)) {
    const anyNumber = text.match(/(\d{3,}[\d.,]*)/);
    if (anyNumber) {
      const num = parseFloat(anyNumber[1].replace(/[.,]/g, ""));
      if (!isNaN(num) && num > 0) {
        return { exact: num, max: num };
      }
    }
  }

  // "ucuz", "pahali", "uygun" qualifiers — güvenlik sistemi bağlamında makul değerler
  if (/(ucuz|uygun|ekonomik|hesapli|butce dostu)/i.test(normalized)) {
    return { max: 5000 };
  }
  if (/(pahali|premium|ust segment|en iyi|luks)/i.test(normalized)) {
    return { min: 15000 };
  }

  return null;
}

// ─── Category Extraction ───
function extractCategory(tokens: string[], normalizedText: string): { slug: string; name: string } | null {
  for (const [, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of cat.keywords) {
      const kwNorm = normalize(kw);
      if (kwNorm.includes(" ")) {
        if (normalizedText.includes(kwNorm)) return { slug: cat.slug, name: cat.name };
      } else {
        for (const token of tokens) {
          if (token === kwNorm || fuzzyMatch(token, kwNorm, 1)) {
            return { slug: cat.slug, name: cat.name };
          }
        }
      }
    }
  }
  return null;
}

// ─── Brand Extraction ───
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractBrand(tokens: string[], normalizedText: string): { slug: string; name: string } | null {
  for (const [, brand] of Object.entries(BRAND_KEYWORDS)) {
    for (const kw of brand.keywords) {
      const kwNorm = normalize(kw);
      for (const token of tokens) {
        if (token === kwNorm || fuzzyMatch(token, kwNorm, 1)) {
          return { slug: brand.slug, name: brand.name };
        }
      }
    }
  }
  return null;
}

// ─── Product Index Extraction ───
function extractProductIndex(normalizedText: string): number | null {
  const indexMap: Record<string, number> = {
    "ilk": 0, "birinci": 0, "ilkini": 0,
    "ikinci": 1, "ikincisi": 1, "ikincisini": 1,
    "ucuncu": 2, "ucuncusu": 2, "ucuncusunu": 2,
    "dorduncu": 3, "sonuncu": 3, "son": 3,
  };
  for (const [word, idx] of Object.entries(indexMap)) {
    if (normalizedText.includes(word)) return idx;
  }
  const numMatch = normalizedText.match(/(\d)\.\s*(urun|sira|siradaki)/);
  if (numMatch) return parseInt(numMatch[1]) - 1;
  return null;
}

// ─── Quantity Extraction ───
function extractQuantity(text: string): number | null {
  const normalized = normalize(text);

  // Turkish word numbers map
  const wordNumbers: Record<string, number> = {
    "bir": 1, "iki": 2, "uc": 3, "dort": 4, "bes": 5,
    "alti": 6, "yedi": 7, "sekiz": 8, "dokuz": 9, "on": 10,
    "onalti": 16, "onbes": 15, "oniki": 12, "onuc": 13, "ondort": 14,
    "yirmi": 20, "otuz": 30, "kirk": 40, "elli": 50,
  };

  // Turkish word numbers with counters: "üç tane", "beş adet"
  for (const [word, value] of Object.entries(wordNumbers)) {
    const regex = new RegExp(`\\b${word}\\s*(tane|adet|kamera|sensor|sensör|dedektor|dedektör|kilit|siren|nvr|dvr|cihaz|set|paket|ayna|kapı|kapi|oda|kat|giris|giriş)`, "i");
    if (regex.test(normalized)) return value;
  }

  // Numeric with counters: "3 tane", "5 adet", "2 kamera"
  const numericCounterMatch = normalized.match(/(\d+)\s*(tane|adet|kamera|sensor|sensör|dedektor|dedektör|kilit|siren|nvr|dvr|cihaz|set|paket|ayna|kapı|kapi|oda|kat|giris|giriş)/i);
  if (numericCounterMatch) {
    const num = parseInt(numericCounterMatch[1]);
    if (!isNaN(num) && num > 0 && num <= 999) return num;
  }

  // Range pattern: "1-2", returns the higher value
  const rangeMatch = normalized.match(/(\d+)\s*[-–]\s*(\d+)\s*(tane|adet|kamera)?/);
  if (rangeMatch) {
    const max = parseInt(rangeMatch[2]);
    if (!isNaN(max) && max > 0 && max <= 999) return max;
  }

  // "16+" pattern (common for camera channels)
  const plusMatch = normalized.match(/(\d+)\+\s*(kanal|kamera|ch)?/);
  if (plusMatch) {
    const num = parseInt(plusMatch[1]);
    if (!isNaN(num) && num > 0 && num <= 999) return num;
  }

  return null;
}

// ─── Location / Place Type Extraction ───
function extractLocation(normalizedText: string): string | null {
  // Check multi-word patterns first
  if (/\b(is\s*yeri|isyeri)\b/.test(normalizedText)) return "business";
  if (/\b(akilli\s*ev)\b/.test(normalizedText)) return "home";
  if (/\b(mustakil\s*ev)\b/.test(normalizedText)) return "villa";

  // Single-word patterns
  const locationMap: Array<{ pattern: RegExp; location: string }> = [
    { pattern: /\b(evim|evimiz|evimize|evime)\b/, location: "home" },
    { pattern: /\bev\b/, location: "home" },
    { pattern: /\b(ofis|ofisim|ofise)\b/, location: "business" },
    { pattern: /\b(dukkan|dükkan|magaza|mağaza)\b/, location: "business" },
    { pattern: /\b(fabrika|depo|atolye|atölye|sanayi)\b/, location: "industrial" },
    { pattern: /\b(villa|mustakil|müstakil)\b/, location: "villa" },
    { pattern: /\b(apart|daire|site|apartman)\b/, location: "apartment" },
  ];

  for (const { pattern, location } of locationMap) {
    if (pattern.test(normalizedText)) return location;
  }

  return null;
}

// ─── Room/Area Count Extraction ───
function extractRoomCount(text: string): { roomCount?: string; areaSize?: string } {
  const normalized = normalize(text);
  const result: { roomCount?: string; areaSize?: string } = {};

  // Numeric: "3 oda", "5 giriş", "2 kat"
  const roomMatch = normalized.match(/(\d+)\s*(oda|giris|giriş|kat|bolge|bölge|alan|pencere)/);
  if (roomMatch) {
    result.roomCount = roomMatch[1];
  }

  // Turkish word numbers + room: "üç oda", "beş giriş"
  const wordNumbers: Record<string, string> = {
    "bir": "1", "iki": "2", "uc": "3", "dort": "4", "bes": "5",
    "alti": "6", "yedi": "7", "sekiz": "8", "dokuz": "9", "on": "10",
  };
  for (const [word, value] of Object.entries(wordNumbers)) {
    const regex = new RegExp(`\\b${word}\\s*(oda|giris|kat|bolge|alan|pencere)`, "i");
    if (regex.test(normalized)) {
      result.roomCount = value;
      break;
    }
  }

  // Size qualifiers: "küçük", "orta", "büyük"
  if (/\b(kucuk|küçük|mini)\b/.test(normalized)) result.areaSize = "small";
  else if (/\b(orta|orta boy)\b/.test(normalized)) result.areaSize = "medium";
  else if (/\b(buyuk|büyük|genis|geniş)\b/.test(normalized)) result.areaSize = "large";

  return result;
}

// ─── No Preference / Skip Detection ───
function extractNoPreference(normalizedText: string): boolean {
  const patterns = [
    /\bfark\s*etmez\b/,
    /\bonemi\s*yok\b/,
    /\bönemli\s*degil\b/,
    /\bfarketmez\b/,
    /\bherhangi\b/,
    /\bne\s*olursa\b/,
    /\bher\s*turlu\b/,
    /\bhertürlu\b/,
    /\bfarketmiyor\b/,
    /\bbakmam\b/,
    /\bhic\s*fark\b/,
    /\bherhangi\s*bir\b/,
  ];
  return patterns.some((p) => p.test(normalizedText));
}

// ─── Spec Extraction ───
function extractSpecs(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const normalized = normalize(text);

  // 4K/2K resolution (must check before MP to avoid "4k" → "4MP")
  if (/\b4k\b/i.test(text)) specs.resolution = "8MP";
  else if (/\b2k\b/i.test(text)) specs.resolution = "4MP";
  else if (/\bfull\s*hd\b/i.test(text)) specs.resolution = "2MP";
  else {
    const mpMatch = text.match(/(\d+)\s*(mp|megapiksel)/i);
    if (mpMatch) specs.resolution = mpMatch[1] + "MP";
  }
  const chMatch = text.match(/(\d+)\s*(kanal|ch|channel)/i);
  if (chMatch) specs.channels = chMatch[1];
  if (/wifi|kablosuz/i.test(text)) specs.connectivity = "WiFi";
  if (/poe/i.test(text)) specs.power = "PoE";
  if (/gece\s*gorus|\bir\b|infrared/i.test(text)) specs.nightVision = "true";
  if (/dis\s*mekan|outdoor|ip67|ip66/i.test(text)) specs.outdoor = "true";
  if (/ic\s*mekan|indoor/i.test(text)) specs.indoor = "true";

  // Door type detection (smart locks)
  if (/celik\s*kapi|çelik\s*kapı/i.test(text) || /celik kapi/.test(normalized)) specs.doorType = "çelik";
  else if (/amerikan\s*panel/i.test(text) || /amerikan panel/.test(normalized)) specs.doorType = "amerikan";
  else if (/ahsap\s*kapi|ahşap\s*kapı/i.test(text) || /ahsap kapi/.test(normalized)) specs.doorType = "ahşap";

  // "hepsi", "tümü", "hepsi olsun", "her şey" — all features
  if (/\b(hepsi|hepsi\s*olsun|tumunu|tümü|tumu|her\s*sey|her\s*şey|hepsini|hepsini\s*istiyorum)\b/.test(normalized)) {
    specs.allFeatures = "true";
  }

  // Location extraction
  const location = extractLocation(normalized);
  if (location) specs.location = location;

  // Room/area count
  const roomArea = extractRoomCount(text);
  if (roomArea.roomCount) specs.roomCount = roomArea.roomCount;
  if (roomArea.areaSize) specs.areaSize = roomArea.areaSize;

  // No preference / skip detection
  if (extractNoPreference(normalized)) specs.noPreference = "true";

  return specs;
}

// ─── Sentiment Analysis ───
function analyzeSentiment(normalizedText: string): Sentiment {
  const positiveWords = ["harika", "super", "mukemmel", "guzel", "tesekkur", "sagol", "eyvallah", "sevdim", "bayildim", "iyi", "hos", "memnun", "tatmin", "seviyorum"];
  const negativeWords = ["kotu", "berbat", "memnun degil", "sikinti", "sorun", "problem", "bozuk", "calismıyor", "istemiyorum", "yetmiyor"];
  const angryWords = ["sinirli", "sacmalik", "rezalet", "utanmaz", "arsiz", "yaziklar olsun", "skandal"];

  let posScore = 0;
  let negScore = 0;
  let angryScore = 0;

  for (const w of positiveWords) {
    if (normalizedText.includes(normalize(w))) posScore++;
  }
  for (const w of negativeWords) {
    if (normalizedText.includes(normalize(w))) negScore++;
  }
  for (const w of angryWords) {
    if (normalizedText.includes(normalize(w))) angryScore++;
  }

  if (angryScore > 0) return "angry";
  if (negScore > posScore) return "negative";
  if (posScore > negScore) return "positive";
  return "neutral";
}

// ─── Main NLP Function ───
export function analyzeMessage(text: string): NLPResult {
  const normalizedText = normalize(text);
  const tokens = tokenize(text);
  const intentResults = detectIntents(normalizedText, tokens);

  const budget = extractBudget(text);

  // If budget was extracted AND budget keyword present, force BUDGET as primary intent
  let primaryIntent: Intent = intentResults.length > 0 ? intentResults[0].intent : "UNKNOWN";
  if (budget && /(butce|butcem|param|harcayabilirim|ayirabilirim)/i.test(normalizedText)) {
    primaryIntent = "BUDGET";
  }
  // Also force BUDGET if a clear price pattern is detected (e.g. "200000 tl")
  if (budget && /\d[\d.,]*\s*(tl|₺|lira)/i.test(text)) {
    primaryIntent = "BUDGET";
  }
  const intents = intentResults.map((r) => r.intent);

  const category = extractCategory(tokens, normalizedText);
  const brand = extractBrand(tokens, normalizedText);
  const productIndex = extractProductIndex(normalizedText);
  const quantity = extractQuantity(text);
  const specs = extractSpecs(text);
  const sentiment = analyzeSentiment(normalizedText);

  // Ensure multi-intent: if category or brand detected but not in intents, add them
  if (category && !intents.includes("CATEGORY")) {
    intents.push("CATEGORY");
  }
  if (brand && !intents.includes("BRAND")) {
    intents.push("BRAND");
  }
  if (budget && !intents.includes("BUDGET")) {
    intents.push("BUDGET");
  }

  const maxScore = intentResults.length > 0 ? intentResults[0].score : 0;
  const confidence = Math.min(maxScore / 30, 1); // Normalize to 0-1

  return {
    intents,
    primaryIntent,
    entities: {
      budget,
      category: category?.slug ?? null,
      categoryName: category?.name ?? null,
      brand: brand?.slug ?? null,
      brandName: brand?.name ?? null,
      quantity,
      specs,
      productIndex,
    },
    sentiment,
    confidence,
    rawText: text,
    normalizedText,
  };
}

// ─── Exports for testing ───
export { fuzzyMatch, extractBudget, extractCategory, extractBrand, detectIntents, extractQuantity, extractLocation, extractRoomCount, extractNoPreference };
