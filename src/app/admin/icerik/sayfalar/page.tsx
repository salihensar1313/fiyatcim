"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Shield, Wrench, Award, Star, Heart, Zap, Truck, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { ADMIN_INPUT, ADMIN_TEXTAREA } from "@/lib/admin-classes";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

interface HomepageSections {
  whyChooseUs: FeatureItem[];
  newsletter: {
    title: string;
    subtitle: string;
  };
}

const STORAGE_KEY = "fiyatcim_homepage_sections";

const ICON_OPTIONS = [
  { value: "Shield", label: "Kalkan", Icon: Shield },
  { value: "Wrench", label: "Anahtar", Icon: Wrench },
  { value: "Award", label: "Ödül", Icon: Award },
  { value: "Star", label: "Yıldız", Icon: Star },
  { value: "Heart", label: "Kalp", Icon: Heart },
  { value: "Zap", label: "Hız", Icon: Zap },
  { value: "Truck", label: "Kargo", Icon: Truck },
  { value: "Clock", label: "Saat", Icon: Clock },
];

const defaultData: HomepageSections = {
  whyChooseUs: [
    { id: "wcu-1", title: "Guvenilir Marka", desc: "Ajax, Hikvision, Dahua gibi dunya lideri markalarla calisiyor, yalnizca orijinal ve garantili urunler sunuyoruz.", icon: "Shield" },
    { id: "wcu-2", title: "Profesyonel Destek", desc: "Deneyimli teknik ekibimiz ile ucretsiz kesif, profesyonel kurulum ve satis sonrasi destek hizmeti veriyoruz.", icon: "Wrench" },
    { id: "wcu-3", title: "Kaliteli Urunler", desc: "Tum urunlerimiz minimum 2 yil uretici garantisi ile gelir. Sertifikali uzman ekibimiz her zaman yaninizda.", icon: "Award" },
  ],
  newsletter: {
    title: "Kampanyalardan Haberdar Olun",
    subtitle: "Yeni urunler ve ozel firsatlardan ilk siz haberdar olun.",
  },
};

export default function AdminSayfalarPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"whyChooseUs" | "newsletter">("whyChooseUs");
  const [data, setData] = useState<HomepageSections>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = safeGetJSON<HomepageSections>(STORAGE_KEY, defaultData);
    if (typeof stored === "object" && stored !== null && !Array.isArray(stored)) {
      setData({
        whyChooseUs: Array.isArray(stored.whyChooseUs) && stored.whyChooseUs.length > 0
          ? stored.whyChooseUs
          : defaultData.whyChooseUs,
        newsletter: stored.newsletter && typeof stored.newsletter === "object"
          ? { ...defaultData.newsletter, ...stored.newsletter }
          : defaultData.newsletter,
      });
    }
    setIsLoaded(true);
  }, []);

  const handleSave = () => {
    safeSetJSON(STORAGE_KEY, data);
    showToast("Sayfa içerikleri kaydedildi", "success");
  };

  // WhyChooseUs helpers
  const updateFeature = (id: string, field: keyof FeatureItem, value: string) => {
    setData((prev) => ({
      ...prev,
      whyChooseUs: prev.whyChooseUs.map((f) =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    }));
  };

  if (!isLoaded) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/icerik" className="rounded-lg p-2 text-dark-400 hover:bg-dark-100 hover:text-dark-600 dark:text-dark-300">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Sayfa İçerikleri</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">Neden Biz ve Bülten bölümlerini düzenleyin</p>
          </div>
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
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab("whyChooseUs")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "whyChooseUs"
              ? "bg-primary-600 text-white"
              : "bg-dark-100 text-dark-600 dark:text-dark-300 hover:bg-dark-200"
          }`}
        >
          Neden Biz ({data.whyChooseUs.length})
        </button>
        <button
          onClick={() => setTab("newsletter")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "newsletter"
              ? "bg-primary-600 text-white"
              : "bg-dark-100 text-dark-600 dark:text-dark-300 hover:bg-dark-200"
          }`}
        >
          Bülten
        </button>
      </div>

      {/* Why Choose Us Tab */}
      {tab === "whyChooseUs" && (
        <div className="space-y-4">
          {data.whyChooseUs.map((feature, idx) => (
            <div key={feature.id} className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                  {idx + 1}
                </span>
                <h3 className="font-medium text-dark-900 dark:text-dark-50">Özellik {idx + 1}</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Başlık</label>
                  <input
                    value={feature.title}
                    onChange={(e) => updateFeature(feature.id, "title", e.target.value)}
                    className={ADMIN_INPUT}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İkon</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateFeature(feature.id, "icon", opt.value)}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs transition-colors ${
                          feature.icon === opt.value
                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600"
                            : "border-dark-200 text-dark-500 dark:text-dark-400 hover:border-primary-300"
                        }`}
                      >
                        <opt.Icon size={14} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Açıklama</label>
                  <textarea
                    value={feature.desc}
                    onChange={(e) => updateFeature(feature.id, "desc", e.target.value)}
                    rows={2}
                    className={ADMIN_TEXTAREA}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Newsletter Tab */}
      {tab === "newsletter" && (
        <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Başlık</label>
              <input
                value={data.newsletter.title}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    newsletter: { ...prev.newsletter, title: e.target.value },
                  }))
                }
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Alt Başlık</label>
              <input
                value={data.newsletter.subtitle}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    newsletter: { ...prev.newsletter, subtitle: e.target.value },
                  }))
                }
                className={ADMIN_INPUT}
              />
            </div>

            {/* Preview */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-dark-500 dark:text-dark-400">Önizleme</p>
              <div className="rounded-lg bg-dark-900 px-6 py-8 text-center">
                <h3 className="text-lg font-bold text-white">{data.newsletter.title}</h3>
                <p className="mt-1 text-sm text-dark-300">{data.newsletter.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
