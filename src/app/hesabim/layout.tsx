import type { Metadata } from "next";
import HesabimShell from "./HesabimShell";

export const metadata: Metadata = {
  title: "Hesabım",
  description: "Fiyatcim.com hesap yönetimi. Siparişlerinizi, favorilerinizi ve adreslerinizi yönetin.",
  robots: { index: false, follow: false },
};

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  return <HesabimShell>{children}</HesabimShell>;
}
