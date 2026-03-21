"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-6xl">😔</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        Bir Sorun Oluştu
      </h1>
      <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
        Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-gray-400">Hata Kodu: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Tekrar Dene
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
        >
          Ana Sayfa
        </a>
      </div>
    </div>
  );
}
