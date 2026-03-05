"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileText,
  Settings,
  RotateCcw,
  Tag,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Ürünler", href: "/admin/urunler", icon: Package },
  { label: "Siparişler", href: "/admin/siparisler", icon: ShoppingBag },
  { label: "Kuponlar", href: "/admin/kuponlar", icon: Tag },
  { label: "İadeler", href: "/admin/iadeler", icon: RotateCcw },
  { label: "Müşteriler", href: "/admin/musteriler", icon: Users },
  { label: "İçerik", href: "/admin/icerik", icon: FileText },
  { label: "SEO", href: "/admin/seo", icon: Globe },
  { label: "Ayarlar", href: "/admin/ayarlar", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-dark-200 bg-dark-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-dark-700 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-xs font-bold">
          FC
        </div>
        <div>
          <p className="text-sm font-bold">{SITE_NAME}</p>
          <p className="text-xs text-dark-400">Admin Panel</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-primary-600 text-white"
                      : "text-dark-300 hover:bg-dark-800 hover:text-white"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Back to site */}
      <div className="border-t border-dark-700 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-dark-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Siteye Dön
        </Link>
      </div>
    </aside>
  );
}
