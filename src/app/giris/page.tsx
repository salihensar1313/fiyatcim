"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/Breadcrumb";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const LOCKOUT_DURATION = 60_000; // 1 dakika
const MAX_ATTEMPTS = 4;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/hesabim";
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/hesabim";
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const authError = searchParams.get("error");
  const [error, setError] = useState(authError === "auth" ? "Google ile giriş yapılamadı. Lütfen tekrar deneyin." : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setCountdown(0);
        setError("");
      } else {
        setCountdown(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check lockout
    if (lockedUntil && Date.now() < lockedUntil) {
      return;
    }

    setError("");
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(until);
        setError(`Çok fazla hatalı deneme. Lütfen ${Math.ceil(LOCKOUT_DURATION / 1000)} saniye bekleyin.`);
      } else {
        setError(`${result.error} (${MAX_ATTEMPTS - newAttempts} deneme hakkınız kaldı)`);
      }
      setLoading(false);
    } else {
      setFailedAttempts(0);
      setLockedUntil(null);
      const sep = redirectTo.includes("?") ? "&" : "?";
      router.push(`${redirectTo}${sep}login=success`);
    }
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Giriş Yap" }]} />
      </div>

      <div className="container mx-auto flex justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Giriş Yap</h1>
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">Hesabınıza giriş yaparak devam edin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta</label>
              <input
                type="email"
                name="email"
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifreniz"
                  required
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link href="/sifremi-unuttum" className="text-xs text-primary-600 hover:underline">
                  Şifremi Unuttum
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">
                {error}
                {countdown > 0 && (
                  <span className="ml-1 font-bold">({countdown}s)</span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (lockedUntil !== null && Date.now() < lockedUntil)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <LogIn size={18} />
              {lockedUntil && countdown > 0 ? `Bekleyin (${countdown}s)` : loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-200 dark:border-dark-600" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-dark-500 dark:bg-dark-800 dark:text-dark-400">veya</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={async () => {
              setGoogleLoading(true);
              setError("");
              const result = await signInWithGoogle();
              if (result.error) {
                setError(result.error);
                setGoogleLoading(false);
              } else if (IS_DEMO) {
                // Demo mode: signInWithGoogle resolves immediately, redirect manually
                router.push(redirectTo);
              }
              // Non-demo: Supabase will redirect to Google OAuth automatically
            }}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-200 bg-white px-4 py-3 text-sm font-semibold text-dark-700 transition-all hover:border-dark-300 hover:bg-dark-50 hover:shadow-sm disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200 dark:hover:bg-dark-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Yönlendiriliyor..." : "Google ile Giriş Yap"}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="font-semibold text-primary-600 hover:text-primary-700">
                Kayıt Ol
              </Link>
            </p>
          </div>

          {/* Demo bilgisi — sadece development ortamında göster */}
          {IS_DEMO && process.env.NODE_ENV === "development" && (
            <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Demo Modu Aktif</p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Herhangi bir e-posta ve 6+ karakter şifre ile giriş yapabilirsiniz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
