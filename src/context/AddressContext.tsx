"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SavedAddress, Address } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_addresses";

interface AddressContextValue {
  addresses: SavedAddress[];
  addAddress: (data: Omit<SavedAddress, "id" | "created_at">) => SavedAddress;
  updateAddress: (id: string, data: Partial<Address & { baslik: string }>) => void;
  removeAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextValue | null>(null);

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAddresses(safeGetJSON<SavedAddress[]>(STORAGE_KEY, []));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) safeSetJSON(STORAGE_KEY, addresses);
  }, [addresses, loaded]);

  const addAddress = useCallback((data: Omit<SavedAddress, "id" | "created_at">) => {
    const newAddr: SavedAddress = {
      ...data,
      id: "addr-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    setAddresses((prev) => [...prev, newAddr]);
    return newAddr;
  }, []);

  const updateAddress = useCallback((id: string, data: Partial<Address & { baslik: string }>) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <AddressContext.Provider value={{ addresses, addAddress, updateAddress, removeAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddresses must be used within AddressProvider");
  return ctx;
}
