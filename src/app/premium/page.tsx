import type { Metadata } from "next";
import { Crown, Wrench, Headphones, Shield, Zap, Truck, Settings, RefreshCw, Tv, Music, Check, Phone, ArrowRight, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { PREMIUM_PRICE_WITH_ORDER, PREMIUM_PRICE_STANDALONE, PREMIUM_BENEFITS } from "@/lib/premium";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Premium Üyelik — Ücretsiz Kurulum & 7/24 Destek | Fiyatcim",
  description: "Fiyatcim Premium ile ücretsiz profesyonel kurulum, 7/24 öncelikli destek, genişletilmiş garanti, Netflix & Spotify hediye ve ücretsiz kargo ayrıcalıklarından yararlanın.",
  alternates: { canonical: "/premium" },
};

const ICON_MAP: Record<string, typeof Shield> = { Wrench, Headphones, Shield, Zap, Truck, Settings, RefreshCw, Tv, Music };

export default function PremiumPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Premium Üyelik" }]} />
      </div>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 py-20 sm:py-28">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 animate-float rounded-full bg-amber-500/8 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 animate-float rounded-full bg-orange-500/8 blur-3xl" style={{ animationDelay: "1.5s" }} />
          <div className="absolute left-1/2 top-1/4 h-60 w-60 animate-float rounded-full bg-yellow-500/5 blur-3xl" style={{ animationDelay: "0.8s" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="container-custom relative z-10 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex animate-slide-up items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 backdrop-blur-sm">
            <Crown size={18} className="animate-float text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Premium Üyelik</span>
            <Sparkles size={14} className="text-amber-400/60" />
          </div>

          <h1 className="mb-5 animate-slide-up text-4xl font-bold tracking-tight text-white sm:text-6xl" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            Güvenlik Sisteminizi{" "}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent">
              Biz Kuralım!
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl animate-slide-up text-base text-dark-300 sm:text-lg" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            Premium üye olun, satın aldığınız tüm ürünlerin profesyonel kurulumunu ücretsiz yaptırın.
            Netflix, Spotify, ücretsiz kargo ve çok daha fazlası.
          </p>

          {/* CTA */}
          <div className="flex animate-slide-up flex-col items-center justify-center gap-5 sm:flex-row" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            <Link
              href="/urunler"
              className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-amber-500/25 transition-all hover:shadow-2xl hover:shadow-amber-500/40"
            >
              {/* Shine */}
              <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <Crown size={22} className="relative z-10" />
              <span className="relative z-10">Hemen Alışverişe Başla</span>
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
            </Link>
            <div className="text-center sm:text-left">
              <p className="text-2xl font-bold text-white">
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</span>
                <span className="ml-2 text-base text-dark-500 line-through">{formatPrice(PREMIUM_PRICE_STANDALONE)}</span>
              </p>
              <p className="text-xs text-dark-500">Siparişle birlikte alındığında</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-12 flex animate-slide-up flex-wrap justify-center gap-8" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
            {[
              { num: "9", label: "Ayrıcalık" },
              { num: "%17", label: "Tasarruf" },
              { num: "7/24", label: "Destek" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-amber-400 sm:text-3xl">{s.num}</p>
                <p className="text-xs text-dark-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS GRID ═══════════ */}
      <section className="container-custom -mt-12 relative z-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_BENEFITS.map((b, i) => {
            const Icon = ICON_MAP[b.icon] || Shield;
            return (
              <div
                key={b.title}
                className="group animate-slide-up rounded-2xl border border-dark-100 bg-white p-6 transition-all hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 dark:border-dark-700 dark:bg-dark-800 dark:hover:border-amber-600/30"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 transition-transform group-hover:scale-110 dark:from-amber-900/30 dark:to-orange-900/30">
                  <Icon size={22} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="mb-1.5 text-base font-bold text-dark-900 dark:text-dark-50">{b.title}</h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section className="container-custom mt-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-dark-900 dark:text-dark-50 sm:text-4xl">Fiyatlandırma</h2>
          <p className="mt-2 text-base text-dark-500 dark:text-dark-400">Siparişle birlikte alın, %17 tasarruf edin</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Siparişle birlikte — HIGHLIGHTED */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-white shadow-xl shadow-amber-500/10 animate-premium-glow dark:bg-dark-800">
            {/* Ribbon */}
            <div className="absolute -right-8 top-7 rotate-45 bg-gradient-to-r from-amber-500 to-orange-500 px-12 py-1.5 text-xs font-bold text-white shadow-md">
              ÖNERİLEN
            </div>
            {/* Shine */}
            <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-amber-500/5 to-transparent" />

            <div className="relative p-8">
              <div className="mb-1 flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <p className="text-sm font-bold text-amber-600">Siparişle Birlikte</p>
              </div>
              <p className="mb-1 bg-gradient-to-r from-dark-900 to-dark-700 bg-clip-text text-5xl font-bold text-transparent dark:from-white dark:to-dark-200">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</p>
              <p className="mb-8 text-xs text-dark-500">Tek seferlik ödeme</p>
              <ul className="mb-8 space-y-3">
                {PREMIUM_BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-center gap-2.5 text-sm text-dark-700 dark:text-dark-200">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Check size={12} className="text-green-600" />
                    </div>
                    {b.title}
                  </li>
                ))}
              </ul>
              <Link
                href="/urunler"
                className="group relative block w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-4 text-center text-base font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30"
              >
                <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <span className="relative z-10">Alışverişe Başla</span>
              </Link>
            </div>
          </div>

          {/* Sadece Premium */}
          <div className="rounded-3xl border border-dark-200 bg-white p-8 dark:border-dark-700 dark:bg-dark-800">
            <p className="mb-1 text-sm font-medium text-dark-500">Sadece Premium</p>
            <p className="mb-1 text-5xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(PREMIUM_PRICE_STANDALONE)}</p>
            <p className="mb-8 text-xs text-dark-500">Tek seferlik ödeme</p>
            <ul className="mb-8 space-y-3">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-2.5 text-sm text-dark-700 dark:text-dark-200">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <Check size={12} className="text-green-600" />
                  </div>
                  {b.title}
                </li>
              ))}
            </ul>
            <a
              href="tel:"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dark-200 py-4 text-base font-bold text-dark-700 transition-all hover:border-dark-300 hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <Phone size={18} />
              Bizi Arayın
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="container-custom mt-20">
        <h2 className="mb-8 text-center text-2xl font-bold text-dark-900 dark:text-dark-50">Sık Sorulan Sorular</h2>
        <div className="mx-auto max-w-2xl space-y-4">
          {[
            { q: "Premium üyelik ne kadar süre geçerli?", a: "Premium üyelik, satın aldığınız ürünler için süresiz geçerlidir. Kurulum, garanti uzatımı ve bakım hizmeti ürün ömrü boyunca devam eder." },
            { q: "Kurulum hangi şehirlerde yapılıyor?", a: "Türkiye genelinde tüm il ve ilçelerde profesyonel kurulum hizmeti sunuyoruz. Anlaşmalı yetkili servis ağımız ile hızlı kurulum sağlıyoruz." },
            { q: "Netflix ve Spotify hediyesi nasıl çalışıyor?", a: "Premium üyeliğiniz aktifleştirildikten sonra 1 aylık Netflix ve Spotify Premium hediye kodlarınız e-posta ile gönderilir." },
            { q: "Daha önce aldığım ürünler için de geçerli mi?", a: "Evet! Sadece Premium paketini (₺3.000) satın alarak daha önce aldığınız ürünler için de kurulum hizmeti alabilirsiniz." },
            { q: "Siparişteki indirimli fiyattan nasıl yararlanırım?", a: "Sepetinizde ürün varken Premium üyelik eklerseniz otomatik olarak ₺2.500 fiyat uygulanır. Normal fiyatı ₺3.000'dir." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-dark-100 bg-white p-5 transition-all hover:border-amber-200/50 hover:shadow-sm dark:border-dark-700 dark:bg-dark-800">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-dark-900 dark:text-dark-50">
                {faq.q}
                <span className="ml-3 text-dark-400 transition-transform duration-200 group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ═══════════ BOTTOM CTA ═══════════ */}
      <section className="container-custom mt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-60 w-60 animate-float rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 animate-float rounded-full bg-orange-500/10 blur-3xl" style={{ animationDelay: "1s" }} />
          </div>
          <div className="relative z-10">
            <Crown size={40} className="mx-auto mb-4 animate-float text-amber-400" />
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Hâlâ düşünüyor musunuz?</h2>
            <p className="mx-auto mb-8 max-w-lg text-sm text-dark-300">
              Premium ile güvenlik sisteminizin kurulumunu profesyonellere bırakın.
              Netflix, Spotify ve ücretsiz kargo bonusuyla şimdi katılın!
            </p>
            <Link
              href="/urunler"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-amber-500/25 transition-all hover:shadow-2xl"
            >
              <div className="absolute inset-0 animate-premium-shine bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative z-10">Premium Üye Ol</span>
              <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
