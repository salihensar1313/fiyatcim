"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getBlogPosts } from "@/lib/queries";
import {
  createBlogPostAction,
  updateBlogPostAction,
  deleteBlogPostAction,
} from "@/lib/admin-actions";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import ImageUploader from "@/components/admin/ImageUploader";
import type { BlogPost } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function AdminBlogPage() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("Rehber");

  // Load from queries.ts (demo: seed, non-demo: DB)
  useEffect(() => {
    getBlogPosts()
      .then((data) => setBlogs(data))
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setImage("/images/blog/blog-1.jpg");
    setCategory("Rehber");
    setEditing(null);
    setFormOpen(false);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (blog: BlogPost) => {
    setEditing(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setImage(blog.image);
    setCategory(blog.category);
    setFormOpen(true);
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Başlık zorunludur", "error");
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    setSaving(true);

    try {
      if (editing) {
        const updates = { title, slug: finalSlug, excerpt, content, image, category };
        if (!IS_DEMO) {
          const result = await updateBlogPostAction(editing.id, updates);
          if (result.error) { showToast(result.error, "error"); return; }
        }
        setBlogs((prev) =>
          prev.map((b) => b.id === editing.id ? { ...b, ...updates } : b)
        );
        showToast("Blog yazısı güncellendi", "success");
      } else {
        const input = { title, slug: finalSlug, excerpt, content, image: image || "/images/blog/blog-1.jpg", category };
        if (!IS_DEMO) {
          const result = await createBlogPostAction(input);
          if (result.error) { showToast(result.error, "error"); return; }
          if (result.data) {
            setBlogs((prev) => [result.data as unknown as BlogPost, ...prev]);
          }
        } else {
          const newPost: BlogPost = {
            id: `temp-${Date.now()}`,
            title,
            slug: finalSlug,
            excerpt,
            content,
            image: image || "/images/blog/blog-1.jpg",
            category,
            created_at: new Date().toISOString(),
          };
          setBlogs((prev) => [newPost, ...prev]);
        }
        showToast("Yeni blog yazısı eklendi", "success");
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
        const result = await deleteBlogPostAction(deleteTarget.id);
        if (result.error) { showToast(result.error, "error"); return; }
      }
      setBlogs((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      showToast("Blog yazısı silindi", "info");
      setDeleteTarget(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/icerik" className="rounded-lg p-2 text-dark-400 hover:bg-dark-100 hover:text-dark-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">Blog Yazıları</h1>
            <p className="text-sm text-dark-500">{blogs.length} yazı</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Yazı
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900">
            {editing ? "Yazıyı Düzenle" : "Yeni Blog Yazısı"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700">Başlık *</label>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              >
                <option value="Rehber">Rehber</option>
                <option value="Teknik">Teknik</option>
                <option value="Trend">Trend</option>
                <option value="Haber">Haber</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700">Özet</label>
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-dark-700">İçerik</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div>
              <ImageUploader value={image} onChange={setImage} label="Kapak Görseli" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={resetForm} className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-700 hover:bg-dark-50">
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
      <div className="overflow-hidden rounded-xl border border-dark-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-100 bg-dark-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-dark-700">Başlık</th>
                <th className="px-4 py-3 font-semibold text-dark-700">Kategori</th>
                <th className="px-4 py-3 font-semibold text-dark-700">Tarih</th>
                <th className="px-4 py-3 font-semibold text-dark-700">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-dark-50/50">
                  <td className="max-w-[300px] px-4 py-3">
                    <p className="truncate font-medium text-dark-900">{blog.title}</p>
                    <p className="truncate text-xs text-dark-400">/{blog.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-dark-500">{blog.category}</td>
                  <td className="px-4 py-3 text-dark-500">
                    {new Date(blog.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(blog)}
                        className="rounded p-1.5 text-dark-400 hover:bg-blue-50 hover:text-blue-600"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(blog)}
                        className="rounded p-1.5 text-dark-400 hover:bg-red-50 hover:text-red-600"
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

        {blogs.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-dark-500">Henüz blog yazısı yok.</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Blog Yazısını Sil"
        message={`"${deleteTarget?.title}" yazısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
