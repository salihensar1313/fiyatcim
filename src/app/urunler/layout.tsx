import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tüm Ürünler — Alarm ve Güvenlik Sistemleri",
  description: "Alarm sistemleri, güvenlik kameraları, akıllı ev çözümleri ve yangın algılama sistemleri. Fiyatcim.com'da en uygun fiyatlarla alışveriş yapın.",
  alternates: { canonical: "/urunler" },
};

export default function UrunlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
