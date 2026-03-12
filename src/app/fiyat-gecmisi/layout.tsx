import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fiyat Geçmişi",
  description: "Ürün fiyat geçmişi ve fiyat değişim grafiği. En uygun zamanı yakalayın.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
