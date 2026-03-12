import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kargo Bilgileri",
  description:
    "Fiyatcim.com kargo ve teslimat bilgileri. Ücretsiz kargo koşulları, teslimat süreleri ve kargo takip detayları.",
  alternates: { canonical: "/kargo-bilgileri" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
