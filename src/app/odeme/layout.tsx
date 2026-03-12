import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ödeme",
  description: "Fiyatcim.com güvenli ödeme sayfası.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
