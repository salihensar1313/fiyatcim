"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getHeroSlides } from "@/lib/queries";
import {
  createHeroSlideAction,
  updateHeroSlideAction,
  deleteHeroSlideAction,
} from "@/lib/admin-actions";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/admin/ImageUploader";
import { ADMIN_INPUT, ADMIN_TEXTAREA } from "@/lib/admin-classes";
import type { HeroSlide } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AdminSliderPage() {
  const { showToast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [image, setImage] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");

  // Load from queries.ts (demo: seed, non-demo: DB)
  useEffect(() => {
    getHeroSlides()
      .then((data) => setSlides(data))
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setImage("");
    setCtaText("Alışverişe Başla");
    setCtaLink("/urunler");
    setEditing(null);
    setFormOpen(false);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setTitle(slide.title);
    setSubtitle(slide.subtitle);
    setImage(slide.image);
    setCtaText(slide.cta_text);
    setCtaLink(slide.cta_link);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Başlık zorunludur", "error");
      return;
    }
    setSaving(true);

    try {
      if (editing) {
        const updates = { title, subtitle, image, cta_text: ctaText, cta_link: ctaLink };
        if (!IS_DEMO) {
          const result = await updateHeroSlideAction(editing.id, updates);
          if (result.error) { showToast(result.error, "error"); return; }
        }
        setSlides((prev) =>
          prev.map((s) => s.id === editing.id ? { ...s, ...updates } : s)
        );
        showToast("Slider güncellendi", "success");
      } else {
        const input = {
          title,
          subtitle,
          image: image || "/images/hero/hero-main.png",
          cta_text: ctaText || "Alışverişe Başla",
          cta_link: ctaLink || "/urunler",
        };
        if (!IS_DEMO) {
          const result = await createHeroSlideAction(input);
          if (result.error) { showToast(result.error, "error"); return; }
          if (result.data) {
            setSlides((prev) => [...prev, result.data as unknown as HeroSlide]);
          }
        } else {
          const newSlide: HeroSlide = {
            id: `temp-${Date.now()}`,
            title,
            subtitle,
            image: image || "/images/hero/hero-main.png",
            cta_text: ctaText || "Alışverişe Başla",
            cta_link: ctaLink || "/urunler",
          };
          setSlides((prev) => [...prev, newSlide]);
        }
        showToast("Yeni slider eklendi", "success");
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);

    try {
      if (!IS_DEMO) {
        const result = await deleteHeroSlideAction(deleteTarget.id);
        if (result.error) { showToast(result.error, "error"); return; }
      }
      setSlides((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      showToast("Slider silindi", "info");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ana Sayfa Slider</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">{slides.length} slayt</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Slayt
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Slaytı Düzenle" : "Yeni Slayt"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Başlık *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={ADMIN_INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Alt Başlık</label>
              <textarea
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                rows={2}
                className={ADMIN_TEXTAREA}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader value={image} onChange={setImage} label="Slider Görseli" maxWidth={1920} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Buton Metni</label>
              <input
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Buton Linki</label>
              <input
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                className={ADMIN_INPUT}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={resetForm} className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800">
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide) => (
          <div key={slide.id} className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800">
            <div className="relative h-32 bg-dark-200">
              {slide.image ? (
                slide.image.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                ) : (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-dark-500 dark:text-dark-400">
                  Gorsel yok
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-bold text-dark-900 dark:text-dark-50">{slide.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs text-dark-500 dark:text-dark-400">{slide.subtitle}</p>
              <p className="mt-2 text-xs text-primary-600">{slide.cta_text} → {slide.cta_link}</p>
              <div className="mt-3 flex items-center gap-1">
                <button
                  onClick={() => openEdit(slide)}
                  className="rounded p-1.5 text-dark-400 hover:bg-blue-50 dark:bg-blue-900/30 hover:text-blue-600"
                  title="Düzenle"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(slide)}
                  className="rounded p-1.5 text-dark-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 py-20">
          <p className="text-dark-500 dark:text-dark-400">Henüz slider yok.</p>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Slaytı Sil"
        message={`"${deleteTarget?.title}" slaytını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
