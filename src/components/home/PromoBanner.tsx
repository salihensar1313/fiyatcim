"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { safeGetJSON } from "@/lib/safe-storage";

interface PromoBannerData {
  title: string;
  description: string;
  link: string;
  active: boolean;
}

const STORAGE_KEY = "fiyatcim_promo_banner";

const defaultBanner: PromoBannerData = {
  title: "Yeni Sezon İndirimleri!",
  description: "Güvenlik kamera setlerinde %30'a varan indirimler.",
  link: "/urunler?sale=true",
  active: true,
};

export default function PromoBanner() {
  const [banner, setBanner] = useState<PromoBannerData>(defaultBanner);

  useEffect(() => {
    const stored = safeGetJSON<PromoBannerData>(STORAGE_KEY, defaultBanner);
    if (typeof stored === "object" && stored !== null && "title" in stored) {
      setBanner({ ...defaultBanner, ...stored });
    }
  }, []);

  if (!banner.active) return null;

  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-700 py-4">
      <div className="container-custom">
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-white">
            <Zap size={20} className="shrink-0" />
            <p className="text-sm font-medium sm:text-base">
              <span className="font-bold">{banner.title}</span>{" "}
              {banner.description}
            </p>
          </div>
          <Link
            href={banner.link}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-white dark:bg-dark-800 px-5 py-2 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50"
          >
            İncele
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
