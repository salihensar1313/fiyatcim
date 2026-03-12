"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft, GripVertical } from "lucide-react";
import Link from "next/link";
import { getCategories } from "@/lib/queries";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/admin-actions";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/admin/ImageUploader";
import { ADMIN_INPUT } from "@/lib/admin-classes";
import type { Category } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AdminKategorilerPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  // Load from queries.ts (demo: seed, non-demo: DB)
  useEffect(() => {
    getCategories()
      .then((data) => setItems(data))
      .catch(console.error);
  }, []);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resetForm = () => {
    setName(""); setSlug(""); setImage(""); setSortOrder(0);
    setEditing(null); setFormOpen(false);
  };

  const openNew = () => { resetForm(); setFormOpen(true); };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImage(cat.image_url);
    setSortOrder(cat.sort_order);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { showToast("Kategori adı zorunludur", "error"); return; }
    const finalSlug = slug.trim() || slugify(name);
    setSaving(true);

    try {
      if (editing) {
        const updates = { name, slug: finalSlug, image_url: image, sort_order: sortOrder };
        if (!IS_DEMO) {
          const result = await updateCategoryAction(editing.id, updates);
          if (result.error) { showToast(result.error, "error"); return; }
        }
        setItems((prev) =>
          prev.map((c) => c.id === editing.id ? { ...c, ...updates } : c)
        );
        showToast("Kategori güncellendi", "success");
      } else {
        const input = { name, slug: finalSlug, image_url: image || "/images/categories/default.png", sort_order: sortOrder || items.length + 1 };
        if (!IS_DEMO) {
          const result = await createCategoryAction(input);
          if (result.error) { showToast(result.error, "error"); return; }
          if (result.data) {
            setItems((prev) => [...prev, result.data as unknown as Category]);
          }
        } else {
          const newCat: Category = {
            id: `temp-${Date.now()}`,
            name,
            slug: finalSlug,
            image_url: image || "/images/categories/default.png",
            sort_order: sortOrder || items.length + 1,
            created_at: new Date().toISOString(),
          };
          setItems((prev) => [...prev, newCat]);
        }
        showToast("Yeni kategori eklendi", "success");
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
        const result = await deleteCategoryAction(deleteTarget.id);
        if (result.error) { showToast(result.error, "error"); return; }
      }
      setItems((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      showToast("Kategori silindi", "info");
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
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Kategoriler</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">{items.length} kategori</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Kategori
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Kategoriyi Düzenle" : "Yeni Kategori"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kategori Adı *</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }}
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={ADMIN_INPUT}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Sıra No</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className={ADMIN_INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageUploader value={image} onChange={setImage} label="Kategori Görseli" />
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50 dark:bg-dark-800">
              <tr>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Sıra</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Kategori</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Slug</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Sıra No</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {items.map((cat) => (
                <tr key={cat.id} className="hover:bg-dark-50/50">
                  <td className="px-4 py-3 text-dark-400">
                    <GripVertical size={14} />
                  </td>
                  <td className="px-4 py-3 font-medium text-dark-900 dark:text-dark-50">{cat.name}</td>
                  <td className="px-4 py-3 text-dark-500 dark:text-dark-400">/{cat.slug}</td>
                  <td className="px-4 py-3 text-dark-500 dark:text-dark-400">{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="rounded p-1.5 text-dark-400 hover:bg-blue-50 dark:bg-blue-900/30 hover:text-blue-600"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="rounded p-1.5 text-dark-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-600"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-dark-500 dark:text-dark-400">Henüz kategori yok.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Kategoriyi Sil"
        message={`"${deleteTarget?.name}" kategorisini silmek istediğinize emin misiniz?`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
