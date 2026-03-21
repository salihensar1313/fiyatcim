"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16 text-center font-sans">
        <div className="text-6xl">🔧</div>
        <h1 className="mt-4 text-2xl font-bold text-gray-800">
          Bir Sorun Oluştu
        </h1>
        <p className="mt-2 max-w-md text-gray-500">
          Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">Hata: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Tekrar Dene
        </button>
      </body>
    </html>
  );
}
