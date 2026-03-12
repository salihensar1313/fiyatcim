import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Üye Ol",
  description: "Fiyatcim.com üyelik oluşturun. Özel indirimlerden yararlanın, siparişlerinizi kolayca takip edin.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
