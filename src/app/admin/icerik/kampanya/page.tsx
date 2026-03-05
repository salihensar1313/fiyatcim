"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";

interface PromoBannerData {
  title: string;
  description: string;
  link: string;
  active: boolean;
}

const STORAGE_KEY = "fiyatcim_promo_banner";

const defaultBanner: PromoBannerData = {
  title: "Yeni Sezon Indirimleri!",
  description: "Guvenlik kamera setlerinde %30'a varan indirimler.",
  link: "/urunler?sale=true",
  active: true,
};

export default function AdminKampanyaPage() {
  const { showToast } = useToast();
  const [banner, setBanner] = useState<PromoBannerData>(defaultBanner);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = safeGetJSON<PromoBannerData>(STORAGE_KEY, defaultBanner);
    if (typeof stored === "object" && stored !== null && "title" in stored) {
      setBanner({ ...defaultBanner, ...stored });
    }
    setIsLoaded(true);
  }, []);

  const handleSave = () => {
    safeSetJSON(STORAGE_KEY, banner);
    showToast("Kampanya bandı kaydedildi", "success");
  };

  if (!isLoaded) return null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/icerik" className="rounded-lg p-2 text-dark-400 hover:bg-dark-100 hover:text-dark-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Kampanya Bandı</h1>
            <p className="text-sm text-dark-500">Ana sayfa üstündeki kampanya barını düzenleyin</p>
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

      <div className="rounded-xl border border-dark-100 bg-white p-6">
        <div className="space-y-4">
          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-dark-100 p-4">
            <div>
              <h3 className="font-medium text-dark-900">Bandı Göster</h3>
              <p className="text-xs text-dark-500">Aktif olduğunda ana sayfada görünür</p>
            </div>
            <button
              onClick={() => setBanner((prev) => ({ ...prev, active: !prev.active }))}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                banner.active
                  ? "bg-green-100 text-green-700"
                  : "bg-dark-100 text-dark-500"
              }`}
            >
              {banner.active ? <Eye size={16} /> : <EyeOff size={16} />}
              {banner.active ? "Aktif" : "Pasif"}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Başlık</label>
            <input
              value={banner.title}
              onChange={(e) => setBanner((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              placeholder="Kampanya başlığı"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Açıklama</label>
            <input
              value={banner.description}
              onChange={(e) => setBanner((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              placeholder="Kampanya açıklaması"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-dark-700">Buton Linki</label>
            <input
              value={banner.link}
              onChange={(e) => setBanner((prev) => ({ ...prev, link: e.target.value }))}
              className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              placeholder="/urunler?sale=true"
            />
          </div>

          {/* Preview */}
          {banner.active && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-dark-500">Önizleme</p>
              <div className="rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
                <p className="text-sm text-white">
                  <span className="font-bold">{banner.title}</span>{" "}
                  {banner.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
