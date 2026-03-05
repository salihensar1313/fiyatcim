"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  Heart,
  ChevronDown,
  Shield,
  Camera,
  Home,
  Fingerprint,
  Package,
} from "lucide-react";
import { SITE_FULL_NAME } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import MobileMenu from "./MobileMenu";

const MEGA_MENU_DATA = [
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

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const megaTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const { getCount: getWishlistCount } = useWishlist();
  const { usdTry, isLoading: currencyLoading } = useCurrency();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/urunler?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

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
        {/* Dark Top Bar */}
        <div className="bg-dark-900">
          <div className="container-custom flex items-center justify-between gap-4 py-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-white hover:bg-dark-700 lg:hidden"
            >
              <Menu size={24} />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image src="/images/logo-white.png" alt={SITE_FULL_NAME} width={140} height={40} priority className="h-10 w-auto sm:h-12" />
            </Link>

            {/* Exchange Rate Badge */}
            <div className="hidden items-center gap-1.5 rounded-md bg-dark-800 px-3 py-1.5 text-xs lg:flex">
              <span className="font-medium text-dark-400">$1</span>
              <span className="text-dark-500">=</span>
              <span className="font-bold text-green-400">
                {currencyLoading ? "..." : `₺${usdTry.toFixed(2)}`}
              </span>
            </div>

            {/* Search - Desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden flex-1 items-center lg:flex lg:max-w-xl"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün, marka veya kategori ara..."
                  className="w-full rounded-lg border border-dark-600 bg-dark-800 py-2.5 pl-4 pr-12 text-sm text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Wishlist */}
              <Link
                href="/hesabim/favorilerim"
                className="relative rounded-lg p-2 text-dark-300 hover:text-white"
              >
                <Heart size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/sepet"
                className="relative rounded-lg p-2 text-dark-300 hover:text-white"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href="/hesabim"
                className="hidden rounded-lg p-2 text-dark-300 hover:text-white sm:block"
              >
                <User size={22} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="bg-dark-800 px-4 py-2 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full rounded-lg border border-dark-600 bg-dark-700 py-2 pl-4 pr-10 text-sm text-white placeholder-dark-400 focus:border-primary-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400"
            >
              <Search size={18} />
            </button>
          </form>
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
                    className="absolute left-0 top-full z-40 w-72 rounded-b-xl border border-t-0 border-dark-100 bg-white py-3 shadow-xl"
                    onMouseEnter={() => handleMegaEnter(megaItem.key)}
                    onMouseLeave={handleMegaLeave}
                  >
                    {/* Category header */}
                    <div className="mb-2 flex items-center gap-2 px-4">
                      <megaItem.icon size={18} className="text-primary-600" />
                      <Link
                        href={megaItem.href}
                        className="text-sm font-bold text-dark-900 hover:text-primary-600"
                      >
                        Tümünü Gör
                      </Link>
                    </div>
                    <div className="mx-4 mb-2 h-px bg-dark-100" />
                    {/* Sub-items */}
                    {megaItem.items.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-dark-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
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
