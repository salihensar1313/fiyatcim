/**
 * Premium Üyelik — Fiyatcim.com
 *
 * Premium üyeler: Ücretsiz profesyonel kurulum desteği alır.
 * Fiyat:
 *   - Sepette (ürün alırken): ₺2.500
 *   - Harici (sadece premium): ₺3.000
 */

export const PREMIUM_PRICE_WITH_ORDER = 2500;
export const PREMIUM_PRICE_STANDALONE = 3000;

export const PREMIUM_BENEFITS = [
  {
    icon: "Wrench" as const,
    title: "Ücretsiz Profesyonel Kurulum",
    desc: "Uzman ekibimiz tüm ürünlerinizi ücretsiz kurar",
  },
  {
    icon: "Headphones" as const,
    title: "7/24 Öncelikli Destek",
    desc: "Premium destek hattına sınırsız erişim",
  },
  {
    icon: "Shield" as const,
    title: "Genişletilmiş Garanti",
    desc: "Standart garantiye ek +1 yıl uzatılmış garanti",
  },
  {
    icon: "Zap" as const,
    title: "Öncelikli Kargo",
    desc: "Siparişleriniz aynı gün kargoya verilir",
  },
  {
    icon: "Settings" as const,
    title: "Uzaktan Erişim Kurulumu",
    desc: "Mobil uygulama ve uzaktan izleme ayarları yapılır",
  },
  {
    icon: "RefreshCw" as const,
    title: "Yıllık Bakım Ziyareti",
    desc: "Yılda 1 kez ücretsiz sistem kontrolü ve bakım",
  },
];
