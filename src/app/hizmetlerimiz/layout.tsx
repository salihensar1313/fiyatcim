import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hizmetlerimiz",
  description:
    "Fiyatcim.com hizmetleri: uzman rehberler, karşılaştırmalar, güvenli alışveriş, hızlı kargo ve müşteri desteği.",
  alternates: { canonical: "/hizmetlerimiz" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
