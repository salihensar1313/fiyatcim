"use client";

import { useState, useEffect } from "react";
import { Globe, Save, Search, FileText } from "lucide-react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { useToast } from "@/components/ui/Toast";

interface PageSEO {
  path: string;
  label: string;
  title: string;
  description: string;
}

const STORAGE_KEY = "fiyatcim_seo_pages";

const DEFAULT_PAGES: PageSEO[] = [
  { path: "/", label: "Ana Sayfa", title: "Fiyatcim.com — Uzman Onaylı Elektronik Marketi", description: "Fiyatcim.com; uzman onaylı rehberler, karşılaştırmalar ve güvenilir alışveriş deneyimiyle Türkiye'nin elektronik marketi." },
  { path: "/urunler", label: "Tüm Ürünler", title: "Tüm Ürünler | Fiyatcim", description: "Alarm sistemleri, güvenlik kameraları, akıllı ev ve geçiş kontrol ürünlerini keşfedin." },
  { path: "/kategori/alarm-sistemleri", label: "Alarm Sistemleri", title: "Alarm Sistemleri | Fiyatcim", description: "Ev ve iş yeri güvenliği için kablosuz ve kablolu alarm sistemleri." },
  { path: "/kategori/guvenlik-kameralari", label: "Güvenlik Kameraları", title: "Güvenlik Kameraları | Fiyatcim", description: "IP kamera, analog kamera ve NVR/DVR kayıt cihazları." },
  { path: "/kategori/akilli-ev-sistemleri", label: "Akıllı Ev", title: "Akıllı Ev Sistemleri | Fiyatcim", description: "Akıllı priz, aydınlatma, sensör ve ev otomasyon ürünleri." },
  { path: "/kategori/gecis-kontrol-sistemleri", label: "Geçiş Kontrol", title: "Geçiş Kontrol Sistemleri | Fiyatcim", description: "Parmak izi, kartlı geçiş ve turnike sistemleri." },
  { path: "/blog", label: "Blog", title: "Blog | Fiyatcim", description: "Güvenlik ve teknoloji dünyasından güncel haberler, rehberler ve karşılaştırmalar." },
  { path: "/hakkimizda", label: "Hakkımızda", title: "Hakkımızda | Fiyatcim", description: "Fiyatcim.com hakkında bilgi edinin." },
  { path: "/iletisim", label: "İletişim", title: "İletişim | Fiyatcim", description: "Bize ulaşın, sorularınızı yanıtlayalım." },
  { path: "/sss", label: "SSS", title: "Sıkça Sorulan Sorular | Fiyatcim", description: "Merak ettiğiniz soruların cevaplarını bulun." },
];

export default function AdminSeoPage() {
  const [pages, setPages] = useState<PageSEO[]>(DEFAULT_PAGES);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const stored = safeGetJSON<PageSEO[]>(STORAGE_KEY, []);
    if (Array.isArray(stored) && stored.length > 0) {
      setPages(stored);
    }
  }, []);

  const startEdit = (page: PageSEO) => {
    setEditingPath(page.path);
    setEditTitle(page.title);
    setEditDesc(page.description);
  };

  const saveEdit = () => {
    if (!editingPath) return;
    const updated = pages.map((p) =>
      p.path === editingPath ? { ...p, title: editTitle, description: editDesc } : p
    );
    setPages(updated);
    safeSetJSON(STORAGE_KEY, updated);
    setEditingPath(null);
    showToast("SEO bilgileri güncellendi", "success");
  };

  const cancelEdit = () => {
    setEditingPath(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dark-900">
          <Globe size={24} />
          SEO Yönetimi
        </h1>
        <p className="text-sm text-dark-500">Sayfa bazlı meta title ve description düzenleyin</p>
      </div>

      {/* SEO Tips */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-blue-800">
          <Search size={16} />
          SEO İpuçları
        </h3>
        <ul className="mt-2 space-y-1 text-xs text-blue-700">
          <li>Title: 50-60 karakter optimal (Google&apos;da tam görünür)</li>
          <li>Description: 150-160 karakter optimal (arama sonuçlarında tam görünür)</li>
          <li>Her sayfada benzersiz title ve description kullanın</li>
          <li>Ana keyword&apos;ü title&apos;ın başına yakın yerleştirin</li>
        </ul>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {pages.map((page) => (
          <div key={page.path} className="rounded-xl border border-dark-100 bg-white p-5">
            {editingPath === page.path ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary-600" />
                  <span className="text-sm font-bold text-dark-900">{page.label}</span>
                  <span className="rounded bg-dark-100 px-2 py-0.5 text-xs text-dark-500">{page.path}</span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-600">
                    Meta Title
                    <span className={`ml-2 ${editTitle.length > 60 ? "text-red-600" : "text-dark-400"}`}>
                      ({editTitle.length}/60)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                  />
                  {editTitle.length > 60 && (
                    <p className="mt-1 text-xs text-red-600">Title 60 karakteri aşıyor, Google&apos;da kesilebilir.</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-dark-600">
                    Meta Description
                    <span className={`ml-2 ${editDesc.length > 160 ? "text-red-600" : "text-dark-400"}`}>
                      ({editDesc.length}/160)
                    </span>
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                  />
                  {editDesc.length > 160 && (
                    <p className="mt-1 text-xs text-red-600">Description 160 karakteri aşıyor, Google&apos;da kesilebilir.</p>
                  )}
                </div>

                {/* Google Preview */}
                <div className="rounded-lg border border-dark-200 bg-dark-50 p-4">
                  <p className="text-xs font-medium text-dark-400 mb-2">Google Önizlemesi:</p>
                  <div>
                    <p className="text-lg text-blue-700 hover:underline cursor-pointer truncate">{editTitle || "Başlık giriniz"}</p>
                    <p className="text-sm text-green-700">{`www.fiyatcim.com${page.path}`}</p>
                    <p className="text-sm text-dark-600 line-clamp-2">{editDesc || "Açıklama giriniz"}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                  >
                    <Save size={14} />
                    Kaydet
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-600 hover:bg-dark-50"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div
                onClick={() => startEdit(page)}
                className="cursor-pointer transition-colors hover:bg-dark-50 -m-5 p-5 rounded-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-primary-600" />
                    <span className="text-sm font-bold text-dark-900">{page.label}</span>
                    <span className="rounded bg-dark-100 px-2 py-0.5 text-xs text-dark-500">{page.path}</span>
                  </div>
                  <span className="text-xs text-primary-600">Düzenle</span>
                </div>
                <p className="mt-2 text-sm text-dark-700 truncate">{page.title}</p>
                <p className="mt-1 text-xs text-dark-500 line-clamp-1">{page.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
