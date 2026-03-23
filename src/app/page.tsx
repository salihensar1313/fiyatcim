import type { Metadata } from "next";
import { Suspense } from "react";
import dynamic from "next/dynamic";

export const revalidate = 3600; // 1 saat

export const metadata: Metadata = {
  title: "Fiyatcim — Alarm ve Güvenlik Sistemleri | En Uygun Fiyatlar",
  description: "Alarm sistemleri, güvenlik kameraları, akıllı ev çözümleri ve yangın algılama sistemleri en uygun fiyatlarla Fiyatcim.com'da. Ücretsiz kargo ve profesyonel kurulum.",
  alternates: { canonical: "/" },
};
import HeroSlider from "@/components/home/HeroSlider";
import PromoBanner from "@/components/home/PromoBanner";
import QuickAccessGrid from "@/components/home/QuickAccessGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import RandomProducts from "@/components/home/RandomProducts";

// Below-the-fold: dynamic imports for code splitting
const BrandCarousel = dynamic(() => import("@/components/home/BrandCarousel"));
const PremiumBanner = dynamic(() => import("@/components/premium/PremiumBanner"));
const FlashSale = dynamic(() => import("@/components/home/FlashSale"));
const BestSellers = dynamic(() => import("@/components/home/BestSellers"));
const TrendingProducts = dynamic(() => import("@/components/home/TrendingProducts"));
const CampaignRadar = dynamic(() => import("@/components/home/CampaignRadar"));
const TrustBadges = dynamic(() => import("@/components/home/TrustBadges"));
const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"));
const Newsletter = dynamic(() => import("@/components/home/Newsletter"));
const BannerSlot = dynamic(() => import("@/components/ui/BannerSlot"));

/**
 * Ana sayfa bölüm sırası (Growth Phase 2):
 *
 * 1. HeroSlider — Ana banner
 * 2. PromoBanner — Kampanya barı
 * 3. QuickAccessGrid — 6 ikonlu hızlı erişim
 * 4. TrustBadges — Güven rozeti barı
 * 5. FeaturedProducts — Öne çıkan ürünler (8)
 * 6. CategoryShowcase — Kategori vitrin kartları (6 kategori)
 * 7. RandomProducts — Keşfet (12)
 * 8. BannerSlot — Dinamik kampanya banner
 * 9. FlashSale — Flaş indirimler (countdown) — veri varsa
 * 10. BestSellers — Öne çıkan indirimler (8)
 * 11. BrandCarousel — Marka logoları
 * 12. TrendingProducts — Trend ürünler (8)
 * 13. CampaignRadar — Kampanya radar (8)
 * 14. WhyChooseUs — Neden biz
 * 15. Newsletter — E-posta abonelik
 */
export default function HomePage() {
  return (
    <>
      {/* SEO: Tek H1 — sayfa başına 1 adet */}
      <h1 className="sr-only">Fiyatcim — Alarm ve Güvenlik Sistemleri</h1>

      {/* Hero */}
      <Suspense fallback={<div className="min-h-[300px] animate-pulse bg-dark-900 sm:min-h-[400px] lg:min-h-[540px]" />}>
        <HeroSlider />
      </Suspense>

      {/* Kampanya + Hızlı Erişim */}
      <PromoBanner />
      <QuickAccessGrid />

      {/* Güven */}
      <Suspense fallback={<div className="border-y border-dark-100 bg-white dark:bg-dark-800 py-6 sm:py-8"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded bg-dark-50 dark:bg-dark-800" />))}</div></div></div>}>
        <TrustBadges />
      </Suspense>

      {/* Öne Çıkan Ürünler */}
      <Suspense fallback={<div className="bg-dark-50 py-12 sm:py-16"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-72 animate-pulse rounded-xl bg-dark-100" />))}</div></div></div>}>
        <FeaturedProducts />
      </Suspense>

      {/* Keşfet — Rastgele ürünler */}
      <Suspense fallback={<div className="py-12 sm:py-16"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-72 animate-pulse rounded-xl bg-dark-100" />))}</div></div></div>}>
        <RandomProducts />
      </Suspense>

      {/* Dinamik Banner Slot */}
      <BannerSlot name="products_between" />

      {/* Flaş İndirimler — countdown ile (veri varsa gösterir) */}
      <FlashSale />

      {/* Öne Çıkan İndirimler — indirimli ürünler (8) */}
      <BestSellers />

      {/* Premium Üyelik Banner */}
      <PremiumBanner variant="home" />

      {/* Markalar — logo carousel */}
      <BrandCarousel />

      {/* Trend Ürünler — trending (8) */}
      <TrendingProducts />

      {/* Kampanya Radar — indirim yüzdesine göre (8) */}
      <CampaignRadar />

      {/* Neden Fiyatcim */}
      <WhyChooseUs />

      {/* Newsletter */}
      <Newsletter />
    </>
  );
}
