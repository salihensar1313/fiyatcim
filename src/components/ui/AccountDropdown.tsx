"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  ChevronDown,
  Package,
  Heart,
  Tag,
  MapPin,
  Star,
  Settings,
  Shield,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

/* ─── Google SVG Icon ─── */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ─── Menu Configuration ─── */

interface MenuItem {
  href: string;
  label: string;
  icon: typeof User;
}

const GUEST_MENU: MenuItem[] = [
  { href: "/hesabim/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/favorilerim", label: "Favorilerim", icon: Heart },
  { href: "/hesabim/kuponlarim", label: "Kuponlarım", icon: Tag },
  { href: "/hesabim/adreslerim", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/degerlendirmelerim", label: "Değerlendirmelerim", icon: Star },
];

const LOGGED_IN_MENU: MenuItem[] = [
  { href: "/hesabim/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/favorilerim", label: "Favorilerim", icon: Heart },
  { href: "/hesabim/kuponlarim", label: "Kuponlarım", icon: Tag },
  { href: "/hesabim/adreslerim", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/degerlendirmelerim", label: "Değerlendirmelerim", icon: Star },
  { href: "/hesabim", label: "Hesap Ayarları", icon: Settings },
];

/* ─── Component ─── */

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, signOut, signInWithGoogle } = useAuth();
  const { theme, setTheme, mounted: themeMounted } = useTheme();

  const close = useCallback(() => setIsOpen(false), []);

  // Close on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  // Cleanup hover timeout
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  /* ─── Hover handlers ─── */
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setIsOpen(false), 200);
  };

  /* ─── Click handler ─── */
  const handleTriggerClick = () => {
    if (window.innerWidth < 640) {
      router.push(user ? "/hesabim" : "/giris");
      return;
    }
    setIsOpen((prev) => !prev);
  };

  /* ─── Theme cycle ─── */
  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % 3]);
  };

  const themeIcon = !themeMounted ? (
    <Monitor size={16} />
  ) : theme === "dark" ? (
    <Moon size={16} />
  ) : theme === "light" ? (
    <Sun size={16} />
  ) : (
    <Monitor size={16} />
  );

  const themeLabel = theme === "light" ? "Açık" : theme === "dark" ? "Koyu" : "Sistem";

  /* ─── Google sign in ─── */
  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    close();
  };

  /* ─── Sign out ─── */
  const handleSignOut = async () => {
    close();
    await signOut();
    router.push("/");
  };

  /* ─── Derived ─── */
  const isGuest = !user;
  const firstName = profile?.ad || "";
  const lastName = profile?.soyad || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initial = firstName ? firstName.charAt(0).toUpperCase() : "";
  const email = user?.email || "";
  const menuItems = isGuest ? GUEST_MENU : LOGGED_IN_MENU;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ─── Trigger Button ─── */}
      <button
        onClick={handleTriggerClick}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-dark-200 transition-colors hover:bg-dark-700/50 hover:text-white"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Hesabım menüsü"
      >
        <User size={20} />
        <span className="hidden text-sm font-medium lg:inline">Hesabım</span>
        <ChevronDown
          size={14}
          className={`hidden transition-transform duration-200 lg:inline ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* ─── Dropdown Panel ─── */}
      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-[300px] overflow-hidden rounded-2xl border border-dark-100 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-800"
          role="menu"
        >
          {/* ─── GUEST Header ─── */}
          {isGuest && (
            <div className="px-5 pb-5 pt-6">
              {/* Greeting Row */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-dark-900 dark:text-dark-50">
                    Hoş Geldiniz!
                  </p>
                  <p className="text-xs text-dark-400 dark:text-dark-400">
                    Hesabınıza giriş yapın
                  </p>
                </div>
              </div>

              {/* Giris Yap — Primary CTA */}
              <Link
                href="/giris"
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md"
                role="menuitem"
                onClick={close}
              >
                Giriş Yap
                <ChevronRight size={16} />
              </Link>

              {/* Google ile Giriş Yap */}
              <button
                onClick={handleGoogleSignIn}
                className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-dark-200 bg-white px-4 py-3 text-sm font-semibold text-dark-700 shadow-sm transition-all hover:border-dark-300 hover:bg-dark-50 hover:shadow-md dark:border-dark-500 dark:bg-dark-700 dark:text-dark-200 dark:hover:bg-dark-600"
                role="menuitem"
              >
                <GoogleIcon size={18} />
                Google ile Giriş Yap
              </button>

              {/* Kayit Ol — text link */}
              <p className="text-center text-[13px] text-dark-500 dark:text-dark-400">
                Hesabınız yok mu?{" "}
                <Link
                  href="/kayit"
                  className="font-semibold text-primary-600 hover:text-primary-700 hover:underline dark:text-primary-400"
                  onClick={close}
                >
                  Ücretsiz Kayıt Ol
                </Link>
              </p>
            </div>
          )}

          {/* ─── LOGGED-IN Header ─── */}
          {!isGuest && (
            <div className="px-5 pb-4 pt-5">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={fullName}
                    className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-lg font-bold text-white shadow-md">
                    {initial}
                  </div>
                )}
                {/* Name & Email */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-dark-900 dark:text-dark-50">
                    {fullName || "Kullanıcı"}
                  </p>
                  <p className="truncate text-xs text-dark-400 dark:text-dark-400">
                    {email}
                  </p>
                </div>
                {/* Settings shortcut */}
                <Link
                  href="/hesabim"
                  className="rounded-lg p-2 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-600 dark:hover:bg-dark-700 dark:hover:text-dark-200"
                  onClick={close}
                  title="Hesap Ayarları"
                >
                  <Settings size={18} />
                </Link>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-dark-100 dark:bg-dark-600" />

          {/* Menu Items */}
          <div className="py-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const href = isGuest
                ? `/giris?redirect=${encodeURIComponent(item.href)}`
                : item.href;
              return (
                <Link
                  key={item.label}
                  href={href}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm text-dark-700 transition-colors hover:bg-dark-50 hover:text-primary-600 dark:text-dark-200 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                  role="menuitem"
                  onClick={close}
                >
                  <Icon size={18} className="shrink-0 text-dark-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Admin Panel (logged-in admin only) */}
          {!isGuest && isAdmin && (
            <>
              <div className="mx-4 h-px bg-dark-100 dark:bg-dark-600" />
              <div className="py-1.5">
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                  role="menuitem"
                  onClick={close}
                >
                  <Shield size={18} className="shrink-0" />
                  Admin Panel
                </Link>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="mx-4 h-px bg-dark-100 dark:bg-dark-600" />

          {/* Dark Mode Toggle Row */}
          <button
            onClick={cycleTheme}
            className="flex w-full items-center justify-between px-5 py-2.5 text-sm text-dark-700 transition-colors hover:bg-dark-50 dark:text-dark-200 dark:hover:bg-dark-700"
            role="menuitem"
          >
            <span className="flex items-center gap-3">
              {themeIcon}
              Karanlık Mod
            </span>
            <span className="rounded-full bg-dark-100 px-2.5 py-0.5 text-xs font-medium text-dark-500 dark:bg-dark-600 dark:text-dark-300">
              {themeLabel}
            </span>
          </button>

          {/* Sign Out (logged-in only) */}
          {!isGuest && (
            <>
              <div className="mx-4 h-px bg-dark-100 dark:bg-dark-600" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-5 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950"
                role="menuitem"
              >
                <LogOut size={18} className="shrink-0" />
                Çıkış Yap
              </button>
            </>
          )}

          {/* Bottom padding */}
          <div className="h-1" />
        </div>
      )}
    </div>
  );
}
