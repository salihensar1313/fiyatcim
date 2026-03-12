import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kampanyalar — İndirimli Güvenlik Ürünleri",
  description: "Alarm sistemleri ve güvenlik ürünlerinde güncel kampanyalar, indirimler ve fırsatlar. Fiyatcim.com'da en avantajlı fiyatları yakalayın.",
  alternates: { canonical: "/kampanyalar" },
};

export default function KampanyalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
