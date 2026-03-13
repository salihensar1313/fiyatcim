"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { createClient } from "@/lib/supabase/client";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (IS_DEMO) {
      // Demo mode: simulate
      setTimeout(() => {
        setLoading(false);
        setSent(true);
      }, 1000);
      return;
    }

    // Real Supabase password reset
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      // Don't reveal if email exists or not
      setSent(true);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Giriş Yap", href: "/giris" }, { label: "Şifremi Unuttum" }]} />
      </div>

      <div className="container mx-auto flex justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50">E-posta Gönderildi</h1>
              <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
                <span className="font-medium text-dark-700 dark:text-dark-200">{email}</span> adresine
                şifre sıfırlama bağlantısı gönderildi.
              </p>
              <p className="mt-1 text-xs text-dark-500">
                E-postanızı kontrol edin. Spam klasörüne de bakın.
              </p>
              <Link
                href="/giris"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
              >
                <ArrowLeft size={16} />
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <Mail size={28} className="text-primary-600" />
                </div>
                <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50">Şifremi Unuttum</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                  Kayıtlı e-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    E-posta Adresi
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  <Mail size={18} />
                  {loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/giris"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                >
                  <ArrowLeft size={14} />
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
