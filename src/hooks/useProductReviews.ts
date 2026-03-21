"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { getProductReviews, addReviewToDB, upsertReviewVote } from "@/lib/queries";
import type { Review, ReviewVote } from "@/types";
import { logger } from "@/lib/logger";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const STORAGE_KEY = "fiyatcim_reviews";
const VOTES_KEY = "fiyatcim_review_votes";

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest";

export function useProductReviews(productId?: string) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allVotes, setAllVotes] = useState<ReviewVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    if (IS_DEMO) {
      // Demo: localStorage
      const stored = safeGetJSON<Review[]>(STORAGE_KEY, []);
      if (Array.isArray(stored)) setAllReviews(stored);
      const storedVotes = safeGetJSON<ReviewVote[]>(VOTES_KEY, []);
      if (Array.isArray(storedVotes)) setAllVotes(storedVotes);
      setLoading(false);
    } else {
      // Production: Supabase
      getProductReviews(productId)
        .then((reviews) => setAllReviews(reviews))
        .catch((err) => logger.error("reviews_load_failed", { fn: "useProductReviews", error: err instanceof Error ? err.message : String(err) }))
        .finally(() => setLoading(false));
    }
  }, [productId]);

  const reviews = productId
    ? allReviews.filter((r) =>
        IS_DEMO
          ? r.product_id === productId && r.is_approved
          : true // Supabase query already filters by product_id + is_approved
      )
    : allReviews;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const addReview = useCallback(
    async (review: Omit<Review, "id" | "created_at" | "is_approved" | "helpful_yes" | "helpful_no">) => {
      if (IS_DEMO) {
        // Demo: localStorage
        const newReview: Review = {
          ...review,
          id: `rev-${Date.now()}`,
          is_approved: true,
          helpful_yes: 0,
          helpful_no: 0,
          created_at: new Date().toISOString(),
        };
        setAllReviews((prev) => {
          const updated = [newReview, ...prev];
          safeSetJSON(STORAGE_KEY, updated);
          return updated;
        });
        return newReview;
      } else {
        // Production: Supabase (review starts as unapproved)
        const saved = await addReviewToDB({
          product_id: review.product_id,
          user_id: review.user_id,
          rating: review.rating,
          comment: review.comment,
          images: review.images,
        });
        // Don't add to local state since it's not approved yet
        return saved;
      }
    },
    []
  );

  const getSortedReviews = useCallback(
    (sortBy: ReviewSortOption) => {
      const sorted = [...reviews];
      switch (sortBy) {
        case "newest":
          return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        case "oldest":
          return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case "highest":
          return sorted.sort((a, b) => b.rating - a.rating);
        case "lowest":
          return sorted.sort((a, b) => a.rating - b.rating);
        default:
          return sorted;
      }
    },
    [reviews]
  );

  const voteHelpful = useCallback(
    async (reviewId: string, userId: string, vote: "yes" | "no") => {
      if (IS_DEMO) {
        // Demo: localStorage
        const filtered = allVotes.filter(
          (v) => !(v.review_id === reviewId && v.user_id === userId)
        );
        const newVote: ReviewVote = { review_id: reviewId, user_id: userId, vote };
        const updatedVotes = [...filtered, newVote];
        setAllVotes(updatedVotes);
        safeSetJSON(VOTES_KEY, updatedVotes);

        setAllReviews((prev) => {
          const updated = prev.map((r) => {
            if (r.id !== reviewId) return r;
            const reviewVotes = updatedVotes.filter((v) => v.review_id === reviewId);
            return {
              ...r,
              helpful_yes: reviewVotes.filter((v) => v.vote === "yes").length,
              helpful_no: reviewVotes.filter((v) => v.vote === "no").length,
            };
          });
          safeSetJSON(STORAGE_KEY, updated);
          return updated;
        });
      } else {
        // Production: Supabase
        await upsertReviewVote(reviewId, userId, vote);
        // Optimistic update
        setAllReviews((prev) =>
          prev.map((r) => {
            if (r.id !== reviewId) return r;
            return {
              ...r,
              helpful_yes: vote === "yes" ? r.helpful_yes + 1 : r.helpful_yes,
              helpful_no: vote === "no" ? r.helpful_no + 1 : r.helpful_no,
            };
          })
        );
      }
    },
    [allVotes]
  );

  const getUserVote = useCallback(
    (reviewId: string, userId: string): "yes" | "no" | null => {
      const vote = allVotes.find(
        (v) => v.review_id === reviewId && v.user_id === userId
      );
      return vote?.vote || null;
    },
    [allVotes]
  );

  const getProductStats = useCallback((pid: string) => {
    const pReviews = allReviews.filter((r) =>
      IS_DEMO
        ? r.product_id === pid && r.is_approved
        : r.product_id === pid
    );
    const avg = pReviews.length > 0
      ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length
      : 0;
    return { count: pReviews.length, average: Math.round(avg * 10) / 10 };
  }, [allReviews]);

  return {
    reviews,
    allReviews,
    averageRating,
    loading,
    addReview,
    getSortedReviews,
    voteHelpful,
    getUserVote,
    getProductStats,
  };
}
