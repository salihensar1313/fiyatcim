import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şifremi Unuttum",
  description: "Fiyatcim.com şifre sıfırlama. E-posta adresinize şifre sıfırlama bağlantısı gönderin.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
