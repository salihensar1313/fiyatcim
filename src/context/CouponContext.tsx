"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Coupon } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// ==========================================
// TYPES
// ==========================================

interface CouponContextType {
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, "id" | "created_at" | "used_count">) => Coupon;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  getCouponByCode: (code: string) => Coupon | undefined;
  validateCoupon: (code: string, cartTotal: number, userId?: string) => { valid: boolean; error?: string; coupon?: Coupon } | Promise<{ valid: boolean; error?: string; coupon?: Coupon }>;
  useCoupon: (couponId: string, userId: string) => void;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

const STORAGE_KEY = "fiyatcim_coupons";
const USED_COUPONS_KEY = "fiyatcim_used_coupons";

// ==========================================
// DEMO SEED COUPONS (yalnızca demo modda yüklenir)
// GÜVENLIK: Bu veriler production bundle'da
// tree-shaking ile kaldırılır (IS_DEMO=false ise referans yok).
// @see claude2-detailed-security-report-2026-03-23.md — Bulgu #4
// ==========================================

function getDemoSeedCoupons(): Coupon[] {
  if (!IS_DEMO) return [];
  return [
    {
      id: "coupon-1",
      code: "HOSGELDIN",
      type: "percent",
      value: 10,
      min_cart: 500,
      max_uses: null,
      used_count: 0,
      active: true,
      expiry: "2026-12-31T23:59:59Z",
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "coupon-2",
      code: "YAZ2026",
      type: "fixed",
      value: 200,
      min_cart: 2000,
      max_uses: 100,
      used_count: 12,
      active: true,
      expiry: "2026-09-01T00:00:00Z",
      created_at: "2024-06-01T00:00:00Z",
    },
    {
      id: "coupon-3",
      code: "UCRETSIZ50",
      type: "fixed",
      value: 50,
      min_cart: 0,
      max_uses: 50,
      used_count: 48,
      active: true,
      expiry: "2026-06-01T00:00:00Z",
      created_at: "2024-03-01T00:00:00Z",
    },
  ];
}

// ==========================================
// PROVIDER
// ==========================================

export function CouponProvider({ children }: { children: ReactNode }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [usedByUsers, setUsedByUsers] = useState<Record<string, string[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Demo: localStorage'dan yükle, Prod: kuponlar yalnızca server-side doğrulanır
  useEffect(() => {
    if (IS_DEMO) {
      const data = safeGetJSON<Coupon[]>(STORAGE_KEY, []);
      const validCoupons = Array.isArray(data) && data.length > 0
        ? data.filter((c): c is Coupon =>
            typeof c === "object" && c !== null && "id" in c && "code" in c
          )
        : getDemoSeedCoupons();

      const usedData = safeGetJSON<Record<string, string[]>>(USED_COUPONS_KEY, {});
      const validUsed = typeof usedData === "object" && usedData !== null && !Array.isArray(usedData)
        ? usedData
        : {};

      setCoupons(validCoupons);
      setUsedByUsers(validUsed);
    }
    // Production'da kupon listesi client'a yüklenmez
    setIsLoaded(true);
  }, []);

  // Demo: localStorage'a kaydet
  useEffect(() => {
    if (!IS_DEMO || !isLoaded) return;
    safeSetJSON(STORAGE_KEY, coupons);
  }, [coupons, isLoaded]);

  useEffect(() => {
    if (!IS_DEMO || !isLoaded) return;
    safeSetJSON(USED_COUPONS_KEY, usedByUsers);
  }, [usedByUsers, isLoaded]);

  const addCoupon = useCallback((data: Omit<Coupon, "id" | "created_at" | "used_count">): Coupon => {
    const newCoupon: Coupon = {
      ...data,
      id: `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      used_count: 0,
      created_at: new Date().toISOString(),
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    return newCoupon;
  }, []);

  const updateCoupon = useCallback((id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteCoupon = useCallback((id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCouponByCode = useCallback(
    (code: string) => coupons.find((c) => c.code.toUpperCase() === code.toUpperCase()),
    [coupons]
  );

  /**
   * Kupon doğrulama
   * Demo: client-side (localStorage)
   * Production: server-side API (/api/coupons/validate)
   */
  const validateCoupon = useCallback(
    (code: string, cartTotal: number, userId?: string) => {
      if (!IS_DEMO) {
        // Production: server-side doğrulama
        return fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, cartTotal }),
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.valid) {
              // Server-side geçerli — geçici Coupon nesnesi oluştur
              return {
                valid: true,
                coupon: {
                  id: result.couponId,
                  code: code.toUpperCase(),
                  type: result.type,
                  value: result.value,
                  min_cart: 0,
                  max_uses: null,
                  used_count: 0,
                  active: true,
                  created_at: "",
                } as Coupon,
              };
            }
            return { valid: false, error: result.error };
          })
          .catch(() => ({ valid: false, error: "Kupon dogrulanamadi." }));
      }

      // Demo: client-side doğrulama
      const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());
      if (!coupon) return { valid: false, error: "Kupon bulunamadı." };
      if (!coupon.active) return { valid: false, error: "Bu kupon artık aktif değil." };
      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return { valid: false, error: "Kupon süresi dolmuş." };
      }
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return { valid: false, error: "Kupon kullanım limiti dolmuş." };
      }
      if (cartTotal < coupon.min_cart) {
        return { valid: false, error: `Minimum sepet tutarı ${coupon.min_cart}₺ olmalıdır.` };
      }
      if (userId) {
        const users = usedByUsers[coupon.id] || [];
        if (users.includes(userId)) {
          return { valid: false, error: "Bu kuponu daha önce kullandınız." };
        }
      }
      return { valid: true, coupon };
    },
    [coupons, usedByUsers]
  );

  const useCoupon = useCallback((couponId: string, userId: string) => {
    if (!IS_DEMO) return; // Production'da kupon kullanımı create_order_rpc içinde yapılır
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId ? { ...c, used_count: c.used_count + 1 } : c
      )
    );
    setUsedByUsers((prev) => ({
      ...prev,
      [couponId]: [...(prev[couponId] || []), userId],
    }));
  }, []);

  return (
    <CouponContext.Provider
      value={{ coupons, addCoupon, updateCoupon, deleteCoupon, getCouponByCode, validateCoupon, useCoupon }}
    >
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupons() {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error("useCoupons must be used within a CouponProvider");
  }
  return context;
}
