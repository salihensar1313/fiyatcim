"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

// ==========================================
// TYPES
// ==========================================

interface CurrencyState {
  usdTry: number;          // 1 USD = X TRY
  lastUpdated: string;     // ISO timestamp
  isLoading: boolean;
  error: string | null;
}

interface CurrencyContextType extends CurrencyState {
  /** USD fiyat\u0131 TL'ye \u00e7evir */
  usdToTry: (usd: number) => number;
  /** TL fiyat\u0131 USD'ye \u00e7evir */
  tryToUsd: (tl: number) => number;
  /** Kuru manuel yenile */
  refreshRate: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "fiyatcim_exchange_rate";
const FALLBACK_RATE = 38.5; // Varsay\u0131lan kur (API ba\u015far\u0131s\u0131z olursa)
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 dakikada bir g\u00fcncelle
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 dakika cache ge\u00e7erlilik

// ==========================================
// PROVIDER
// ==========================================

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CurrencyState>({
    usdTry: FALLBACK_RATE,
    lastUpdated: "",
    isLoading: true,
    error: null,
  });

  const fetchRate = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // \u00d6nce cache kontrol
      const cached = safeGetJSON<{ rate: number; timestamp: string }>(STORAGE_KEY, null);
      if (cached && cached.timestamp) {
        const age = Date.now() - new Date(cached.timestamp).getTime();
        if (age < CACHE_MAX_AGE && cached.rate > 0) {
          setState({
            usdTry: cached.rate,
            lastUpdated: cached.timestamp,
            isLoading: false,
            error: null,
          });
          return;
        }
      }

      // Canl\u0131 kur \u00e7ek (\u00fccretsiz API, key gerekmez)
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        next: { revalidate: 600 }, // 10 dk cache
      });

      if (!res.ok) throw new Error(`API hatas\u0131: ${res.status}`);

      const data = await res.json();
      const rate = data?.rates?.TRY;

      if (!rate || typeof rate !== "number") {
        throw new Error("Ge\u00e7ersiz kur verisi");
      }

      const now = new Date().toISOString();

      // Cache'e kaydet
      safeSetJSON(STORAGE_KEY, { rate, timestamp: now });

      setState({
        usdTry: rate,
        lastUpdated: now,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      // Cache varsa onu kullan, yoksa fallback
      const cached = safeGetJSON<{ rate: number; timestamp: string }>(STORAGE_KEY, null);
      setState((prev) => ({
        ...prev,
        usdTry: cached?.rate || prev.usdTry || FALLBACK_RATE,
        lastUpdated: cached?.timestamp || prev.lastUpdated || "",
        isLoading: false,
        error: err instanceof Error ? err.message : "Kur al\u0131namad\u0131",
      }));
    }
  }, []);

  // \u0130lk y\u00fckleme
  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  // Periyodik g\u00fcncelleme (10 dk)
  useEffect(() => {
    const interval = setInterval(() => {
      // Cache s\u00fcresini ge\u00e7tiyse yenile
      if (state.lastUpdated) {
        const age = Date.now() - new Date(state.lastUpdated).getTime();
        if (age >= CACHE_MAX_AGE) {
          fetchRate();
        }
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchRate]);

  // \u00c7evirme fonksiyonlar\u0131
  const usdToTry = useCallback(
    (usd: number) => Math.round(usd * state.usdTry * 100) / 100,
    [state.usdTry]
  );

  const tryToUsd = useCallback(
    (tl: number) => Math.round((tl / state.usdTry) * 100) / 100,
    [state.usdTry]
  );

  return (
    <CurrencyContext.Provider
      value={{
        ...state,
        usdToTry,
        tryToUsd,
        refreshRate: fetchRate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
