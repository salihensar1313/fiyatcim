"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import type { Review } from "@/types";

const STORAGE_KEY = "fiyatcim_reviews";

export function useProductReviews(productId?: string) {
  const [allReviews, setAllReviews] = useState<Review[]>([]);

  useEffect(() => {
    const stored = safeGetJSON<Review[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setAllReviews(stored);
  }, []);

  const reviews = productId
    ? allReviews.filter((r) => r.product_id === productId && r.is_approved)
    : allReviews;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const addReview = useCallback((review: Omit<Review, "id" | "created_at" | "is_approved">) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      is_approved: true, // Auto-approve for demo
      created_at: new Date().toISOString(),
    };
    setAllReviews((prev) => {
      const updated = [newReview, ...prev];
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
    return newReview;
  }, []);

  const getProductStats = useCallback((pid: string) => {
    const pReviews = allReviews.filter((r) => r.product_id === pid && r.is_approved);
    const avg = pReviews.length > 0
      ? pReviews.reduce((sum, r) => sum + r.rating, 0) / pReviews.length
      : 0;
    return { count: pReviews.length, average: Math.round(avg * 10) / 10 };
  }, [allReviews]);

  return { reviews, allReviews, averageRating, addReview, getProductStats };
}
