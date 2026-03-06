"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { getTestimonials } from "@/lib/queries";
import {
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
} from "@/lib/admin-actions";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import type { Testimonial } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AdminYorumlarPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  // Load from queries.ts (demo: seed, non-demo: DB)
  useEffect(() => {
    getTestimonials()
      .then((data) => setItems(data))
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setName(""); setCompany(""); setComment(""); setRating(5);
    setEditing(null); setFormOpen(false);
  };

  const openNew = () => { resetForm(); setFormOpen(true); };

  const openEdit = (item: Testimonial) => {
    setEditing(item);
    setName(item.name);
    setCompany(item.company);
    setComment(item.comment);
    setRating(item.rating);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !comment.trim()) {
      showToast("Ad ve yorum zorunludur", "error");
      return;
    }
    setSaving(true);

    try {
      if (editing) {
        const updates = { name, company, comment, rating };
        if (!IS_DEMO) {
          const result = await updateTestimonialAction(editing.id, updates);
          if (result.error) { showToast(result.error, "error"); return; }
        }
        setItems((prev) =>
          prev.map((t) => t.id === editing.id ? { ...t, ...updates } : t)
        );
        showToast("Yorum güncellendi", "success");
      } else {
        const input = { name, company, comment, rating };
        if (!IS_DEMO) {
          const result = await createTestimonialAction(input);
          if (result.error) { showToast(result.error, "error"); return; }
          if (result.data) {
            setItems((prev) => [...prev, result.data as unknown as Testimonial]);
          }
        } else {
          const newItem: Testimonial = {
            id: `temp-${Date.now()}`,
            name,
            company,
            comment,
            rating,
          };
          setItems((prev) => [...prev, newItem]);
        }
        showToast("Yeni yorum eklendi", "success");
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
        const result = await deleteTestimonialAction(deleteTarget.id);
        if (result.error) { showToast(result.error, "error"); return; }
      }
      setItems((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast("Yorum silindi", "info");
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
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Müşteri Yorumları</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">{items.length} yorum</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Yorum
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Yorumu Düzenle" : "Yeni Yorum"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İsim *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                placeholder="Müşteri adı"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şirket</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                placeholder="Şirket adı (opsiyonel)"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Yorum *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                placeholder="Müşteri yorumu"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Puan</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    className="transition-colors"
                  >
                    <Star
                      size={24}
                      className={val <= rating ? "fill-yellow-400 text-yellow-400" : "text-dark-200"}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-dark-500 dark:text-dark-400">{rating}/5</span>
              </div>
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
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-dark-900 dark:text-dark-50">{item.name}</h4>
                {item.company && <p className="text-xs text-dark-500 dark:text-dark-400">{item.company}</p>}
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
            <div className="mt-2 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-dark-200"}
                />
              ))}
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-dark-600 dark:text-dark-300">{item.comment}</p>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <p className="text-dark-500 dark:text-dark-400">Henüz yorum yok.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Yorumu Sil"
        message={`"${deleteTarget?.name}" yorumunu silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
