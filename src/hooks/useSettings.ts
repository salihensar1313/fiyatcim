"use client";

import { useState, useEffect } from "react";
import { safeGetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_settings";

interface SiteSettings {
  siteName: string;
  siteFullName: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  freeShippingThreshold: number;
  defaultShippingFee: number;
  paymentApiKey: string;
  paymentSecretKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
}

const defaultSettings: SiteSettings = {
  siteName: "Fiyatcim",
  siteFullName: "Fiyatcim.com — Uzman Onaylı Elektronik Marketi",
  phone: "+90 (___) ___ __ __",
  email: "destek@fiyatcim.com",
  address: "İstanbul, Türkiye",
  instagram: "https://instagram.com/fiyatcim",
  facebook: "",
  freeShippingThreshold: 2000,
  defaultShippingFee: 49.9,
  paymentApiKey: "",
  paymentSecretKey: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const data = safeGetJSON<SiteSettings>(STORAGE_KEY, defaultSettings);
    if (typeof data === "object" && data !== null && !Array.isArray(data) && "freeShippingThreshold" in data) {
      setSettings({ ...defaultSettings, ...data });
    }
  }, []);

  return settings;
}

export type { SiteSettings };
