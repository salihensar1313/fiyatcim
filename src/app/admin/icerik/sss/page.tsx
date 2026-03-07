"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getFaqs } from "@/lib/queries";
import {
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
} from "@/lib/admin-actions";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";
import type { FAQ } from "@/types";

const ConfirmModal = dynamic(() => import("@/components/ui/ConfirmModal"), { ssr: false });

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const FAQ_CATEGORIES = ["Genel", "Kurulum", "Garanti", "Hizmet", "Ödeme", "Kargo", "İade", "Teknik"];

export default function AdminFAQPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<FAQ[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  // Form fields
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Genel");

  // Load from queries.ts (demo: seed, non-demo: DB)
  useEffect(() => {
    getFaqs()
      .then((data) => setItems(data))
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setCategory("Genel");
    setEditing(null);
    setFormOpen(false);
  };

  const openNew = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditing(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!question.trim() || !answer.trim()) {
      showToast("Soru ve cevap zorunludur", "error");
      return;
    }
    setSaving(true);

    try {
      if (editing) {
        const updates = { question, answer, category };
        if (!IS_DEMO) {
          const result = await updateFaqAction(editing.id, updates);
          if (result.error) { showToast(result.error, "error"); return; }
        }
        setItems((prev) =>
          prev.map((f) => f.id === editing.id ? { ...f, ...updates } : f)
        );
        showToast("SSS güncellendi", "success");
      } else {
        const input = { question, answer, category };
        if (!IS_DEMO) {
          const result = await createFaqAction(input);
          if (result.error) { showToast(result.error, "error"); return; }
          if (result.data) {
            setItems((prev) => [result.data as unknown as FAQ, ...prev]);
          }
        } else {
          const newFaq: FAQ = {
            id: `temp-${Date.now()}`,
            question,
            answer,
            category,
          };
          setItems((prev) => [newFaq, ...prev]);
        }
        showToast("Yeni SSS eklendi", "success");
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
        const result = await deleteFaqAction(deleteTarget.id);
        if (result.error) { showToast(result.error, "error"); return; }
      }
      setItems((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      showToast("SSS silindi", "info");
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
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Sıkça Sorulan Sorular</h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">{items.length} soru</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus size={16} />
          Yeni Soru
        </button>
      </div>

      {/* Form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
          <h3 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">
            {editing ? "Soruyu Düzenle" : "Yeni SSS"}
          </h3>
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Soru *</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                placeholder="Soru metnini yazın..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Cevap *</label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                placeholder="Cevap metnini yazın..."
              />
            </div>
            <div className="max-w-xs">
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Soru</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">Kategori</th>
                <th className="px-4 py-3 font-semibold text-dark-700 dark:text-dark-200">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {items.map((faq) => (
                <tr key={faq.id} className="hover:bg-dark-50/50">
                  <td className="max-w-[400px] px-4 py-3">
                    <p className="font-medium text-dark-900 dark:text-dark-50">{faq.question}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-dark-400">{faq.answer}</p>
                  </td>
                  <td className="px-4 py-3 text-dark-500 dark:text-dark-400">{faq.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(faq)}
                        className="rounded p-1.5 text-dark-400 hover:bg-blue-50 dark:bg-blue-900/30 hover:text-blue-600"
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(faq)}
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
            <p className="text-dark-500 dark:text-dark-400">Henüz SSS yok.</p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Soruyu Sil"
        message={`"${deleteTarget?.question}" sorusunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Evet, Sil"
        cancelLabel="İptal"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
