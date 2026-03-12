import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arama Sonuçları",
  description: "Fiyatcim.com ürün arama sonuçları. Aradığınız alarm ve güvenlik sistemi ürünlerini kolayca bulun.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
