"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowLeft, GitCompareArrows } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useCompare } from "@/hooks/useCompare";

import { CATEGORY_IMAGES } from "@/lib/constants";
import Rating from "@/components/ui/Rating";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PriceDisplay from "@/components/ui/PriceDisplay";

export default function ComparePage() {
  const { products } = useProducts();
  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const compareProducts = useMemo(() => {
    return compareIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is (typeof products)[0] => !!p);
  }, [compareIds, products]);

  // Collect all spec keys from all products
  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    compareProducts.forEach((p) => {
      Object.keys(p.specs).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [compareProducts]);

  if (compareProducts.length === 0) {
    return (
      <div className="bg-dark-50 dark:bg-dark-900 pb-16">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: "Ürün Karşılaştırma" }]} />
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <GitCompareArrows size={64} className="mb-4 text-dark-200" />
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Karşılaştırma Listeniz Boş</h1>
          <p className="mt-2 text-dark-500 dark:text-dark-400">Karşılaştırmak istediğiniz ürünleri ürün kartlarından ekleyin.</p>
          <Link
            href="/urunler"
            className="mt-6 flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <ArrowLeft size={16} />
            Ürünlere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Ürün Karşılaştırma" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50">Ürün Karşılaştırma</h1>
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">{compareProducts.length} ürün karşılaştırılıyor</p>
          </div>
          <button
            onClick={clearCompare}
            className="rounded-lg border border-dark-200 px-4 py-2 text-sm font-medium text-dark-600 dark:text-dark-300 hover:bg-dark-100"
          >
            Listeyi Temizle
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800">
          <table className="w-full min-w-[600px]">
            {/* Product Images & Names */}
            <thead>
              <tr className="border-b border-dark-100">
                <th className="w-40 bg-dark-50 px-4 py-3 text-left text-xs font-semibold text-dark-500 dark:text-dark-400">Ürün</th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-24 w-24">
                        <Image
                          src={CATEGORY_IMAGES[product.category_id] || "/images/categories/alarm.png"}
                          alt={product.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Link
                        href={`/urunler/${product.slug}`}
                        className="text-sm font-medium text-dark-900 dark:text-dark-50 hover:text-primary-600"
                      >
                        {product.name}
                      </Link>
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="text-dark-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Price */}
              <tr className="border-b border-dark-50">
                <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">Fiyat</td>
                {compareProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <PriceDisplay
                      priceUsd={p.price_usd}
                      salePriceUsd={p.sale_price_usd}
                      priceTry={p.price}
                      salePriceTry={p.sale_price}
                      size="md"
                    />
                  </td>
                ))}
              </tr>
              {/* Rating */}
              <tr className="border-b border-dark-50">
                <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">Puan</td>
                {compareProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <Rating rating={4.5} size="sm" />
                    </div>
                  </td>
                ))}
              </tr>
              {/* Stock */}
              <tr className="border-b border-dark-50">
                <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">Stok</td>
                {compareProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${p.stock === 0 ? "text-red-600" : p.stock <= p.critical_stock ? "text-orange-600" : "text-green-600"}`}>
                      {p.stock === 0 ? "Tükendi" : `${p.stock} adet`}
                    </span>
                  </td>
                ))}
              </tr>
              {/* Garanti */}
              <tr className="border-b border-dark-50">
                <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">Garanti</td>
                {compareProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center text-sm text-dark-700 dark:text-dark-200">
                    {p.warranty_months} Ay
                  </td>
                ))}
              </tr>
              {/* Kargo */}
              <tr className="border-b border-dark-50">
                <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">Kargo</td>
                {compareProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center text-sm text-dark-700 dark:text-dark-200">
                    {p.shipping_type === "kurulum" ? "Ücretsiz Kurulum" : "Kargo"}
                  </td>
                ))}
              </tr>
              {/* Dynamic Specs */}
              {allSpecKeys.map((key) => (
                <tr key={key} className="border-b border-dark-50">
                  <td className="bg-dark-50 px-4 py-3 text-xs font-semibold text-dark-500 dark:text-dark-400">{key}</td>
                  {compareProducts.map((p) => (
                    <td key={p.id} className="px-4 py-3 text-center text-sm text-dark-700 dark:text-dark-200">
                      {p.specs[key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
