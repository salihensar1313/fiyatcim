"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

const COOKIE_CONSENT_KEY = "fiyatcim_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = safeGetJSON<{ accepted?: boolean }>(COOKIE_CONSENT_KEY, {});
    if (!consent.accepted) {
      // Küçük gecikme ile göster (ilk render sonrası)
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    safeSetJSON(COOKIE_CONSENT_KEY, { accepted: true, date: new Date().toISOString() });
    setVisible(false);
  };

  const handleDecline = () => {
    safeSetJSON(COOKIE_CONSENT_KEY, { accepted: true, essential_only: true, date: new Date().toISOString() });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-dark-200 bg-white dark:bg-dark-800 p-4 shadow-2xl sm:p-6 dark:border-dark-700">
      <div className="container mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie size={24} className="mt-0.5 shrink-0 text-primary-600" />
          <div>
            <p className="text-sm font-medium text-dark-900 dark:text-dark-50">Çerez Bildirimi</p>
            <p className="mt-1 text-xs leading-relaxed text-dark-500 dark:text-dark-400">
              Sitemizde deneyiminizi iyileştirmek için çerezler kullanıyoruz.{" "}
              <Link href="/gizlilik" className="text-primary-600 hover:underline">
                Gizlilik Politikası
              </Link>{" "}
              sayfamızdan detaylara ulaşabilirsiniz.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDecline}
            className="rounded-lg border border-dark-200 px-4 py-2 text-xs font-medium text-dark-600 dark:text-dark-300 transition-colors hover:bg-dark-50 dark:border-dark-600 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Sadece Zorunlu
          </button>
          <button
            onClick={handleAccept}
            className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-700"
          >
            Tümünü Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
