"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProductBySlug } from "@/lib/queries";
import { useProducts } from "@/context/ProductContext";
import type { Product } from "@/types";
import PriceHistoryChart from "@/components/product/PriceHistoryChart";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_IMAGES } from "@/lib/constants";

export default function PriceHistoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { products } = useProducts();

  useEffect(() => {
    if (!slug) return;
    getProductBySlug(slug)
      .then(setProduct)
      .catch((err) => console.error("getProductBySlug failed:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Related products in same category (for internal linking)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (p) =>
          p.id !== product.id &&
          p.category_id === product.category_id &&
          p.is_active &&
          !p.deleted_at
      )
      .slice(0, 4);
  }, [products, product]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ürün Bulunamadı</h1>
        <p className="mt-2 text-dark-500 dark:text-dark-400">
          Aradığınız ürünün fiyat geçmişi mevcut değil.
        </p>
        <Link
          href="/urunler"
          className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Ürünlere Dön
        </Link>
      </div>
    );
  }

  const currentPrice = product.sale_price || product.price;
  const productImage = CATEGORY_IMAGES[product.category_id] || "/images/categories/alarm.png";

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      {/* SEO Meta */}
      <title>{`${product.name} Fiyat Geçmişi — Fiyatcim.com`}</title>
      <meta
        name="description"
        content={`${product.name} fiyat geçmişi, fiyat trendi ve en düşük/en yüksek fiyat bilgisi. Fiyatcim.com'da fiyat takibi yapın.`}
      />

      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: "Fiyat Geçmişi" },
            { label: product.name },
          ]}
        />
      </div>

      <div className="container mx-auto px-4">
        {/* Product Summary Card */}
        <div className="mb-8 rounded-xl border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Product Image */}
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-dark-50 dark:bg-dark-800">
              <Image
                src={productImage}
                alt={product.name}
                fill
                className="object-contain p-2"
                sizes="128px"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1">
              {product.brand && (
                <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
                  {product.brand.name}
                </span>
              )}
              <h1 className="mt-1 text-xl font-bold text-dark-900 dark:text-dark-50 sm:text-2xl">
                {product.name} — Fiyat Geçmişi
              </h1>
              <div className="mt-2 flex items-center gap-4">
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(currentPrice)}
                </span>
                {product.sale_price && product.sale_price < product.price && (
                  <span className="text-sm text-dark-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <Link
                href={`/urunler/${product.slug}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Bu Ürünü İncele
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Price History Chart (full size) */}
        <div className="rounded-xl border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 p-6">
          <PriceHistoryChart productId={product.id} currentPrice={currentPrice} />
        </div>

        {/* Related Products Price History (Internal Linking) */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-dark-800 dark:text-dark-100">
              Benzer Ürünlerin Fiyat Geçmişi
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/fiyat-gecmisi/${rp.slug}`}
                  className="group rounded-lg border border-dark-200 bg-white dark:border-dark-600 dark:bg-dark-800 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded bg-dark-50 dark:bg-dark-800">
                    <Image
                      src={CATEGORY_IMAGES[rp.category_id] || "/images/categories/alarm.png"}
                      alt={rp.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>
                  <p className="line-clamp-2 text-xs font-medium text-dark-700 dark:text-dark-200 group-hover:text-primary-600">
                    {rp.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-primary-600">
                    {formatPrice(rp.sale_price || rp.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href={`/urunler/${product.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={16} />
            Ürün Detayına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
