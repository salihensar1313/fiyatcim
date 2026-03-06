"use client";

import { useState, useEffect } from "react";
import { getRelatedProducts } from "@/lib/queries";
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface RelatedProductsProps {
  productId: string;
  categoryId: string;
}

export default function RelatedProducts({ productId, categoryId }: RelatedProductsProps) {
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    getRelatedProducts(productId, categoryId, 4)
      .then(setRelated)
      .catch((err) => console.error("getRelatedProducts failed:", err));
  }, [productId, categoryId]);

  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">Benzer Ürünler</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
