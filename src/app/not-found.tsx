import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sayfa Bulunamadı | Fiyatcim",
  description: "Aradığınız sayfa bulunamadı. Ana sayfaya dönün veya ürünlerimize göz atın.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-8xl font-black text-primary-600">404</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        Sayfa Bulunamadı
      </h1>
      <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
        Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          Ana Sayfa
        </Link>
        <Link
          href="/urunler"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
        >
          Ürünlere Göz At
        </Link>
      </div>
    </div>
  );
}
