"use client";

import { useState } from "react";
import { Shield, Truck, Package, CheckCircle, Star, User, Send } from "lucide-react";
import type { Product } from "@/types";
import { useProductReviews } from "@/hooks/useProductReviews";
import { useAuth } from "@/context/AuthContext";
import Rating from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface ProductTabsProps {
  product: Product;
}

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");
  const { reviews, averageRating, addReview } = useProductReviews(product.id);
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const handleSubmitReview = () => {
    if (!user) {
      showToast("Yorum yapmak için giriş yapmalısınız", "error");
      return;
    }
    if (!reviewComment.trim()) {
      showToast("Lütfen bir yorum yazın", "error");
      return;
    }
    addReview({
      product_id: product.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
      profile: profile || undefined,
    });
    setReviewComment("");
    setReviewRating(5);
    showToast("Değerlendirmeniz eklendi!", "success");
  };

  const tabs = [
    { key: "description" as const, label: "Ürün Açıklaması" },
    { key: "specs" as const, label: "Teknik Özellikler" },
    { key: "reviews" as const, label: `Değerlendirmeler (${reviews.length})` },
  ];

  return (
    <div>
      {/* Tab Headers */}
      <div className="flex border-b border-dark-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-dark-500 hover:text-dark-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === "description" && (
          <div className="space-y-6">
            {/* Description text */}
            <div className="prose max-w-none">
              <p className="whitespace-pre-line leading-relaxed text-dark-700">
                {product.description}
              </p>
            </div>

            {/* Highlights */}
            <div className="grid gap-4 sm:grid-cols-3">
              {product.warranty_months > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <Shield size={20} className="mt-0.5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      {product.warranty_months} Ay Garanti
                    </p>
                    <p className="mt-0.5 text-xs text-green-700">
                      Üretici garantisi kapsamında
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Truck size={20} className="mt-0.5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    {product.shipping_type === "kurulum" ? "Ücretsiz Kurulum" : "Hızlı Kargo"}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-700">
                    {product.shipping_type === "kurulum"
                      ? "Profesyonel ekip ile montaj"
                      : "2.000₺ üzeri ücretsiz"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
                <Package size={20} className="mt-0.5 shrink-0 text-purple-600" />
                <div>
                  <p className="text-sm font-semibold text-purple-800">14 Gün İade</p>
                  <p className="mt-0.5 text-xs text-purple-700">
                    Koşulsuz iade ve değişim
                  </p>
                </div>
              </div>
            </div>

            {/* Key Features */}
            {Object.keys(product.specs).length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-dark-900">Öne Çıkan Özellikler</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(product.specs).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <CheckCircle size={14} className="shrink-0 text-primary-600" />
                      <span className="text-sm text-dark-700">
                        <span className="font-medium">{key}:</span> {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "specs" && (
          <div className="overflow-hidden rounded-lg border border-dark-100">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specs).map(([key, value], index) => (
                  <tr key={key} className={index % 2 === 0 ? "bg-dark-50" : "bg-white"}>
                    <td className="w-1/3 px-4 py-3 text-sm font-semibold text-dark-700">{key}</td>
                    <td className="px-4 py-3 text-sm text-dark-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-8">
            {/* Average Rating Summary */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-6 rounded-xl border border-dark-100 bg-dark-50 p-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-dark-900">{averageRating.toFixed(1)}</p>
                  <Rating rating={averageRating} size="sm" />
                  <p className="mt-1 text-xs text-dark-500">{reviews.length} değerlendirme</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-8 text-right text-xs text-dark-500">{star} ★</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-dark-200">
                          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-xs text-dark-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Review Form */}
            <div className="rounded-xl border border-dark-100 bg-white p-6">
              <h4 className="mb-4 font-bold text-dark-900">Değerlendirme Yaz</h4>
              {/* Star selector */}
              <div className="mb-4 flex items-center gap-1">
                <span className="mr-2 text-sm text-dark-600">Puanınız:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      className={star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-dark-300"}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={user ? "Ürün hakkındaki düşüncelerinizi paylaşın..." : "Yorum yapmak için giriş yapmalısınız"}
                rows={3}
                className="w-full rounded-lg border border-dark-200 px-4 py-3 text-sm focus:border-primary-600 focus:outline-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSubmitReview}
                  disabled={!user || !reviewComment.trim()}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  Yorum Gönder
                </button>
              </div>
            </div>

            {/* Review List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-dark-100 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark-900">
                            {review.profile?.ad || "Anonim"} {review.profile?.soyad?.charAt(0) || ""}.
                          </p>
                          <p className="text-xs text-dark-400">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <Rating rating={review.rating} size="sm" />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-dark-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star size={48} className="mx-auto mb-3 text-dark-200" />
                <p className="text-dark-500">Henüz değerlendirme yapılmamış.</p>
                <p className="mt-1 text-sm text-dark-400">
                  İlk değerlendirmeyi siz yapın!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
