import Link from "next/link";
import { Camera, ShieldAlert, Lock, TrendingDown, Sparkles, Tag } from "lucide-react";

const quickLinks = [
  {
    label: "Kamera Setleri",
    href: "/kategori/guvenlik-kameralari",
    icon: Camera,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Alarm Paketleri",
    href: "/kategori/alarm-sistemleri",
    icon: ShieldAlert,
    color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    label: "Akıllı Kilit",
    href: "/kategori/akilli-kilit",
    icon: Lock,
    color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    label: "Fiyatı Düşenler",
    href: "/kampanyalar",
    icon: TrendingDown,
    color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    label: "Yeni Ürünler",
    href: "/urunler?sort=newest",
    icon: Sparkles,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    label: "Kampanyalar",
    href: "/kampanyalar",
    icon: Tag,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
];

export default function QuickAccessGrid() {
  return (
    <section className="border-b border-dark-100 bg-white py-4 dark:border-dark-700 dark:bg-dark-800">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide sm:gap-6 md:gap-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="flex flex-col items-center gap-2 px-2 transition-transform hover:scale-105 active:scale-95"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-full ${link.color} sm:h-16 sm:w-16`}>
                <link.icon size={24} />
              </div>
              <span className="whitespace-nowrap text-[11px] font-medium text-dark-700 dark:text-dark-200 sm:text-xs">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
