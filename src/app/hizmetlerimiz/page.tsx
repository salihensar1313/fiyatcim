"use client";

import { BookOpen, ShieldCheck, Truck, Headphones, RefreshCcw, Award } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      icon: BookOpen,
      title: "Uzman Rehberler",
      desc: "Uzman onaylı rehber içerikler ve karşılaştırmalarla doğru ürünü seçmeni sağlıyoruz. Her kategoride detaylı seçim kriterleri.",
    },
    {
      icon: ShieldCheck,
      title: "Güvenli Alışveriş",
      desc: "SSL korumalı ödeme, güvenilir kargo partnerleri ve şeffaf süreçlerle güvenli alışveriş deneyimi.",
    },
    {
      icon: Truck,
      title: "Hızlı Teslimat",
      desc: "Türkiye genelinde hızlı ve güvenli kargo. Sipariş takibi ve kargo bilgilendirme.",
    },
    {
      icon: RefreshCcw,
      title: "Kolay İade & Değişim",
      desc: "Memnun kalmadığın ürünleri kolayca iade edebilir veya değiştirebilirsin. Şeffaf iade politikası.",
    },
    {
      icon: Headphones,
      title: "Müşteri Desteği",
      desc: "Satış öncesi ve sonrası destek. Ürün seçimi danışmanlığı ve teknik sorularına yanıt.",
    },
    {
      icon: Award,
      title: "Orijinal Ürün Garantisi",
      desc: "Tüm ürünler orijinal ve garantili. Yetkili distribütör ve üretici güvencesi.",
    },
  ];

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Hizmetlerimiz" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">Hizmetlerimiz</h1>
          <p className="mx-auto mt-2 max-w-xl text-dark-500 dark:text-dark-400">
            Elektronik alışverişinde güvenli, hızlı ve bilinçli bir deneyim sunuyoruz.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                <service.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-dark-900 dark:text-dark-50">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dark-600 dark:text-dark-300">{service.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-xl bg-primary-600 p-8 text-center text-white md:p-12">
          <h2 className="text-2xl font-bold">Doğru Ürünü Bulmana Yardımcı Olalım</h2>
          <p className="mx-auto mt-2 max-w-xl text-primary-100">
            İhtiyacına uygun elektronik ürünü seçmekte zorlanıyorsan, bize ulaş.
          </p>
          <Link
            href="/iletisim"
            className="mt-6 inline-block rounded-lg bg-white dark:bg-dark-800 px-8 py-3 text-sm font-bold text-primary-600 transition-colors hover:bg-dark-50 dark:bg-dark-800"
          >
            İletişime Geç
          </Link>
        </div>
      </div>
    </div>
  );
}
