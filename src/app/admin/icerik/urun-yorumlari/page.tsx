"use client";

import { useState, useEffect } from "react";
import { Star, Check, X, Trash2 } from "lucide-react";
import { getAllReviews, updateReviewApproval, deleteReviewFromDB } from "@/lib/queries";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import type { Review } from "@/types";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

type FilterMode = "all" | "pending" | "approved" | "rejected";

export default function AdminProductReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("pending");
  const { showToast } = useToast();

  useEffect(() => {
    if (IS_DEMO) {
      setLoading(false);
      return;
    }
    getAllReviews()
      .then(setReviews)
      .catch((err) => console.error("Failed to load reviews:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    const ok = await updateReviewApproval(id, true);
    if (ok) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: true } : r)));
      showToast("Yorum onaylandı", "success");
    } else {
      showToast("İşlem başarısız", "error");
    }
  };

  const handleReject = async (id: string) => {
    const ok = await updateReviewApproval(id, false);
    if (ok) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, is_approved: false } : r)));
      showToast("Yorum reddedildi", "success");
    } else {
      showToast("İşlem başarısız", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    const ok = await deleteReviewFromDB(id);
    if (ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast("Yorum silindi", "success");
    } else {
      showToast("Silme başarısız", "error");
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;

  if (IS_DEMO) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-bold text-dark-900 dark:text-dark-50">Ürün Yorumları</h1>
        <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 p-8 text-center">
          <Star size={48} className="mx-auto mb-3 text-dark-200" />
          <p className="text-dark-500 dark:text-dark-400">Demo modda yorum moderasyonu devre dışıdır.</p>
          <p className="mt-1 text-sm text-dark-400">Supabase bağlantısı ile aktif hale gelecektir.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ürün Yorumları</h1>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          Kullanıcı değerlendirmelerini onaylayın veya reddedin
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 p-4 text-center">
          <p className="text-2xl font-bold text-dark-900 dark:text-dark-50">{reviews.length}</p>
          <p className="text-xs text-dark-400">Toplam</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
          <p className="text-xs text-orange-500">Bekleyen</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-xs text-green-500">Onaylı</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2">
        {(
          [
            { key: "pending", label: `Bekleyen (${pendingCount})` },
            { key: "approved", label: `Onaylı (${approvedCount})` },
            { key: "all", label: `Tümü (${reviews.length})` },
          ] as { key: FilterMode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary-600 text-white"
                : "bg-dark-100 text-dark-600 dark:bg-dark-700 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 py-16 text-center">
          <Star size={48} className="mx-auto mb-3 text-dark-200" />
          <p className="text-dark-500 dark:text-dark-400">
            {filter === "pending" ? "Bekleyen yorum yok" : "Yorum bulunamadı"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-dark-900 dark:text-dark-50">
                      {review.profile?.ad || "Anonim"} {review.profile?.soyad?.charAt(0) || ""}.
                    </p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-dark-200"}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-dark-400">{formatDate(review.created_at)}</span>
                    {review.is_approved ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Onaylı
                      </span>
                    ) : (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        Bekliyor
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {review.images.map((img, idx) => (
                        <div key={idx} className="h-12 w-12 overflow-hidden rounded border border-dark-200">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 gap-1.5">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200"
                      title="Onayla"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      onClick={() => handleReject(review.id)}
                      className="rounded-lg bg-orange-100 p-2 text-orange-700 transition-colors hover:bg-orange-200"
                      title="Reddet"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
