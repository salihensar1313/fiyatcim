import type { Metadata } from "next";
import { Crown, Wrench, Headphones, Shield, Zap, Settings, RefreshCw, Check, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { PREMIUM_PRICE_WITH_ORDER, PREMIUM_PRICE_STANDALONE, PREMIUM_BENEFITS } from "@/lib/premium";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Premium Üyelik — Ücretsiz Kurulum & 7/24 Destek | Fiyatcim",
  description: "Fiyatcim Premium ile ücretsiz profesyonel kurulum, 7/24 öncelikli destek, genişletilmiş garanti ve aynı gün kargo ayrıcalıklarından yararlanın.",
  alternates: { canonical: "/premium" },
};

const ICON_MAP = { Wrench, Headphones, Shield, Zap, Settings, RefreshCw };

export default function PremiumPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Premium Üyelik" }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-16 sm:py-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="container-custom relative z-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-5 py-2">
            <Crown size={20} className="text-amber-400" />
            <span className="text-sm font-bold text-amber-400">Premium Üyelik</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
            Güvenlik Sisteminizi <br className="hidden sm:block" />
            <span className="text-amber-400">Biz Kuralım!</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-dark-300 sm:text-lg">
            Premium üye olun, satın aldığınız tüm ürünlerin profesyonel kurulumunu ücretsiz yaptırın.
            7/24 teknik destek, genişletilmiş garanti ve çok daha fazlası.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/urunler"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-10 py-4 text-lg font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:shadow-amber-500/25"
            >
              <Crown size={20} />
              Hemen Alışverişe Başla
              <ArrowRight size={18} />
            </Link>
            <p className="text-sm text-dark-400">
              Siparişle birlikte <strong className="text-amber-400">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="container-custom -mt-10 relative z-20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PREMIUM_BENEFITS.map((b) => {
            const Icon = ICON_MAP[b.icon];
            return (
              <div key={b.title} className="rounded-xl border border-dark-100 bg-white p-6 dark:border-dark-700 dark:bg-dark-800">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Icon size={20} className="text-amber-600" />
                </div>
                <h3 className="mb-1 text-base font-bold text-dark-900 dark:text-dark-50">{b.title}</h3>
                <p className="text-sm text-dark-500 dark:text-dark-400">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="container-custom mt-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-dark-900 dark:text-dark-50 sm:text-3xl">Fiyatlandırma</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">Siparişle birlikte alın, %17 tasarruf edin</p>
        </div>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Siparişle birlikte */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-white p-8 dark:bg-dark-800">
            <div className="absolute -right-6 top-6 rotate-45 bg-amber-500 px-10 py-1 text-xs font-bold text-white">
              ÖNERİLEN
            </div>
            <p className="mb-1 text-sm font-medium text-amber-600">Siparişle Birlikte</p>
            <p className="mb-1 text-4xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</p>
            <p className="mb-6 text-xs text-dark-500">Tek seferlik ödeme</p>
            <ul className="mb-8 space-y-3">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-2 text-sm text-dark-700 dark:text-dark-200">
                  <Check size={16} className="shrink-0 text-green-500" />
                  {b.title}
                </li>
              ))}
            </ul>
            <Link
              href="/urunler"
              className="block w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-center text-sm font-bold text-white transition-all hover:from-amber-600 hover:to-orange-600"
            >
              Alışverişe Başla
            </Link>
          </div>

          {/* Sadece Premium */}
          <div className="rounded-2xl border border-dark-200 bg-white p-8 dark:border-dark-700 dark:bg-dark-800">
            <p className="mb-1 text-sm font-medium text-dark-500">Sadece Premium</p>
            <p className="mb-1 text-4xl font-bold text-dark-900 dark:text-dark-50">{formatPrice(PREMIUM_PRICE_STANDALONE)}</p>
            <p className="mb-6 text-xs text-dark-500">Tek seferlik ödeme</p>
            <ul className="mb-8 space-y-3">
              {PREMIUM_BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-2 text-sm text-dark-700 dark:text-dark-200">
                  <Check size={16} className="shrink-0 text-green-500" />
                  {b.title}
                </li>
              ))}
            </ul>
            <a
              href="tel:"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dark-200 py-3.5 text-sm font-bold text-dark-700 transition-all hover:bg-dark-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-700"
            >
              <Phone size={16} />
              Bizi Arayın
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-custom mt-16">
        <h2 className="mb-6 text-center text-xl font-bold text-dark-900 dark:text-dark-50">Sık Sorulan Sorular</h2>
        <div className="mx-auto max-w-2xl space-y-4">
          {[
            { q: "Premium üyelik ne kadar süre geçerli?", a: "Premium üyelik, satın aldığınız ürünler için süresiz geçerlidir. Kurulum, garanti uzatımı ve bakım hizmeti ürün ömrü boyunca devam eder." },
            { q: "Kurulum hangi şehirlerde yapılıyor?", a: "Türkiye genelinde tüm il ve ilçelerde profesyonel kurulum hizmeti sunuyoruz. Anlaşmalı yetkili servis ağımız ile hızlı kurulum sağlıyoruz." },
            { q: "Daha önce aldığım ürünler için de geçerli mi?", a: "Evet! Sadece Premium paketini (₺3.000) satın alarak daha önce aldığınız ürünler için de kurulum hizmeti alabilirsiniz." },
            { q: "Siparişteki indirimli fiyattan nasıl yararlanırım?", a: "Sepetinizde ürün varken Premium üyelik eklerseniz otomatik olarak ₺2.500 fiyat uygulanır. Normal fiyatı ₺3.000'dir." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-dark-100 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-dark-900 dark:text-dark-50">
                {faq.q}
                <span className="ml-2 text-dark-400 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <p className="mt-3 text-sm text-dark-600 dark:text-dark-300">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
