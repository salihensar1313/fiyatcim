"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/context/ProductContext";
import ProductCard from "@/components/product/ProductCard";

export default function WishlistPage() {
  const { products } = useProducts();
  const { items: wishlistIds } = useWishlist();
  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">
        Favorilerim
        {wishlistProducts.length > 0 && (
          <span className="ml-2 text-lg font-normal text-dark-400">
            ({wishlistProducts.length})
          </span>
        )}
      </h1>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 py-20">
          <Heart size={56} className="mb-4 text-dark-200" />
          <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Favori Listeniz Boş</h2>
          <p className="mt-2 text-sm text-dark-500 dark:text-dark-400">
            Beğendiğiniz ürünleri favorilere ekleyerek takip edebilirsiniz.
          </p>
          <Link
            href="/urunler"
            className="mt-4 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Ürünleri İncele
          </Link>
        </div>
      )}
    </div>
  );
}
