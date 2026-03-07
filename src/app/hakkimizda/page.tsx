import type { Metadata } from "next";
import { Target, Eye, CheckCircle, Shield, Lightbulb } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_FULL_NAME, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Fiyatcim.com hakkında bilgi edinin. Uzman onaylı elektronik ürünler ve güvenilir alışveriş deneyimi.",
  alternates: { canonical: `${SITE_URL}/hakkimizda` },
};

export default function AboutPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Hakkımızda" }]} />
      </div>

      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="mb-12 rounded-xl bg-dark-900 p-8 text-center text-white md:p-16">
          <h1 className="text-3xl font-bold md:text-4xl">{SITE_FULL_NAME}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-dark-300">
            Fiyatcim.com, elektronik alışverişinde doğru karar vermen için rehber içerikler,
            karşılaştırmalar ve şeffaf alışveriş deneyimi sunar. Hedefimiz; önce Türkiye&apos;nin
            elektronik rehberi olmak, sonra en güvenilir elektronik mağazası olarak güveni büyütmek
            ve uzun vadede Türkiye&apos;nin en büyük elektronik platformuna dönüşmektir.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { value: "500+", label: "Kapsamlı rehber & karşılaştırma hedefi" },
            { value: "100+", label: "Marka ve kategori ölçek hedefi (Yıl 1)" },
            { value: "%100", label: "Şeffaflık + güven odaklı yaklaşım" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6 text-center">
              <span className="text-3xl font-bold text-primary-600">{stat.value}</span>
              <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Misyon & Vizyon */}
        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
              <Target size={20} />
            </div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">Misyon</h2>
            <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">
              Elektronik ürün seçiminde karmaşayı azaltmak: teknik detayları anlaşılır hale getirerek,
              kullanıcıya doğru ürünü doğru ihtiyaç için seçtirmek.
            </p>
          </div>
          <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
              <Eye size={20} />
            </div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">Vizyon</h2>
            <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">
              İçerik otoritesiyle başlayan yolculuğu, güven mekanizmaları ve ölçeklenebilir altyapıyla
              büyütüp Türkiye&apos;nin en büyük elektronik platformuna taşımak.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-bold text-dark-900 dark:text-dark-50">Neden Fiyatcim?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Lightbulb,
                title: "Uzman Onay",
                desc: "Rehber içerikler, karşılaştırmalar ve seçim kriterleri ile doğru kararı vermen için yanındayız.",
              },
              {
                icon: Shield,
                title: "Güven",
                desc: "Şeffaf süreçler, açık iletişim ve kullanıcı odaklı destek. Her adımda güvenini kazanmak için çalışıyoruz.",
              },
              {
                icon: CheckCircle,
                title: "Doğru Ürün",
                desc: "İhtiyaca göre yönlendirme, sade ve anlaşılır deneyim. Binlerce ürün arasından senin için doğru olanı bul.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                  <item.icon size={20} />
                </div>
                <h3 className="font-bold text-dark-900 dark:text-dark-50">{item.title}</h3>
                <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
