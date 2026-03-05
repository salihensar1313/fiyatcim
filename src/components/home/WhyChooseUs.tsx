"use client";

import { useState, useEffect } from "react";
import { Shield, Wrench, Award, Star, Heart, Zap, Truck, Clock } from "lucide-react";
import { safeGetJSON } from "@/lib/safe-storage";

interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

const STORAGE_KEY = "fiyatcim_homepage_sections";

const ICON_MAP: Record<string, React.ElementType> = {
  Shield, Wrench, Award, Star, Heart, Zap, Truck, Clock,
};

const defaultFeatures: FeatureItem[] = [
  { id: "wcu-1", title: "Guvenilir Marka", desc: "Ajax, Hikvision, Dahua gibi dunya lideri markalarla calisiyor, yalnizca orijinal ve garantili urunler sunuyoruz.", icon: "Shield" },
  { id: "wcu-2", title: "Profesyonel Destek", desc: "Deneyimli teknik ekibimiz ile ucretsiz kesif, profesyonel kurulum ve satis sonrasi destek hizmeti veriyoruz.", icon: "Wrench" },
  { id: "wcu-3", title: "Kaliteli Urunler", desc: "Tum urunlerimiz minimum 2 yil uretici garantisi ile gelir. Sertifikali uzman ekibimiz her zaman yaninizda.", icon: "Award" },
];

export default function WhyChooseUs() {
  const [features, setFeatures] = useState<FeatureItem[]>(defaultFeatures);

  useEffect(() => {
    const stored = safeGetJSON<{ whyChooseUs?: FeatureItem[] }>(STORAGE_KEY, {});
    if (stored && typeof stored === "object" && "whyChooseUs" in stored) {
      const items = stored.whyChooseUs;
      if (Array.isArray(items) && items.length > 0) {
        setFeatures(items);
      }
    }
  }, []);

  return (
    <section className="bg-dark-50 py-12 sm:py-16">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="section-title">Neden Fiyatcim?</h2>
          <p className="section-subtitle">Guvenliginiz bizim onceligimiz</p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {features.map((f) => {
            const IconComp = ICON_MAP[f.icon] || Shield;
            return (
              <div
                key={f.id}
                className="flex gap-4 rounded-xl border border-dark-100 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <IconComp size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-dark-900">{f.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-dark-500">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
