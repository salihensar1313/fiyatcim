"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import type { CartItem, Product } from "@/types";
import { getEffectivePrice, calculateShipping } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { GIFT_WRAP_COST } from "@/lib/constants";
import { PREMIUM_PRICE_WITH_ORDER } from "@/lib/premium";

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  setGiftWrap: (productId: string, wrap: boolean, message?: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getShipping: () => number;
  getGiftWrapTotal: () => number;
  getPremiumCost: () => number;
  getTotal: () => number;
  isInCart: (productId: string) => boolean;
  couponCode: string | null;
  setCouponCode: (code: string | null) => void;
  discount: number;
  setDiscount: (amount: number) => void;
  premiumInCart: boolean;
  setPremiumInCart: (val: boolean) => void;
  isCartLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isPremium } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscountRaw] = useState(0);
  const setDiscount = useCallback((amount: number) => {
    setDiscountRaw(Math.max(0, amount)); // Negatif indirim engelle
  }, []);
  const [premiumInCart, setPremiumInCart] = useState(false);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // G1: Kullanıcı bazlı storage key — her kullanıcının sepeti ayrı
  const storageKey = useMemo(() => `fiyatcim_cart_${user?.id || "guest"}`, [user?.id]);

  // isLoaded: storageKey ile loadedKey eşleştiğinde true (key değişince otomatik false olur)
  const isLoaded = loadedKey === storageKey;

  // localStorage'dan yükle — user değişince tetiklenir (safeGetJSON ile — GATE 3)
  useEffect(() => {
    const data = safeGetJSON<{ items?: unknown[]; couponCode?: string | null }>(
      storageKey, { items: [], couponCode: null }
    );

    // Veri doğrulama: her item'da product_id ve qty olmalı
    const validItems = (Array.isArray(data.items) ? data.items : []).filter(
      (item: unknown): item is CartItem =>
        typeof item === "object" && item !== null && "product_id" in item && "qty" in item
    );

    setItems(validItems);
    setCouponCode(typeof data.couponCode === "string" ? data.couponCode : null);
    setDiscount(0);
    setLoadedKey(storageKey);

    // Supabase'den sepet sync (giris yapmis kullanicilar)
    if (user?.id) {
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase.from("user_carts").select("items").eq("user_id", user.id).single()
          .then(({ data: cartData }) => {
            if (!cartData?.items || !Array.isArray(cartData.items) || cartData.items.length === 0) return;
            // Fetch product details
            const pids = (cartData.items as { product_id: string; qty: number }[]).map(i => i.product_id);
            supabase.from("products").select("*").in("id", pids).then(({ data: products }) => {
              if (!products) return;
              const pMap = new Map(products.map(p => [p.id, p]));
              const serverItems: CartItem[] = [];
              for (const ci of cartData.items as { product_id: string; qty: number }[]) {
                const p = pMap.get(ci.product_id);
                if (p) serverItems.push({ product_id: ci.product_id, qty: ci.qty, product: p });
              }
              // Merge: local + server (local wins for duplicates)
              setItems((prev) => {
                const merged = new Map<string, CartItem>();
                for (const si of serverItems) merged.set(si.product_id, si);
                for (const li of prev) merged.set(li.product_id, li);
                return Array.from(merged.values());
              });
            });
          });
      }).catch(() => {});
    }
  }, [storageKey, user?.id]);

  // localStorage'a kaydet — safeSetJSON ile (GATE 3)
  useEffect(() => {
    if (!isLoaded) return;
    safeSetJSON(storageKey, { items, couponCode });

    // Supabase sync (giris yapmis kullanicilar icin)
    if (user?.id) {
      const cartData = items.map((i) => ({ product_id: i.product_id, qty: i.qty }));
      import("@/lib/supabase/client").then(({ createClient }) => {
        const supabase = createClient();
        supabase.from("user_carts").upsert(
          { user_id: user.id, items: cartData, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        ).then(() => {});
      }).catch(() => {});
    }
  }, [items, couponCode, isLoaded, storageKey, user?.id]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        const validItems = (Array.isArray(data.items) ? data.items : []).filter(
          (item: unknown): item is CartItem =>
            typeof item === "object" && item !== null && "product_id" in item && "qty" in item
        );
        setItems(validItems);
        setCouponCode(typeof data.couponCode === "string" ? data.couponCode : null);
      } catch { /* ignore malformed data */ }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [storageKey]);

  const addItem = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, qty: Math.min(item.qty + qty, product.stock), product }
            : item
        );
      }
      return [...prev, { product_id: product.id, qty: Math.min(qty, product.stock), product }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        // Cap at stock limit
        const maxQty = item.product?.stock ?? 99;
        return { ...item, qty: Math.min(qty, Math.max(1, maxQty)) };
      })
    );
  }, []);

  const setGiftWrap = useCallback((productId: string, wrap: boolean, message?: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, giftWrap: wrap, giftMessage: wrap ? message : undefined }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode(null);
    setDiscount(0);
    setPremiumInCart(false);
  }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => {
      if (!item.product) return sum;
      return sum + getEffectivePrice(item.product.price, item.product.sale_price) * item.qty;
    }, 0);
  }, [items]);

  const getShipping = useCallback(() => {
    // Premium üyeler veya sepette premium varsa kargo ücretsiz
    if (isPremium || premiumInCart) return 0;
    return calculateShipping(getSubtotal());
  }, [getSubtotal, isPremium, premiumInCart]);

  const getGiftWrapTotal = useCallback(() => {
    return items.filter((item) => item.giftWrap).length * GIFT_WRAP_COST;
  }, [items]);

  const getPremiumCost = useCallback(() => {
    return premiumInCart ? PREMIUM_PRICE_WITH_ORDER : 0;
  }, [premiumInCart]);

  const getTotal = useCallback(() => {
    return Math.max(0, getSubtotal() - discount + getShipping() + getGiftWrapTotal() + getPremiumCost());
  }, [getSubtotal, discount, getShipping, getGiftWrapTotal, getPremiumCost]);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product_id === productId),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        setGiftWrap,
        clearCart,
        getItemCount,
        getSubtotal,
        getShipping,
        getGiftWrapTotal,
        getPremiumCost,
        getTotal,
        isInCart,
        couponCode,
        setCouponCode,
        discount,
        setDiscount,
        premiumInCart,
        setPremiumInCart,
        isCartLoaded: isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
