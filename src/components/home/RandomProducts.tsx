import Link from "next/link";
import { Shuffle, ArrowRight } from "lucide-react";
import { getRandomProducts } from "@/lib/queries";
import ProductCard from "@/components/product/ProductCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default async function RandomProducts() {
  const client = IS_DEMO ? undefined : await createServerSupabaseClient();
  const products = await getRandomProducts(12, client);

  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-custom">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shuffle size={20} className="text-primary-600" />
              <h2 className="section-title">Keşfet</h2>
            </div>
            <p className="section-subtitle">Her ziyarette farklı ürünler sizi bekliyor</p>
          </div>
          <Link
            href="/urunler"
            className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
          >
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/urunler"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600"
          >
            Tümünü Gör
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
