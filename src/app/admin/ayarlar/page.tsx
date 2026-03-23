"use client";

import { useState, useEffect } from "react";
import { Globe, Truck, CreditCard, Mail, AlertTriangle, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { CONTACT, SOCIAL, SITE_NAME, SITE_FULL_NAME } from "@/lib/constants";

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
  // GÜVENLIK: Secret alanlar (payment key, SMTP) client-side'da tutulmaz.
  // Bunlar env/vault üzerinden yönetilir.
  // @see claude2-detailed-security-report-2026-03-23.md — Bulgu #6
}

const defaultSettings: SiteSettings = {
  siteName: SITE_NAME,
  siteFullName: SITE_FULL_NAME,
  phone: CONTACT.phone,
  email: CONTACT.email,
  address: CONTACT.address,
  instagram: SOCIAL.instagram,
  facebook: "",
  freeShippingThreshold: 2000,
  defaultShippingFee: 49,
};

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"genel" | "kargo" | "odeme" | "eposta">("genel");

  // Load
  useEffect(() => {
    const data = safeGetJSON<SiteSettings>(STORAGE_KEY, defaultSettings);
    if (typeof data === "object" && data !== null && !Array.isArray(data) && "siteName" in data) {
      setSettings({ ...defaultSettings, ...data });
    }
    setIsLoaded(true);
  }, []);

  // Save
  const handleSave = () => {
    if (!isLoaded) return;
    safeSetJSON(STORAGE_KEY, settings);
    showToast("Ayarlar kaydedildi", "success");
  };

  const updateField = (key: keyof SiteSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { key: "genel" as const, label: "Genel", icon: Globe },
    { key: "kargo" as const, label: "Kargo", icon: Truck },
    { key: "odeme" as const, label: "Ödeme", icon: CreditCard },
    { key: "eposta" as const, label: "E-posta", icon: Mail },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ayarlar</h1>
          <p className="text-sm text-dark-500 dark:text-dark-400">Mağaza yapılandırması</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Save size={16} />
          Kaydet
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary-600 text-white"
                : "text-dark-500 hover:bg-dark-50 hover:text-dark-700 dark:text-dark-300 dark:hover:bg-dark-700 dark:hover:text-dark-100"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
        {/* Genel Ayarlar */}
        {activeTab === "genel" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Site Adı</label>
              <input
                value={settings.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Tam Başlık</label>
              <input
                value={settings.siteFullName}
                onChange={(e) => updateField("siteFullName", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Telefon</label>
              <input
                value={settings.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta</label>
              <input
                value={settings.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Adres</label>
              <input
                value={settings.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Instagram</label>
              <input
                value={settings.instagram}
                onChange={(e) => updateField("instagram", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Facebook</label>
              <input
                value={settings.facebook}
                onChange={(e) => updateField("facebook", e.target.value)}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
          </div>
        )}

        {/* Kargo Ayarları */}
        {activeTab === "kargo" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ücretsiz Kargo Eşiği (₺)</label>
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => updateField("freeShippingThreshold", Number(e.target.value))}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Varsayılan Kargo Ücreti (₺)</label>
              <input
                type="number"
                value={settings.defaultShippingFee}
                onChange={(e) => updateField("defaultShippingFee", Number(e.target.value))}
                className="w-full rounded-lg border border-dark-200 bg-white px-3 py-2 text-sm text-dark-900 placeholder-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 dark:placeholder-dark-500"
              />
            </div>
          </div>
        )}

        {/* Ödeme Ayarları — Güvenlik: Secret'lar env/vault'ta tutulur */}
        {activeTab === "odeme" && (
          <div>
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Sunucu Taraflı Yapılandırma</p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                    Ödeme entegrasyon anahtarları (iyzico API Key, Secret Key) güvenlik nedeniyle
                    sunucu ortam değişkenleri (env) üzerinden yönetilir. Bu alanlar tarayıcıda tutulmaz.
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                    Yapılandırma: IYZICO_API_KEY, IYZICO_SECRET_KEY ortam değişkenlerini Vercel Dashboard &gt; Settings &gt; Environment Variables bölümünden ayarlayın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E-posta Ayarları — Güvenlik: Secret'lar env/vault'ta tutulur */}
        {activeTab === "eposta" && (
          <div>
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Sunucu Taraflı Yapılandırma</p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                    E-posta entegrasyon bilgileri (SMTP, Resend API Key) güvenlik nedeniyle
                    sunucu ortam değişkenleri üzerinden yönetilir. Bu alanlar tarayıcıda tutulmaz.
                  </p>
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-500">
                    Yapılandırma: RESEND_API_KEY ortam değişkenini Vercel Dashboard &gt; Settings &gt; Environment Variables bölümünden ayarlayın.
                    E-postalar Resend API üzerinden gönderilir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Demo notice */}
      <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-900/30 p-4">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Demo Modu:</span> Ayarlar localStorage&apos;da saklanır.
          Production&apos;da Supabase <code className="rounded bg-blue-100 px-1 text-xs">site_settings</code> tablosu ile entegre çalışacak.
        </p>
      </div>
    </div>
  );
}
