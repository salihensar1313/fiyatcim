"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { User, Package, Heart, MapPin, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/Breadcrumb";

const MENU_SECTIONS = [
  {
    title: "HESABIM",
    items: [
      { label: "Siparişlerim", href: "/hesabim/siparislerim", icon: Package },
      { label: "Favorilerim", href: "/hesabim/favorilerim", icon: Heart },
      { label: "Adreslerim", href: "/hesabim/adreslerim", icon: MapPin },
    ],
  },
  {
    title: "KULLANICI BİLGİLERİM",
    items: [
      { label: "Üyelik Bilgilerim", href: "/hesabim", icon: User },
    ],
  },
];

export default function HesabimLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading, isAdmin, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.push("/giris");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const initial = (profile?.ad?.[0] || user.email[0] || "U").toUpperCase();

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Hesabım" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="space-y-2">
            <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-4">
              {/* User Info */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark-900 dark:text-dark-50">
                    {profile?.ad} {profile?.soyad}
                  </p>
                  <p className="truncate text-xs text-dark-500 dark:text-dark-400">{user.email}</p>
                </div>
              </div>

              {/* Menu Sections */}
              <nav className="space-y-4">
                {MENU_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-dark-400">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                              isActive
                                ? "bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-600"
                                : "text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800"
                            }`}
                          >
                            <item.icon size={16} />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Admin Panel */}
                {isAdmin && (
                  <div>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
                    >
                      <Shield size={16} />
                      Admin Paneli
                    </Link>
                  </div>
                )}

                {/* Divider + Sign Out */}
                <div className="border-t border-dark-100 pt-2">
                  <button
                    onClick={() => {
                      signOut();
                      router.push("/");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Çıkış Yap
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
