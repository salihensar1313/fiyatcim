"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Shield, Camera, Wifi, Fingerprint, DoorOpen, Flame } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { useProducts } from "@/context/ProductContext";
import type { Category } from "@/types";

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  "alarm-sistemleri": Shield,
  "guvenlik-kameralari": Camera,
  "akilli-ev-sistemleri": Wifi,
  "akilli-kilit": Fingerprint,
  "gecis-kontrol-sistemleri": DoorOpen,
  "yangin-algilama": Flame,
};

const CATEGORY_COLORS: Record<string, string> = {
  "alarm-sistemleri": "from-red-500 to-red-700",
  "guvenlik-kameralari": "from-blue-500 to-blue-700",
  "akilli-ev-sistemleri": "from-purple-500 to-purple-700",
  "akilli-kilit": "from-orange-500 to-orange-700",
  "gecis-kontrol-sistemleri": "from-teal-500 to-teal-700",
  "yangin-algilama": "from-yellow-500 to-yellow-700",
};

export default function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { products } = useProducts();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="bg-dark-50 py-10 dark:bg-dark-900 sm:py-14">
      <div className="container-custom">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50 sm:text-2xl">
            Kategorilere Göz Atın
          </h2>
          <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
            İhtiyacınıza uygun güvenlik çözümünü keşfedin
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] || Shield;
            const gradient = CATEGORY_COLORS[cat.slug] || "from-dark-600 to-dark-800";
            const count = products.filter((p) => p.category_id === cat.id && !p.deleted_at).length;

            return (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-5 text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />
                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-sm font-bold leading-tight">{cat.name}</h3>
                  <p className="mt-1 text-xs text-white/70">{count} ürün</p>
                  <div className="mt-3 flex items-center text-xs font-medium text-white/80 transition-colors group-hover:text-white">
                    Keşfet <ChevronRight size={14} className="ml-0.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
