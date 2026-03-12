import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ürün Karşılaştırma",
  description: "Fiyatcim.com ürün karşılaştırma. Alarm ve güvenlik sistemi ürünlerini detaylı olarak karşılaştırın.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
