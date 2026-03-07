"use client";

import Link from "next/link";
import { FileText, Image, HelpCircle, Megaphone, Grid3X3, ShieldCheck, Layout, MessageSquare, Star } from "lucide-react";

export default function AdminContentPage() {
  const sections = [
    {
      label: "Slider",
      desc: "Ana sayfa slider görselleri",
      icon: Image,
      href: "/admin/icerik/slider",
    },
    {
      label: "Blog Yazıları",
      desc: "Blog içerikleri ekleme, düzenleme",
      icon: FileText,
      href: "/admin/icerik/blog",
    },
    {
      label: "Kampanya Bandı",
      desc: "Ana sayfadaki kampanya barı",
      icon: Megaphone,
      href: "/admin/icerik/kampanya",
    },
    {
      label: "Kategoriler",
      desc: "Ana sayfa kategori kartları",
      icon: Grid3X3,
      href: "/admin/icerik/kategoriler",
    },
    {
      label: "Güven Rozetleri",
      desc: "Ücretsiz kargo, güvenli ödeme vs.",
      icon: ShieldCheck,
      href: "/admin/icerik/guven-rozetleri",
    },
    {
      label: "Sayfa İçerikleri",
      desc: "Neden Biz ve Bülten bölümleri",
      icon: Layout,
      href: "/admin/icerik/sayfalar",
    },
    {
      label: "Ürün Yorumları",
      desc: "Ürün değerlendirmeleri moderasyonu",
      icon: Star,
      href: "/admin/icerik/urun-yorumlari",
    },
    {
      label: "Müşteri Yorumları",
      desc: "Ana sayfa müşteri referansları",
      icon: MessageSquare,
      href: "/admin/icerik/yorumlar",
    },
    {
      label: "SSS",
      desc: "Sıkça sorulan sorular yönetimi",
      icon: HelpCircle,
      href: "/admin/icerik/sss",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">İçerik Yönetimi</h1>
        <p className="text-sm text-dark-500 dark:text-dark-400">Ana sayfa bölümleri, blog, slider ve daha fazlasını düzenleyin</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.label}
            href={section.href}
            className="cursor-pointer rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600">
              <section.icon size={24} />
            </div>
            <h3 className="font-bold text-dark-900 dark:text-dark-50">{section.label}</h3>
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
