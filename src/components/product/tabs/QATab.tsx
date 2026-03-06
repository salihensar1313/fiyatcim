"use client";

import { useState } from "react";
import { Send, MessageCircle, Store, HelpCircle } from "lucide-react";
import type { Product } from "@/types";
import { useProductQA } from "@/hooks/useProductQA";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface QATabProps {
  product: Product;
}

export default function QATab({ product }: QATabProps) {
  const { questions, addQuestion, answerQuestion } = useProductQA(product.id);
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState<Record<string, string>>({});

  const handleSubmitQuestion = () => {
    if (!user) {
      showToast("Soru sormak için giriş yapmalısınız", "error");
      return;
    }
    if (!questionText.trim()) {
      showToast("Lütfen bir soru yazın", "error");
      return;
    }
    addQuestion({
      product_id: product.id,
      user_id: user.id,
      question: questionText.trim(),
      profile: profile || undefined,
    });
    setQuestionText("");
    showToast("Sorunuz gönderildi!", "success");
  };

  const handleAnswerQuestion = (questionId: string) => {
    const answer = answerText[questionId]?.trim();
    if (!answer) return;
    answerQuestion(questionId, answer, "admin");
    setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
    showToast("Cevap eklendi!", "success");
  };

  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Ask Question Form */}
      <div className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
        <h4 className="mb-1 text-base font-bold text-dark-900 dark:text-dark-50">Ürün Hakkında Soru Sor</h4>
        <p className="mb-4 text-xs text-dark-400">
          Satıcıya veya diğer kullanıcılara bu ürün hakkında soru sorabilirsiniz.
        </p>

        {!user && (
          <div className="mb-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            Soru sormak için giriş yapmalısınız.
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={user ? "Sorunuzu yazın..." : "Giriş yapmalısınız"}
            disabled={!user}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitQuestion();
              }
            }}
            className="flex-1 rounded-lg border border-dark-200 px-4 py-3 text-sm transition-colors focus:border-primary-600 focus:outline-none disabled:cursor-not-allowed disabled:bg-dark-50"
          />
          <button
            onClick={handleSubmitQuestion}
            disabled={!user || !questionText.trim()}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Gönder</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-base font-bold text-dark-900 dark:text-dark-50">
            Sorular ({questions.length})
          </h4>

          {questions.map((q) => (
            <div key={q.id} className="overflow-hidden rounded-xl border border-dark-100">
              {/* Question */}
              <div className="bg-white dark:bg-dark-800 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <HelpCircle size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dark-900 dark:text-dark-50">
                        {q.profile?.ad || "Anonim"} {q.profile?.soyad?.charAt(0) || ""}.
                      </span>
                      <span className="text-xs text-dark-400">{formatDate(q.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-dark-700 dark:text-dark-200">{q.question}</p>
                  </div>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="border-t border-dark-100 bg-dark-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Store size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          Satıcı
                        </span>
                        {q.answered_at && (
                          <span className="text-xs text-dark-400">{formatDate(q.answered_at)}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">{q.answer}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-dark-100 bg-dark-50 p-4">
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={answerText[q.id] || ""}
                        onChange={(e) =>
                          setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Cevabınızı yazın..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAnswerQuestion(q.id);
                          }
                        }}
                        className="flex-1 rounded-lg border border-dark-200 px-3 py-2 text-sm focus:border-primary-600 focus:outline-none"
                      />
                      <button
                        onClick={() => handleAnswerQuestion(q.id)}
                        disabled={!answerText[q.id]?.trim()}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                      >
                        Cevapla
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-xs text-dark-400">
                      Henüz cevaplanmadı. Satıcı en kısa sürede cevap verecektir.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <MessageCircle size={48} className="mx-auto mb-3 text-dark-200" />
          <p className="text-dark-500 dark:text-dark-400">Henüz soru sorulmamış.</p>
          <p className="mt-1 text-sm text-dark-400">
            Bu ürün hakkında merak ettiklerinizi sorun!
          </p>
        </div>
      )}
    </div>
  );
}
