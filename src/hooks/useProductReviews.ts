"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import type { Review, ReviewVote } from "@/types";

const STORAGE_KEY = "fiyatcim_reviews";
const VOTES_KEY = "fiyatcim_review_votes";

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest";

export function useProductReviews(productId?: string) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allVotes, setAllVotes] = useState<ReviewVote[]>([]);

  useEffect(() => {
    const stored = safeGetJSON<Review[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setAllReviews(stored);
    const storedVotes = safeGetJSON<ReviewVote[]>(VOTES_KEY, []);
    if (Array.isArray(storedVotes)) setAllVotes(storedVotes);
  }, []);

  const reviews = productId
    ? allReviews.filter((r) => r.product_id === productId && r.is_approved)
    : allReviews;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const addReview = useCallback((review: Omit<Review, "id" | "created_at" | "is_approved" | "helpful_yes" | "helpful_no">) => {
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
  }, []);

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
    (reviewId: string, userId: string, vote: "yes" | "no") => {
      // Remove existing vote for this user/review
      const filtered = allVotes.filter(
        (v) => !(v.review_id === reviewId && v.user_id === userId)
      );
      const newVote: ReviewVote = { review_id: reviewId, user_id: userId, vote };
      const updatedVotes = [...filtered, newVote];
      setAllVotes(updatedVotes);
      safeSetJSON(VOTES_KEY, updatedVotes);

      // Update review helpful counts
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
    const pReviews = allReviews.filter((r) => r.product_id === pid && r.is_approved);
    const avg = pReviews.length > 0
      ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length
      : 0;
    return { count: pReviews.length, average: Math.round(avg * 10) / 10 };
  }, [allReviews]);

  return {
    reviews,
    allReviews,
    averageRating,
    addReview,
    getSortedReviews,
    voteHelpful,
    getUserVote,
    getProductStats,
  };
}
