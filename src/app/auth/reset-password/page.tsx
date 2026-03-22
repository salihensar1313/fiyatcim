"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle, Eye, EyeOff, ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/password";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [denied, setDenied] = useState(false);

  // Check for valid session (set by callback route after code exchange)
  useEffect(() => {
    const supabase = createClient();
    let recovered = false;

    // Listen for PASSWORD_RECOVERY event (hash fragment flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        recovered = true;
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (PKCE flow — callback already exchanged code)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !recovered) {
        recovered = true;
        setSessionReady(true);
      }
    };
    checkSession();

    // If no session or recovery event within 5 seconds, deny access
    const timeout = setTimeout(() => {
      if (!recovered) {
        setDenied(true);
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      setError(pwCheck.error!);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/giris"), 3000);
    }
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Giriş Yap", href: "/giris" }, { label: "Yeni Şifre Belirle" }]} />
      </div>

      <div className="container mx-auto flex justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          {denied ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
                <Lock size={32} className="text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50">Geçersiz Bağlantı</h1>
              <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
                Bu sayfaya yalnızca e-posta ile gönderilen şifre sıfırlama bağlantısı üzerinden erişebilirsiniz.
                Bağlantınızın süresi dolmuş veya geçersiz olabilir.
              </p>
              <Link
                href="/sifremi-unuttum"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
              >
                <Mail size={16} />
                Yeni Sıfırlama Bağlantısı Al
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50">Şifre Güncellendi</h1>
              <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
                Şifreniz başarıyla değiştirildi. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
              <Link
                href="/giris"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
              >
                <ArrowLeft size={16} />
                Giriş Sayfasına Git
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                  <Lock size={28} className="text-primary-600" />
                </div>
                <h1 className="text-xl font-bold text-dark-900 dark:text-dark-50">Yeni Şifre Belirle</h1>
                <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
                  Hesabınız için yeni bir şifre belirleyin.
                </p>
              </div>

              {!sessionReady && (
                <div className="mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                  Oturum doğrulanıyor, lütfen bekleyin...
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    Yeni Şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">
                    Yeni Şifre (Tekrar)
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">Şifreler eşleşmiyor.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !sessionReady || !password || password !== confirmPassword}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  <Lock size={18} />
                  {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
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
