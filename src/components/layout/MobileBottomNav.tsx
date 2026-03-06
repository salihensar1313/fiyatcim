"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV_ITEMS = [
  { label: "Ana Sayfa", href: "/", icon: Home, key: "home" },
  { label: "Kategoriler", href: "/urunler", icon: Grid3X3, key: "categories" },
  { label: "Sepet", href: "/sepet", icon: ShoppingCart, key: "cart" },
  { label: "Hesabım", href: "/hesabim", icon: User, key: "account" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-dark-100 bg-white dark:bg-dark-800 lg:hidden dark:border-dark-700 dark:bg-dark-800">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary-600" : "text-dark-400"
              }`}
            >
              <div className="relative">
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {item.key === "cart" && cartCount > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              {item.label}
              {active && (
                <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-600" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for notched phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
