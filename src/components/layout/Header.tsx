"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  Heart,
  Package,
  GitCompareArrows,
  Phone,
  ShieldCheck,
  RotateCcw,
  Zap,
  Crown,
} from "lucide-react";
import { SITE_FULL_NAME, CONTACT } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import MobileMenu from "./MobileMenu";
import NotificationBell from "@/components/ui/NotificationBell";
import SearchAutocomplete from "./SearchAutocomplete";
import NavCategories from "./NavCategories";
import AccountDropdown from "@/components/ui/AccountDropdown";
import { useCompare } from "@/hooks/useCompare";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const { isPremium } = useAuth();
  const { getCount: getWishlistCount } = useWishlist();
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
    };
  }, [handleScroll]);

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
              {CONTACT.phone && (
                <>
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-primary-500" />
                    {CONTACT.phone}
                  </span>
                  <span className="text-dark-600">|</span>
                </>
              )}
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
              {isPremium ? (
                <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-0.5 text-green-400">
                  <Crown size={12} />
                  <span className="text-xs font-bold">Premium Üye</span>
                </span>
              ) : (
                <Link href="/premium" className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-amber-400 transition-colors hover:bg-amber-500/30 hover:text-amber-300">
                  <Crown size={12} />
                  <span className="text-xs font-bold">Premium Ol — Ücretsiz Kargo</span>
                </Link>
              )}
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

        {/* Red Navigation Bar - Desktop with Dynamic Categories */}
        <nav className="hidden bg-primary-600 lg:block">
          <div className="container-custom flex items-center gap-0">
            <NavCategories />
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
            {/* Discovery links — Trendyol-style */}
            <span className="mx-1 h-5 w-px bg-primary-400/30" />
            <Link
              href="/kampanyalar"
              className="flex items-center gap-1 px-3 py-3 text-sm font-bold text-yellow-300 transition-colors hover:bg-primary-700 hover:text-yellow-200"
            >
              <Zap size={14} />
              Flaş İndirimler
            </Link>
            <Link
              href="/premium"
              className="flex items-center gap-1 px-3 py-3 text-sm font-bold text-amber-300 transition-colors hover:bg-primary-700 hover:text-amber-200"
            >
              <Crown size={14} />
              Premium
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </>
  );
}
