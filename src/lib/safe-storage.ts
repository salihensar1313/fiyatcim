/**
 * safe-storage.ts — localStorage güvenli erişim katmanı
 *
 * Kural: Tüm context'lerde safeGetJSON/safeSetJSON kullanılacak.
 * Direkt localStorage.getItem + JSON.parse YASAK.
 *
 * localStorage verileri untrusted kabul edilir; parse/validate zorunludur.
 */

export function safeGetJSON<T>(key: string, fallback: T): T;
export function safeGetJSON<T>(key: string, fallback: null): T | null;
export function safeGetJSON<T>(key: string, fallback: T | null): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    // Tip doğrulaması: fallback array ise parsed da array olmalı
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;

    // Tip doğrulaması: fallback object ise parsed da object olmalı
    if (typeof fallback === "object" && fallback !== null && !Array.isArray(fallback)) {
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

export function safeSetJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage dolu — sessizce geç */
  }
}

export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* sessizce geç */
  }
}
