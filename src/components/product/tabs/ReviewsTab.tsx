"use client";

import { useState, useRef } from "react";
import { Star, User, Send, ThumbsUp, ThumbsDown, ChevronDown, Info, MessageSquarePlus } from "lucide-react";
import type { Product } from "@/types";
import { useProductReviews, type ReviewSortOption } from "@/hooks/useProductReviews";
import { useAuth } from "@/context/AuthContext";
import Rating from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { CATEGORY_IMAGES } from "@/lib/constants";
import Image from "next/image";

interface ReviewsTabProps {
  product: Product;
}

const SORT_OPTIONS: { value: ReviewSortOption; label: string }[] = [
  { value: "newest", label: "En Yeni" },
  { value: "oldest", label: "En Eski" },
  { value: "highest", label: "En Yüksek Puan" },
  { value: "lowest", label: "En Düşük Puan" },
];

export default function ReviewsTab({ product }: ReviewsTabProps) {
  const { reviews, averageRating, addReview, getSortedReviews, voteHelpful, getUserVote } =
    useProductReviews(product.id);
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [sortBy, setSortBy] = useState<ReviewSortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const sortedReviews = getSortedReviews(sortBy);
  const productImage = CATEGORY_IMAGES[product.category_id] || "/images/categories/alarm.png";

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
    setShowForm(false);
    showToast("Değerlendirmeniz eklendi!", "success");
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <div className="space-y-8">
      {/* === Rating Summary — Hepsiburada Style === */}
      <div className="rounded-xl border border-dark-100 bg-white p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Product Thumbnail */}
          <div className="hidden shrink-0 sm:block">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-dark-100 bg-dark-50 p-2">
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-contain p-1"
              />
            </div>
          </div>

          {/* Average Rating */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            <p className="text-5xl font-bold text-dark-900">
              {averageRating > 0 ? averageRating.toFixed(1).replace(".", ",") : "0,0"}
            </p>
            <Rating rating={averageRating} size="sm" />
            <p className="mt-1 text-xs text-dark-400">
              {reviews.length} değerlendirme
            </p>
          </div>

          {/* Star Distribution */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => Math.round(r.rating) === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex w-10 items-center justify-end gap-0.5">
                    <Star size={12} className="fill-primary-500 text-primary-500" />
                    <span className="text-xs font-medium text-dark-600">{star}</span>
                  </div>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-dark-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-dark-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Değerlendir Button */}
        <div className="mt-6 flex flex-col items-center gap-3 border-t border-dark-100 pt-5 sm:flex-row sm:justify-between">
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
          >
            <MessageSquarePlus size={18} />
            Değerlendir
          </button>
        </div>
      </div>

      {/* === Yorum Yayınlanma Kriterleri === */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Yorum Yayınlanma Kriterleri</p>
          <ul className="mt-1.5 space-y-1 text-xs text-blue-700">
            <li>• Değerlendirme yapabilmek için giriş yapmış olmalısınız.</li>
            <li>• Yorumlar incelendikten sonra yayınlanır.</li>
            <li>• Hakaret, reklam veya konu dışı yorumlar yayınlanmaz.</li>
          </ul>
        </div>
      </div>

      {/* === Review Form (Conditional) === */}
      {showForm && (
        <div ref={formRef} className="rounded-xl border-2 border-primary-200 bg-white p-6">
          <h4 className="mb-4 text-base font-bold text-dark-900">Değerlendirme Yaz</h4>

          {!user && (
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              Yorum yapmak için giriş yapmalısınız.
            </div>
          )}

          {/* Star selector */}
          <div className="mb-4 flex items-center gap-1">
            <span className="mr-2 text-sm font-medium text-dark-600">Puanınız:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setReviewRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={
                    star <= (hoverRating || reviewRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-dark-200"
                  }
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-dark-400">
              {hoverRating || reviewRating}/5
            </span>
          </div>

          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={
              user
                ? "Ürün hakkındaki düşüncelerinizi paylaşın..."
                : "Yorum yapmak için giriş yapmalısınız"
            }
            rows={4}
            disabled={!user}
            className="w-full rounded-lg border border-dark-200 px-4 py-3 text-sm transition-colors focus:border-primary-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-dark-50"
          />

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-dark-400 hover:text-dark-600"
            >
              Vazgeç
            </button>
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
      )}

      {/* === Sort & Review List Header === */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-dark-900">
          Tüm Değerlendirmeler ({reviews.length})
        </h4>

        {reviews.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-dark-200 px-3 py-2 text-xs font-medium text-dark-600 hover:border-dark-300"
            >
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <ChevronDown size={14} />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-dark-100 bg-white shadow-lg">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`block w-full px-4 py-2.5 text-left text-xs transition-colors ${
                      sortBy === option.value
                        ? "bg-primary-50 font-semibold text-primary-600"
                        : "text-dark-600 hover:bg-dark-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Review List === */}
      {sortedReviews.length > 0 ? (
        <div className="space-y-4">
          {sortedReviews.map((review) => {
            const userVote = user ? getUserVote(review.id, user.id) : null;
            return (
              <div key={review.id} className="rounded-xl border border-dark-100 bg-white p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark-900">
                        {review.profile?.ad || "Anonim"}{" "}
                        {review.profile?.soyad?.charAt(0) || ""}.
                      </p>
                      <p className="text-xs text-dark-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <Rating rating={review.rating} size="sm" />
                </div>

                {/* Comment */}
                <p className="mt-3 text-sm leading-relaxed text-dark-600">{review.comment}</p>

                {/* Helpful voting */}
                <div className="mt-4 flex items-center gap-4 border-t border-dark-50 pt-3">
                  <span className="text-xs text-dark-400">Bu değerlendirme faydalı oldu mu?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!user) {
                          showToast("Oylama için giriş yapmalısınız", "error");
                          return;
                        }
                        voteHelpful(review.id, user.id, "yes");
                      }}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        userVote === "yes"
                          ? "bg-green-100 font-semibold text-green-700"
                          : "text-dark-400 hover:bg-dark-50 hover:text-green-600"
                      }`}
                    >
                      <ThumbsUp size={13} />
                      <span>{review.helpful_yes || 0}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!user) {
                          showToast("Oylama için giriş yapmalısınız", "error");
                          return;
                        }
                        voteHelpful(review.id, user.id, "no");
                      }}
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        userVote === "no"
                          ? "bg-red-100 font-semibold text-red-700"
                          : "text-dark-400 hover:bg-dark-50 hover:text-red-600"
                      }`}
                    >
                      <ThumbsDown size={13} />
                      <span>{review.helpful_no || 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Star size={48} className="mx-auto mb-3 text-dark-200" />
          <p className="text-dark-500">Henüz değerlendirme yapılmamış.</p>
          <p className="mt-1 text-sm text-dark-400">İlk değerlendirmeyi siz yapın!</p>
          {!showForm && (
            <button
              onClick={handleOpenForm}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <MessageSquarePlus size={16} />
              Değerlendir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
