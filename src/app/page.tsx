import { Suspense } from "react";
import dynamic from "next/dynamic";
import JsonLd, { buildOrganizationSchema, buildWebSiteSchema } from "@/components/seo/JsonLd";
import HeroSlider from "@/components/home/HeroSlider";
import PromoBanner from "@/components/home/PromoBanner";
import CategoryCards from "@/components/home/CategoryCards";
import FeaturedProducts from "@/components/home/FeaturedProducts";

// Below-the-fold: dynamic imports for code splitting
const FlashSale = dynamic(() => import("@/components/home/FlashSale"));
const BestSellers = dynamic(() => import("@/components/home/BestSellers"));
const TrendingProducts = dynamic(() => import("@/components/home/TrendingProducts"));
const CampaignRadar = dynamic(() => import("@/components/home/CampaignRadar"));
const TrustBadges = dynamic(() => import("@/components/home/TrustBadges"));
const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"));
const Newsletter = dynamic(() => import("@/components/home/Newsletter"));
const BlogPreview = dynamic(() => import("@/components/home/BlogPreview"));
const Testimonials = dynamic(() => import("@/components/home/Testimonials"));

/**
 * Ana sayfa bölüm sırası (Sprint 2C — G9-G14):
 * 1. HeroSlider — Ana banner
 * 2. PromoBanner — Kampanya barı
 * 3. CategoryCards — Ürün kategorileri
 * 4. FeaturedProducts — Öne çıkan ürünler
 * 5. FlashSale — Flaş indirimler (countdown)
 * 6. BestSellers — Öne çıkan indirimler
 * 7. TrendingProducts — Trend ürünler
 * 8. CampaignRadar — Kampanya radar
 * 9. TrustBadges — Güven rozeti barı
 * 7. WhyChooseUs — Neden biz
 * 8. Newsletter — E-posta abonelik
 * 9. BlogPreview — Blog önizleme
 * 10. Testimonials — Müşteri yorumları
 */
export default function HomePage() {
  return (
    <>
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildWebSiteSchema()} />
      <Suspense fallback={<div className="min-h-[380px] animate-pulse bg-dark-900 sm:min-h-[450px] lg:min-h-[540px]" />}>
        <HeroSlider />
      </Suspense>
      <PromoBanner />
      <Suspense fallback={<div className="py-12 sm:py-16"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-48 animate-pulse rounded-xl bg-dark-100" />))}</div></div></div>}>
        <CategoryCards />
      </Suspense>
      <Suspense fallback={<div className="bg-dark-50 py-12 sm:py-16"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-72 animate-pulse rounded-xl bg-dark-100" />))}</div></div></div>}>
        <FeaturedProducts />
      </Suspense>
      <FlashSale />
      <BestSellers />
      <TrendingProducts />
      <CampaignRadar />
      <Suspense fallback={<div className="border-y border-dark-100 bg-white dark:bg-dark-800 py-6 sm:py-8"><div className="container-custom"><div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">{Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded bg-dark-50 dark:bg-dark-800" />))}</div></div></div>}>
        <TrustBadges />
      </Suspense>
      <WhyChooseUs />
      <Newsletter />
      <Suspense fallback={<div className="py-12 sm:py-16"><div className="container-custom"><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-72 animate-pulse rounded-xl bg-dark-100" />))}</div></div></div>}>
        <BlogPreview />
      </Suspense>
      <Suspense fallback={<div className="bg-dark-900 py-12 sm:py-16"><div className="container-custom"><div className="mx-auto h-48 max-w-2xl animate-pulse rounded-xl bg-dark-800" /></div></div>}>
        <Testimonials />
      </Suspense>
    </>
  );
}
