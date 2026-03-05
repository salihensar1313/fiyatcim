"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

interface WishlistContextType {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  getCount: () => number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // G1: Kullanıcı bazlı storage key — her kullanıcının favori listesi ayrı
  const storageKey = useMemo(() => `fiyatcim_wishlist_${user?.id || "guest"}`, [user?.id]);

  // localStorage'dan yükle — safeGetJSON ile (GATE 3)
  useEffect(() => {
    const data = safeGetJSON<string[]>(storageKey, []);
    // Veri doğrulama: her item string olmalı
    const validItems = Array.isArray(data) ? data.filter((id): id is string => typeof id === "string") : [];
    setItems(validItems);
    setIsLoaded(true);
  }, [storageKey]);

  // localStorage'a kaydet — safeSetJSON ile (GATE 3)
  useEffect(() => {
    if (!isLoaded) return;
    safeSetJSON(storageKey, items);
  }, [items, isLoaded, storageKey]);

  const addItem = useCallback((productId: string) => {
    setItems((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const toggleItem = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.includes(productId),
    [items]
  );

  const getCount = useCallback(() => items.length, [items]);

  const clearWishlist = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider
      value={{ items, addItem, removeItem, toggleItem, isInWishlist, getCount, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
