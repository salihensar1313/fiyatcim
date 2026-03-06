"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import Link from "next/link";

const PRANK_DEADLINE = new Date("2026-03-06T10:00:00Z"); // 13:00 TR

export default function AraPage() {
  const router = useRouter();

  // Süre dolduysa ana sayfaya yönlendir
  useEffect(() => {
    if (new Date() > PRANK_DEADLINE) {
      router.replace("/");
    }
  }, [router]);

  // Süre dolmuşsa boş render
  if (typeof window !== "undefined" && new Date() > PRANK_DEADLINE) {
    return null;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Animasyonlu telefon ikonu */}
        <div className="mx-auto mb-6 flex h-24 w-24 animate-pulse items-center justify-center rounded-full bg-red-100">
          <PhoneOff size={48} className="text-red-500" />
        </div>

        {/* Mesaj */}
        <h1 className="text-2xl font-extrabold text-dark-900 sm:text-3xl">
          Aradığınız Kişi Şu Anda İçiyor
        </h1>
        <p className="mt-3 text-lg text-dark-500">
          Lütfen daha sonra tekrar deneyiniz.
        </p>

        {/* Sahte durum bilgisi */}
        <div className="mt-8 rounded-xl border border-dark-100 bg-dark-50 p-5">
          <div className="flex items-center justify-center gap-2 text-sm text-dark-600">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            Durum: <span className="font-bold text-red-600">Meşgul — İçiyor</span>
          </div>
          <p className="mt-2 text-xs text-dark-400">
            Tahmini müsait olma süresi: Belli değil ☕
          </p>
        </div>

        {/* Geri dön butonu */}
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-700"
        >
          <Phone size={16} />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}
