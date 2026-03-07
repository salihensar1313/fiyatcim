"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Package, ShoppingCart, Tag, CheckCheck, TrendingDown, PackageCheck } from "lucide-react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "order" | "cart" | "promo" | "system" | "price_alert" | "stock_alert";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const STORAGE_KEY = "fiyatcim_notifications";

const ICON_MAP: Record<Notification["type"], typeof Bell> = {
  order: Package,
  cart: ShoppingCart,
  promo: Tag,
  system: Bell,
  price_alert: TrendingDown,
  stock_alert: PackageCheck,
};

const COLOR_MAP: Record<Notification["type"], string> = {
  order: "bg-blue-100 text-blue-600",
  cart: "bg-green-100 text-green-600",
  promo: "bg-orange-100 text-orange-600",
  system: "bg-purple-100 text-purple-600",
  price_alert: "bg-red-100 text-red-600",
  stock_alert: "bg-teal-100 text-teal-600",
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const storageKey = user ? `${STORAGE_KEY}_${user.id}` : STORAGE_KEY;

  useEffect(() => {
    const stored = safeGetJSON<Notification[]>(storageKey, []);
    if (Array.isArray(stored)) setNotifications(stored);
  }, [storageKey]);

  const addNotification = (data: Omit<Notification, "id" | "read" | "created_at">) => {
    const newNotif: Notification = {
      ...data,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 50); // Max 50
      safeSetJSON(storageKey, updated);
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      safeSetJSON(storageKey, updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      safeSetJSON(storageKey, updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    safeSetJSON(storageKey, []);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll };
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-600 dark:text-dark-300"
        aria-label="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3 dark:border-dark-700">
            <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50">Bildirimler</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  <CheckCheck size={14} />
                  Tümünü oku
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-dark-400 hover:text-red-500"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.slice(0, 20).map((notif) => {
                const Icon = ICON_MAP[notif.type];
                return (
                  <button
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-50 ${
                      !notif.read ? "bg-primary-50/30" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${COLOR_MAP[notif.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm ${!notif.read ? "font-semibold text-dark-900 dark:text-dark-50" : "text-dark-700 dark:text-dark-200"}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-dark-500 dark:text-dark-400">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-dark-400">{formatDate(notif.created_at)}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell size={32} className="mx-auto mb-2 text-dark-200" />
                <p className="text-sm text-dark-400">Bildirim yok</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
