"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { safeGetJSON } from "@/lib/safe-storage";

const STORAGE_KEY = "fiyatcim_homepage_sections";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState("Fırsatlardan Haberdar Olun");
  const [subtitle, setSubtitle] = useState("Özel indirimler, yeni ürünler ve kampanya bilgilerini e-posta ile alın.");

  useEffect(() => {
    const stored = safeGetJSON<{ newsletter?: { title?: string; subtitle?: string } }>(STORAGE_KEY, {});
    if (stored && typeof stored === "object" && "newsletter" in stored) {
      const nl = stored.newsletter;
      if (nl?.title) setTitle(nl.title);
      if (nl?.subtitle) setSubtitle(nl.subtitle);
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Kayıt başarısız.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-dark-900 py-12 sm:py-16">
      <div className="container-custom">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20">
            <Mail size={24} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-sm text-dark-500">
            {subtitle}
          </p>

          {submitted ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-green-900/30 p-4">
              <CheckCircle size={20} className="text-green-400" />
              <p className="text-sm font-medium text-green-400">
                Başarıyla kaydoldunuz! İndirimlerden ilk siz haberdar olacaksınız.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                required
                className="w-full rounded-lg bg-dark-800 px-4 py-3 text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:max-w-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : "Abone Ol"}
                {!loading && <ArrowRight size={16} />}
              </button>
              {error && <p className="text-xs text-red-400 sm:hidden">{error}</p>}
            </form>
          )}

          <p className="mt-3 text-xs text-dark-500 dark:text-dark-400">
            İstediğiniz zaman abonelikten çıkabilirsiniz.
          </p>
        </div>
      </div>
    </section>
  );
}
