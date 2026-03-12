import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sipariş Takip",
  description: "Fiyatcim.com sipariş takip. Sipariş numaranızla kargonuzun durumunu öğrenin.",
  alternates: { canonical: "/siparis-takip" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
