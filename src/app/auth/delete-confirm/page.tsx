"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function DeleteConfirmContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "confirming" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Token yoksa hata
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Geçersiz bağlantı. Lütfen e-postanızdaki bağlantıyı tekrar deneyin.");
    }
  }, [token]);

  const handleConfirm = async () => {
    if (!token || confirmed) return;

    setStatus("confirming");
    try {
      const res = await fetch("/api/auth/confirm-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("success");
        setConfirmed(true);
        // 5 saniye sonra ana sayfaya yönlendir
        setTimeout(() => router.push("/"), 5000);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "İşlem başarısız.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="min-h-[60vh] bg-dark-50 dark:bg-dark-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8 text-center">
        {/* IDLE — Onay bekleniyor */}
        {status === "idle" && token && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-2">
              Hesap Silme Onayı
            </h1>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6 leading-relaxed">
              Bu işlem <strong className="text-red-600">geri alınamaz</strong>. Hesabınız ve tüm verileriniz
              (siparişler, favoriler, adresler) kalıcı olarak silinecektir.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                className="w-full rounded-lg bg-red-600 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Evet, Hesabımı Kalıcı Olarak Sil
              </button>
              <Link
                href="/hesabim"
                className="block w-full rounded-lg border border-dark-200 dark:border-dark-600 py-3 text-sm font-medium text-dark-700 dark:text-dark-200 transition-colors hover:bg-dark-50 dark:hover:bg-dark-700"
              >
                Vazgeç, Hesabıma Dön
              </Link>
            </div>
          </>
        )}

        {/* CONFIRMING — İşleniyor */}
        {status === "confirming" && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-red-600" />
            <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-2">
              Hesabınız Siliniyor...
            </h1>
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Lütfen bekleyin, bu işlem birkaç saniye sürebilir.
            </p>
          </>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-2">
              Hesabınız Silindi
            </h1>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              Hesabınız ve tüm verileriniz başarıyla silindi. 5 saniye içinde ana sayfaya yönlendirileceksiniz.
            </p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
            >
              Ana Sayfaya Git
            </Link>
          </>
        )}

        {/* ERROR */}
        {status === "error" && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50 mb-2">
              İşlem Başarısız
            </h1>
            <p className="text-sm text-dark-500 dark:text-dark-400 mb-6">
              {errorMsg}
            </p>
            <Link
              href="/hesabim"
              className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
            >
              Hesabıma Dön
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function DeleteConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    }>
      <DeleteConfirmContent />
    </Suspense>
  );
}
