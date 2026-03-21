import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// Curated category images — slug bazlı öncelikli görseller
const CURATED_CATEGORY_IMAGES: Record<string, string> = {
  "alarm-sistemleri": "/images/categories/alarm-sistemleri.svg",
  "guvenlik-kameralari": "/images/categories/guvenlik-kameralari.svg",
  "akilli-ev-sistemleri": "/images/categories/akilli-ev-sistemleri.svg",
  "akilli-kilit": "/images/categories/akilli-kilit.svg",
  "gecis-kontrol-sistemleri": "/images/categories/gecis-kontrol-sistemleri.svg",
  "yangin-algilama": "/images/categories/yangin-algilama.svg",
};

// Eski PNG fallback (curated bulunamazsa)
const LEGACY_FALLBACK_IMAGES: Record<string, string> = {
  "alarm-sistemleri": "/images/categories/alarm.png",
  "guvenlik-kameralari": "/images/categories/kamera.png",
  "akilli-ev-sistemleri": "/images/categories/akilli-ev.png",
  "akilli-kilit": "/images/categories/gecis-kontrol.png",
  "gecis-kontrol-sistemleri": "/images/categories/gecis-kontrol.png",
  "yangin-algilama": "/images/categories/alarm.png",
};

function getCategoryImage(slug: string, dbImageUrl?: string): string {
  // 1. Curated SVG öncelikli
  if (CURATED_CATEGORY_IMAGES[slug]) {
    return CURATED_CATEGORY_IMAGES[slug];
  }
  // 2. DB'deki image_url (geçerli ve benzersiz ise)
  if (dbImageUrl && !dbImageUrl.startsWith("data:") && dbImageUrl.length > 5) {
    return dbImageUrl;
  }
  // 3. Eski PNG fallback
  return LEGACY_FALLBACK_IMAGES[slug] || "/images/categories/alarm.png";
}

export default async function CategoryCards() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const cats = await getCategories(client);

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="section-title">Ürün Kategorileri</h2>
          <p className="section-subtitle">İhtiyacınıza uygun güvenlik ürünlerini keşfedin</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {cats.map((cat) => {
            const imgSrc = getCategoryImage(cat.slug, cat.image_url);
            const isSvg = imgSrc.endsWith(".svg");

            return (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[4/3] overflow-hidden bg-dark-900">
                  {isSvg ? (
                    // SVG görseller — img tag ile, dark arka plan uyumlu
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgSrc}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <Image
                      src={imgSrc}
                      alt={cat.name}
                      width={400}
                      height={300}
                      unoptimized
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50 sm:text-base">{cat.name}</h3>
                    {cat.product_count != null && cat.product_count > 0 && (
                      <p className="text-[11px] text-dark-500">{cat.product_count} ürün</p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary-600 opacity-100 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                    İncele
                    <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
