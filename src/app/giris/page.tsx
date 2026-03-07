"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Breadcrumb from "@/components/ui/Breadcrumb";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/hesabim");
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
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifreniz"
                  required
                  className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 pr-10 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              <LogIn size={18} />
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500 dark:text-dark-400">
              Hesabınız yok mu?{" "}
              <Link href="/kayit" className="font-semibold text-primary-600 hover:text-primary-700">
                Kayıt Ol
              </Link>
            </p>
          </div>

          {/* Demo bilgisi — sadece demo modda göster */}
          {IS_DEMO && (
            <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 p-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Demo Giriş Bilgileri:</p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">Admin: admin@fiyatcim.com / admin123</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Kullanıcı: Herhangi bir e-posta / 6+ karakter şifre</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
