"use client";

import { useState, useEffect, useCallback } from "react";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import type { Question } from "@/types";

const STORAGE_KEY = "fiyatcim_questions";

export function useProductQA(productId?: string) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const stored = safeGetJSON<Question[]>(STORAGE_KEY, []);
    if (Array.isArray(stored)) setAllQuestions(stored);
  }, []);

  const questions = productId
    ? allQuestions.filter((q) => q.product_id === productId)
    : allQuestions;

  const addQuestion = useCallback(
    (data: { product_id: string; user_id: string; question: string; profile?: Question["profile"] }) => {
      const newQuestion: Question = {
        id: `qa-${Date.now()}`,
        product_id: data.product_id,
        user_id: data.user_id,
        question: data.question,
        answer: null,
        answered_by: null,
        created_at: new Date().toISOString(),
        answered_at: null,
        profile: data.profile,
      };
      setAllQuestions((prev) => {
        const updated = [newQuestion, ...prev];
        safeSetJSON(STORAGE_KEY, updated);
        return updated;
      });
      return newQuestion;
    },
    []
  );

  const answerQuestion = useCallback(
    (questionId: string, answer: string, answeredBy: string) => {
      setAllQuestions((prev) => {
        const updated = prev.map((q) =>
          q.id === questionId
            ? { ...q, answer, answered_by: answeredBy, answered_at: new Date().toISOString() }
            : q
        );
        safeSetJSON(STORAGE_KEY, updated);
        return updated;
      });
    },
    []
  );

  const getProductQACount = useCallback(
    (pid: string) => allQuestions.filter((q) => q.product_id === pid).length,
    [allQuestions]
  );

  return { questions, allQuestions, addQuestion, answerQuestion, getProductQACount };
}
