"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  Heart,
  ChevronDown,
  Package,
  GitCompareArrows,
  Phone,
  ShieldCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import { SITE_FULL_NAME, CONTACT } from "@/lib/constants";
import { MEGA_MENU_DATA } from "@/lib/nav";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import MobileMenu from "./MobileMenu";
import NotificationBell from "@/components/ui/NotificationBell";
import SearchAutocomplete from "./SearchAutocomplete";
import AccountDropdown from "@/components/ui/AccountDropdown";
import { useCompare } from "@/hooks/useCompare";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const megaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const { getCount: getWishlistCount } = useWishlist();
  const { usdTry, isLoading: currencyLoading } = useCurrency();
  const { compareCount } = useCompare();

  const cartCount = getItemCount();
  const wishlistCount = getWishlistCount();

  // G4: Scroll throttle — requestAnimationFrame
  const rafRef = useRef(0);
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 40);
      rafRef.current = 0;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    };
  }, [handleScroll]);

  const handleMegaEnter = (key: string) => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setActiveMega(key);
  };

  const handleMegaLeave = () => {
    megaTimeoutRef.current = setTimeout(() => setActiveMega(null), 150);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full transition-shadow ${
          isScrolled ? "shadow-lg" : ""
        }`}
      >
        {/* Trust Bar — Desktop Only */}
        <div className="hidden border-b border-dark-800 bg-dark-950 py-1.5 lg:block">
          <div className="container-custom flex items-center justify-between text-xs text-dark-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-primary-500" />
                {CONTACT.phone}
              </span>
              <span className="text-dark-600">|</span>
              <span>{CONTACT.workingHours}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-green-400">
                <ShieldCheck size={13} />
                SSL Güvenli Alışveriş
              </span>
              <span className="text-dark-600">|</span>
              <span className="flex items-center gap-1.5">
                <RotateCcw size={12} />
                14 Gün İade Garantisi
              </span>
              <span className="text-dark-600">|</span>
              <span className="flex items-center gap-1.5">
                <Truck size={12} />
                2.000₺+ Ücretsiz Kargo
              </span>
            </div>
          </div>
        </div>

        {/* Dark Top Bar */}
        <div className="bg-dark-900">
          <div className="container-custom flex items-center justify-between gap-4 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-white hover:bg-dark-700 lg:hidden"
              aria-label="Menüyü aç"
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center">
              <Image src="/images/logo-white.png" alt={SITE_FULL_NAME} width={180} height={50} priority className="h-10 w-auto sm:h-14" />
            </Link>

            {/* Exchange Rate Badge */}
            <div className="hidden items-center gap-1.5 rounded-md bg-dark-800 px-3 py-1.5 text-xs lg:flex">
              <span className="font-medium text-dark-400">$1</span>
              <span className="text-dark-500 dark:text-dark-400">=</span>
              <span className="font-bold text-green-400">
                {currencyLoading ? "..." : `₺${usdTry.toFixed(2)}`}
              </span>
            </div>

            {/* Search - Desktop */}
            <div className="hidden flex-1 lg:block lg:max-w-xl">
              <SearchAutocomplete />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Wishlist */}
              <Link
                href="/hesabim/favorilerim"
                className="relative rounded-lg p-2 text-dark-300 hover:text-white"
                aria-label="Favorilerim"
              >
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Compare — only show when items are in compare list */}
              {compareCount > 0 && (
                <Link
                  href="/karsilastir"
                  className="relative rounded-lg p-2 text-dark-300 hover:text-white"
                  aria-label={`Karşılaştır (${compareCount} ürün)`}
                >
                  <GitCompareArrows size={22} />
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {compareCount}
                  </span>
                </Link>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Cart */}
              <Link
                href="/sepet"
                className="relative rounded-lg p-2 text-dark-300 hover:text-white"
                aria-label="Sepetim"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <AccountDropdown />
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="bg-dark-800 px-4 py-2 lg:hidden">
          <SearchAutocomplete isMobile />
        </div>

        {/* Red Navigation Bar - Desktop with Mega Menu */}
        <nav className="hidden bg-primary-600 lg:block">
          <div className="container-custom flex items-center gap-0">
            {MEGA_MENU_DATA.map((megaItem) => (
              <div
                key={megaItem.key}
                className="relative"
                onMouseEnter={() => handleMegaEnter(megaItem.key)}
                onMouseLeave={handleMegaLeave}
              >
                <Link
                  href={megaItem.href}
                  className={`flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors hover:bg-primary-700 ${
                    pathname.startsWith(megaItem.href) ? "bg-primary-700 text-white" : "text-white"
                  }`}
                >
                  {megaItem.label}
                  <ChevronDown size={14} className={`transition-transform ${activeMega === megaItem.key ? "rotate-180" : ""}`} />
                </Link>

                {/* Mega dropdown */}
                {activeMega === megaItem.key && (
                  <div
                    className="absolute left-0 top-full z-40 w-72 rounded-b-xl border border-t-0 border-dark-100 bg-white dark:bg-dark-800 py-3 shadow-xl dark:border-dark-700"
                    onMouseEnter={() => handleMegaEnter(megaItem.key)}
                    onMouseLeave={handleMegaLeave}
                  >
                    {/* Category header */}
                    <div className="mb-2 flex items-center gap-2 px-4">
                      <megaItem.icon size={18} className="text-primary-600" />
                      <Link
                        href={megaItem.href}
                        className="text-sm font-bold text-dark-900 hover:text-primary-600 dark:text-dark-50"
                      >
                        Tümünü Gör
                      </Link>
                    </div>
                    <div className="mx-4 mb-2 h-px bg-dark-100 dark:bg-dark-700" />
                    {/* Sub-items */}
                    {megaItem.items.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-dark-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-dark-300 dark:hover:bg-dark-700"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Tüm Ürünler */}
            <Link
              href="/urunler"
              className={`flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors hover:bg-primary-700 ${
                pathname === "/urunler" ? "bg-primary-700 text-white" : "text-white"
              }`}
            >
              <Package size={14} />
              Tüm Ürünler
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
