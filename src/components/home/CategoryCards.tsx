import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getCategories } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function CategoryCards() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const cats = await getCategories(client);

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="text-center">
          <h2 className="section-title">Urun Kategorileri</h2>
          <p className="section-subtitle">Ihtiyaciniza uygun elektronik urunleri kesfedin</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 shadow-sm transition-shadow hover:shadow-lg dark:border-dark-700 dark:bg-dark-800"
            >
              <div className="aspect-[4/3] overflow-hidden bg-dark-50 dark:bg-dark-700">
                {cat.image_url?.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={cat.image_url || "/images/categories/alarm.png"}
                    alt={cat.name}
                    width={400}
                    height={300}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50 sm:text-base dark:text-dark-50">{cat.name}</h3>
                <ChevronRight size={18} className="text-primary-600 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
