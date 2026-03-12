import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Fiyatcim.com hesabınıza giriş yapın. Siparişlerinizi takip edin, favorilerinizi yönetin.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
