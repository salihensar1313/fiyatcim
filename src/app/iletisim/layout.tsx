import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Fiyatcim.com ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz. Güvenlik sistemleri hakkında sorularınız için bize ulaşın.",
  alternates: { canonical: "/iletisim" },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
