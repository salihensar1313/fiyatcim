import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Fiyatcim.com ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz. Güvenlik sistemleri hakkında sorularınız için bize ulaşın.",
  alternates: { canonical: "/iletisim" },
  openGraph: {
    title: "İletişim",
    description: "Fiyatcim.com ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz. Güvenlik sistemleri hakkında sorularınız için bize ulaşın.",
    url: `${SITE_URL}/iletisim`,
    type: "website",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "İletişim",
    description: "Fiyatcim.com ile iletişime geçin. Adres, telefon ve e-posta bilgilerimiz. Güvenlik sistemleri hakkında sorularınız için bize ulaşın.",
    images: ["/images/og-default.png"],
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
