"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { SavedAddress, Address } from "@/types";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "fiyatcim_addresses";
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
    if (IS_DEMO) {
      setAddresses(safeGetJSON<SavedAddress[]>(STORAGE_KEY, []));
      setLoaded(true);
      return;
    }

    // Non-demo: load from Supabase
    let isMounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted) return;
      if (!user) {
        setAddresses([]);
        setLoaded(true);
        return;
      }
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!isMounted) return;
          if (error) {
            console.error("[AddressContext] load failed:", error.message);
            setAddresses([]);
          } else {
            setAddresses(
              (data ?? []).map((row) => ({
                id: row.id,
                user_id: row.user_id,
                baslik: row.baslik || "",
                ad: row.ad || "",
                soyad: row.soyad || "",
                telefon: row.telefon || "",
                il: row.il || "",
                ilce: row.ilce || "",
                adres: row.adres || "",
                posta_kodu: row.posta_kodu || "",
                created_at: row.created_at,
              }))
            );
          }
          setLoaded(true);
        });
    });

    return () => { isMounted = false; };
  }, []);

  // Save to localStorage in demo mode
  useEffect(() => {
    if (IS_DEMO && loaded) safeSetJSON(STORAGE_KEY, addresses);
  }, [addresses, loaded]);

  const addAddress = useCallback((data: Omit<SavedAddress, "id" | "created_at">) => {
    const newAddr: SavedAddress = {
      ...data,
      id: "addr-" + Date.now(),
      created_at: new Date().toISOString(),
    };
    setAddresses((prev) => [...prev, newAddr]);

    if (!IS_DEMO) {
      const supabase = createClient();
      supabase.from("addresses").insert({
        user_id: data.user_id,
        baslik: data.baslik || "",
        ad: data.ad || "",
        soyad: data.soyad || "",
        telefon: data.telefon || "",
        il: data.il || "",
        ilce: data.ilce || "",
        adres: data.adres || "",
        posta_kodu: data.posta_kodu || "",
      }).select("id").single().then(({ data: inserted, error }) => {
        if (error) {
          console.error("[AddressContext] insert failed:", error.message);
        } else if (inserted) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === newAddr.id ? { ...a, id: inserted.id } : a))
          );
        }
      });
    }

    return newAddr;
  }, []);

  const updateAddress = useCallback((id: string, data: Partial<Address & { baslik: string }>) => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );

    if (!IS_DEMO) {
      const supabase = createClient();
      supabase.from("addresses").update(data).eq("id", id)
        .then(({ error }) => {
          if (error) console.error("[AddressContext] update failed:", error.message);
        });
    }
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));

    if (!IS_DEMO) {
      const supabase = createClient();
      supabase.from("addresses").delete().eq("id", id)
        .then(({ error }) => {
          if (error) console.error("[AddressContext] delete failed:", error.message);
        });
    }
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
