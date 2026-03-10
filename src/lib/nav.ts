import { Shield, Camera, Home, Fingerprint } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MegaMenuItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  items: { label: string; href: string }[];
}

export const MEGA_MENU_DATA: MegaMenuItem[] = [
  {
    key: "alarm",
    label: "Alarm Sistemleri",
    href: "/kategori/alarm-sistemleri",
    icon: Shield,
    items: [
      { label: "Kablosuz Alarm Setleri", href: "/urunler?search=kablosuz+alarm" },
      { label: "Kablolu Alarm Panelleri", href: "/urunler?search=kablolu+alarm" },
      { label: "Alarm Sensörleri", href: "/urunler?search=alarm+sensör" },
      { label: "Alarm Aksesuarları", href: "/urunler?search=alarm+aksesuar" },
    ],
  },
  {
    key: "kamera",
    label: "Güvenlik Kameraları",
    href: "/kategori/guvenlik-kameralari",
    icon: Camera,
    items: [
      { label: "IP Kamera Sistemleri", href: "/urunler?search=ip+kamera" },
      { label: "Analog Kamera Setleri", href: "/urunler?search=analog+kamera" },
      { label: "NVR / DVR Kayıt Cihazları", href: "/urunler?search=nvr+dvr" },
      { label: "Kamera Aksesuarları", href: "/urunler?search=kamera+aksesuar" },
    ],
  },
  {
    key: "akilli-ev",
    label: "Akıllı Ev",
    href: "/kategori/akilli-ev-sistemleri",
    icon: Home,
    items: [
      { label: "Akıllı Priz & Anahtar", href: "/urunler?search=akıllı+priz" },
      { label: "Akıllı Aydınlatma", href: "/urunler?search=akıllı+aydınlatma" },
      { label: "Akıllı Sensörler", href: "/urunler?search=akıllı+sensör" },
      { label: "Akıllı Ev Hub", href: "/urunler?search=akıllı+ev+hub" },
    ],
  },
  {
    key: "gecis",
    label: "Geçiş Kontrol",
    href: "/kategori/gecis-kontrol-sistemleri",
    icon: Fingerprint,
    items: [
      { label: "Parmak İzi Sistemleri", href: "/urunler?search=parmak+izi" },
      { label: "Kartlı Geçiş", href: "/urunler?search=kartlı+geçiş" },
      { label: "Turnike Sistemleri", href: "/urunler?search=turnike" },
      { label: "Kapı Otomasyonu", href: "/urunler?search=kapı+otomasyon" },
    ],
  },
];
