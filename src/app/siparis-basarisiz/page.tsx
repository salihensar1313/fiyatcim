import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ödeme Başarısız",
  robots: { index: false, follow: false },
};
import { XCircle, RefreshCw, ArrowRight } from "lucide-react";

export default function OrderFailedPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <XCircle size={40} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ödeme Başarısız</h1>
          <p className="mt-2 text-dark-600 dark:text-dark-300">
            Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/odeme"
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              <RefreshCw size={16} />
              Tekrar Dene
            </Link>
            <Link
              href="/sepet"
              className="flex items-center justify-center gap-2 rounded-lg border border-dark-200 px-6 py-3 text-sm font-semibold text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:bg-dark-800"
            >
              Sepete Dön
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
