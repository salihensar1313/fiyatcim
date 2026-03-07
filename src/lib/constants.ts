// ==========================================
// MARKA KİMLİĞİ (PR-01)
// ==========================================

export const SITE_NAME = "Fiyatcim";
export const SITE_FULL_NAME = "Fiyatcim.com — Uzman Onaylı Elektronik Marketi";
export const SITE_URL = "https://www.fiyatcim.com";
export const SITE_DESCRIPTION =
  "Fiyatcim.com; uzman onaylı rehberler, karşılaştırmalar ve güvenilir alışveriş deneyimiyle Türkiye'nin elektronik marketi. Doğru ürünü seçmen için içerik otoritesi, satın alırken şeffaflık ve güven sunar.";

export const CONTACT = {
  email: "destek@fiyatcim.com",
  phone: "+90 (___) ___ __ __",
  address: "İstanbul, Türkiye",
  workingHours: "Hafta içi 09:00–18:00",
} as const;

export const SOCIAL = {
  instagram: "https://instagram.com/fiyatcim",
  x: "https://x.com/fiyatcim",
  youtube: "https://youtube.com/@fiyatcim",
  linkedin: "https://linkedin.com/company/fiyatcim",
} as const;

export const NAV_LINKS = [
  { label: "Alarm Sistemleri", href: "/kategori/alarm-sistemleri", key: "alarm" },
  { label: "Güvenlik Kameraları", href: "/kategori/guvenlik-kameralari", key: "kamera" },
  { label: "Akıllı Ev", href: "/kategori/akilli-ev-sistemleri", key: "akilli-ev" },
  { label: "Geçiş Kontrol", href: "/kategori/gecis-kontrol-sistemleri", key: "gecis" },
  { label: "Tüm Ürünler", href: "/urunler", key: "urunler" },
] as const;

// Kategori görselleri (seed category id → image path)
export const CATEGORY_IMAGES: Record<string, string> = {
  "cat-1": "/images/categories/alarm.png",
  "cat-2": "/images/categories/kamera.png",
  "cat-3": "/images/categories/akilli-ev.png",
  "cat-4": "/images/categories/gecis-kontrol.png",
};

// Kategori görselleri slug bazlı (DB modunda kullanılır)
export const CATEGORY_IMAGES_BY_SLUG: Record<string, string> = {
  "alarm-sistemleri": "/images/categories/alarm.png",
  "guvenlik-kameralari": "/images/categories/kamera.png",
  "akilli-ev-sistemleri": "/images/categories/akilli-ev.png",
  "gecis-kontrol-sistemleri": "/images/categories/gecis-kontrol.png",
};

// Footer linkleri
export const FOOTER_LINKS = {
  kurumsal: [
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "İletişim", href: "/iletisim" },
    { label: "SSS", href: "/sss" },
  ],
  rehber: [
    { label: "Blog", href: "/blog" },
    { label: "Rehberler", href: "/rehber" },
  ],
  musteri: [
    { label: "Hesabım", href: "/hesabim" },
    { label: "Siparişlerim", href: "/hesabim/siparislerim" },
    { label: "Favorilerim", href: "/hesabim/favorilerim" },
    { label: "Sepetim", href: "/sepet" },
  ],
  yasal: [
    { label: "KVKK", href: "/kvkk" },
    { label: "Gizlilik Politikası", href: "/gizlilik" },
    { label: "Bilgi Güvenliği", href: "/bilgi-guvenligi" },
    { label: "Güvenli Alışveriş", href: "/guvenli-alisveris" },
    { label: "Çerez Politikası", href: "/cerez-politikasi" },
    { label: "Mesafeli Satış", href: "/mesafeli-satis-sozlesmesi" },
    { label: "Ön Bilgilendirme", href: "/on-bilgilendirme" },
    { label: "İade & Değişim", href: "/iade-politikasi" },
    { label: "Kargo & Teslimat", href: "/kargo-bilgileri" },
  ],
} as const;

// ==========================================
// İŞ MANTIĞI SABİTLERİ (sepet/ödeme/admin için korunuyor)
// ==========================================

export const CURRENCY = {
  code: "TRY",
  symbol: "₺",
  locale: "tr-TR",
};

export const PAGINATION = {
  products_per_page: 12,
};

export const FREE_SHIPPING_THRESHOLD = 2000;
export const DEFAULT_SHIPPING_COST = 49.90;
export const GIFT_WRAP_COST = 19.90;

export const TURKISH_PROVINCES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir",
  "Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli",
  "Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari",
  "Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir",
  "Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir",
  "Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat",
  "Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman",
  "Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce",
] as const;

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};
