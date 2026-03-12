"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useRef } from "react";
import { Bell, User, LogOut, ShoppingBag, UserPlus, Package, Menu, ChevronRight, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

interface Notification {
  id: string;
  type: "order" | "user" | "stock";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const NOTIF_KEY = "fiyatcim_admin_notifications";

function generateNotifications(): Notification[] {
  const notifs: Notification[] = [];

  // Check for new orders
  const orders = safeGetJSON<Array<Record<string, unknown>>>("fiyatcim_orders", []);
  if (Array.isArray(orders) && orders.length > 0) {
    const recent = orders.slice(-3);
    recent.forEach((o) => {
      notifs.push({
        id: `order-${o.id || Date.now()}`,
        type: "order",
        title: "Yeni Sipariş",
        message: `#${(o.order_no as string) || (o.id as string)?.slice(0, 8)} - ${((o.total as number) || 0).toLocaleString("tr-TR")}₺`,
        read: false,
        created_at: (o.created_at as string) || new Date().toISOString(),
      });
    });
  }

  // Check for new users
  const users = safeGetJSON<Array<Record<string, unknown>>>("fiyatcim_registered_users", []);
  if (Array.isArray(users) && users.length > 0) {
    const recent = users.slice(-3);
    recent.forEach((u) => {
      notifs.push({
        id: `user-${u.user_id || Date.now()}`,
        type: "user",
        title: "Yeni Kayıt",
        message: `${u.ad || ""} ${u.soyad || ""} üye oldu`,
        read: false,
        created_at: (u.created_at as string) || new Date().toISOString(),
      });
    });
  }

  return notifs;
}

const ICON_MAP = {
  order: ShoppingBag,
  user: UserPlus,
  stock: Package,
};

const COLOR_MAP = {
  order: "bg-blue-100 text-blue-600",
  user: "bg-green-100 text-green-600",
  stock: "bg-orange-100 text-orange-600",
};

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: "Dashboard",
  urunler: "Ürünler",
  siparisler: "Siparişler",
  stok: "Stok",
  kuponlar: "Kuponlar",
  iadeler: "İadeler",
  musteriler: "Müşteriler",
  icerik: "İçerik Yönetimi",
  raporlar: "Raporlar",
  aktivite: "Aktivite",
  seo: "SEO",
  ayarlar: "Ayarlar",
  "urun-yorumlari": "Ürün Yorumları",
  sorular: "Sorular",
  "yeni-urun": "Yeni Ürün",
  duzenle: "Düzenle",
};

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved notifications
    const saved = safeGetJSON<Notification[]>(NOTIF_KEY, []);
    if (Array.isArray(saved) && saved.length > 0) {
      setNotifications(saved);
    } else {
      // Generate from current data
      const generated = generateNotifications();
      setNotifications(generated);
      if (generated.length > 0) safeSetJSON(NOTIF_KEY, generated);
    }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    safeSetJSON(NOTIF_KEY, updated);
  };

  const clearAll = () => {
    setNotifications([]);
    safeSetJSON(NOTIF_KEY, []);
    setOpen(false);
  };

  const markOneRead = (id: string) => {
    const updated = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    safeSetJSON(NOTIF_KEY, updated);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-dark-100 bg-white dark:bg-dark-800 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="rounded-lg p-2 text-dark-400 hover:bg-dark-50 hover:text-dark-600 dark:text-dark-300 lg:hidden">
            <Menu size={20} />
          </button>
        )}
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/admin" className="text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300">
            <Home size={16} />
          </Link>
          {pathname && pathname !== "/admin" && (() => {
            const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
            return segments.map((seg, i) => {
              const href = "/admin/" + segments.slice(0, i + 1).join("/");
              const isLast = i === segments.length - 1;
              const label = BREADCRUMB_LABELS[seg] || seg;
              return (
                <span key={href} className="flex items-center gap-1">
                  <ChevronRight size={14} className="text-dark-300 dark:text-dark-600" />
                  {isLast ? (
                    <span className="font-semibold text-dark-900 dark:text-dark-50">{label}</span>
                  ) : (
                    <Link href={href} className="text-dark-400 hover:text-dark-600 dark:text-dark-500 dark:hover:text-dark-300">{label}</Link>
                  )}
                </span>
              );
            });
          })()}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="relative rounded-lg p-2 text-dark-400 hover:bg-dark-50 hover:text-dark-600 dark:text-dark-300"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-dark-100 bg-white shadow-xl dark:border-dark-700 dark:bg-dark-800 sm:w-80">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 dark:border-dark-700">
                <h4 className="text-sm font-bold text-dark-900 dark:text-dark-50">Bildirimler</h4>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Tümünü oku
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs font-medium text-dark-400 hover:text-red-600"
                    >
                      Temizle
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const Icon = ICON_MAP[notif.type];
                    const colorClass = COLOR_MAP[notif.type];
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markOneRead(notif.id)}
                        className={`flex cursor-pointer items-start gap-3 border-b border-dark-50 px-4 py-3 transition-colors hover:bg-dark-50 dark:border-dark-700 dark:hover:bg-dark-700/50 ${
                          !notif.read ? "bg-primary-50/30 dark:bg-primary-900/20" : ""
                        }`}
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-dark-900 dark:text-dark-50">{notif.title}</p>
                            {!notif.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />}
                          </div>
                          <p className="text-xs text-dark-500 dark:text-dark-400 truncate">{notif.message}</p>
                          <p className="mt-0.5 text-[10px] text-dark-400">
                            {new Date(notif.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Bell size={32} className="mb-2 text-dark-200" />
                    <p className="text-sm text-dark-500 dark:text-dark-400">Bildirim yok</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={`${profile?.ad} ${profile?.soyad}`}
              className="h-8 w-8 rounded-full object-cover border border-dark-100 dark:border-dark-600"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <User size={16} />
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-dark-900 dark:text-dark-50">{profile?.ad} {profile?.soyad}</p>
            <p className="text-xs text-dark-400">{user?.email}</p>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="rounded-lg p-2 text-dark-400 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
