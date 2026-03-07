"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { Truck, ShieldCheck, Headphones, Award, Star, Heart, Zap, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import dynamic from "next/dynamic";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

interface TrustBadgeItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const STORAGE_KEY = "fiyatcim_trust_badges";

const ICON_OPTIONS = [
  { value: "Truck", label: "Kargo", Icon: Truck },
  { value: "ShieldCheck", label: "Güvenlik", Icon: ShieldCheck },
  { value: "Headphones", label: "Destek", Icon: Headphones },
  { value: "Award", label: "Garanti", Icon: Award },
  { value: "Star", label: "Yıldız", Icon: Star },
  { value: "Heart", label: "Kalp", Icon: Heart },
  { value: "Zap", label: "Hız", Icon: Zap },
  { value: "Clock", label: "Saat", Icon: Clock },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, ShieldCheck, Headphones, Award, Star, Heart, Zap, Clock,
};

const defaultBadges: TrustBadgeItem[] = [
  { id: "tb-1", title: "Ucretsiz Kargo", desc: "2.000TL uzeri siparislerde ucretsiz kargo", icon: "Truck" },
  { id: "tb-2", title: "Guvenli Odeme", desc: "256-bit SSL ile korunan guvenli alisveris", icon: "ShieldCheck" },
  { id: "tb-3", title: "7/24 Destek", desc: "Teknik destek hattimiz her zaman acik", icon: "Headphones" },
  { id: "tb-4", title: "Memnuniyet Garantisi", desc: "14 gun icinde kosulsuz iade hakki", icon: "Award" },
];

export default function AdminGuvenRozetleriPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<TrustBadgeItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrustBadgeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TrustBadgeItem | null>(null);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("Award");

  useEffect(() => {
    const data = safeGetJSON<TrustBadgeItem[]>(STORAGE_KEY, []);
    const valid = Array.isArray(data) && data.length > 0
      ? data.filter((b): b is TrustBadgeItem => typeof b === "object" && b !== null && "id" in b && "title" in b)
      : defaultBadges;
    setItems(valid);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    safeSetJSON(STORAGE_KEY, items);
  }, [items, isLoaded]);

  const resetForm = () => {
    setTitle(""); setDesc(""); setIcon("Award");
    setEditing(null); setFormOpen(false);
  };

  const openNew = () => { resetForm(); setFormOpen(true); };

  const openEdit = (item: TrustBadgeItem) => {
    setEditing(item);
    setTitle(item.title);
    setDesc(item.desc);
    setIcon(item.icon);
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) { showToast("Başlık zorunludur", "error"); return; }

    if (editing) {
      setItems((prev) =>
        prev.map((b) =>
          b.id === editing.id ? { ...b, title, desc, icon } : b
        )
      );
      showToast("Rozet güncellendi", "success");
    } else {
      const newItem: TrustBadgeItem = {
        id: `tb-${Date.now()}`,
        title,
        desc,
        icon,
      };
      setItems((prev) => [...prev, newItem]);
      showToast("Yeni rozet eklendi", "success");
    }
    resetForm();
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setItems((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast("Rozet silindi", "info");
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/icerik" className="rounded-lg p-2 text-dark-400 hover:bg-dark-100 hover:text-dark-600 dark:text-dark-300">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Güven Rozetleri</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">{items.length} rozet</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Rozet
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Rozeti Düzenle" : "Yeni Rozet"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Başlık *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İkon</label>
              <div className="grid grid-cols-4 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIcon(opt.value)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                      icon === opt.value
                        ? "border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-600"
                        : "border-dark-200 text-dark-500 dark:text-dark-400 hover:border-primary-300"
                    }`}
                  >
                    <opt.Icon size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Açıklama</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={resetForm} className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800">
              İptal
            </button>
            <button onClick={handleSave} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
              {editing ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const IconComp = ICON_MAP[item.icon] || Award;
          return (
            <div key={item.id} className="flex items-start gap-4 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                <IconComp size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-dark-900 dark:text-dark-50">{item.title}</h4>
                <p className="mt-0.5 text-xs text-dark-500 dark:text-dark-400">{item.desc}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(item)}
                  className="rounded p-1.5 text-dark-400 hover:bg-blue-50 dark:bg-blue-900/30 hover:text-blue-600"
                  title="Düzenle"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(item)}
                  className="rounded p-1.5 text-dark-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 py-20">
          <p className="text-dark-500 dark:text-dark-400">Henüz rozet yok.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Rozeti Sil"
        message={`"${deleteTarget?.title}" rozetini silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
