"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link: string;
}

interface BannerSlotProps {
  name: string;
}

/**
 * BannerSlot — DB-backed konfigüre edilebilir banner alanı.
 * Admin'den banner eklenerek homepage/category sayfalarında gösterilebilir.
 * Aktif ve tarih aralığındaki bannerları render eder.
 */
export default function BannerSlot({ name }: BannerSlotProps) {
  const [banner, setBanner] = useState<Banner | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const now = new Date().toISOString();

    supabase
      .from("banner_slots")
      .select("id, title, description, image_url, link")
      .eq("slot_name", name)
      .eq("is_active", true)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .lte("start_date", now)
      .order("position", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBanner(data[0] as Banner);
        }
      });
  }, [name]);

  if (!banner || !banner.image_url) return null;

  const content = (
    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-xl">
      <Image
        src={banner.image_url}
        alt={banner.title || "Kampanya"}
        width={1400}
        height={200}
        className="w-full object-cover"
        unoptimized
      />
      {(banner.title || banner.description) && (
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-dark-900/70 to-transparent p-6 sm:p-8">
          <div className="max-w-md text-white">
            {banner.title && <h3 className="text-lg font-bold sm:text-xl">{banner.title}</h3>}
            {banner.description && <p className="mt-1 text-sm opacity-90">{banner.description}</p>}
          </div>
        </div>
      )}
    </div>
  );

  if (banner.link) {
    return (
      <section className="py-4 px-4">
        <Link href={banner.link}>{content}</Link>
      </section>
    );
  }

  return <section className="py-4 px-4">{content}</section>;
}
