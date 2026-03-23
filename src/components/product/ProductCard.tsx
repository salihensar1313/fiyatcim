"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, Plus, Minus, Trash2, GitCompareArrows, Zap } from "lucide-react";
import type { Product } from "@/types";
import { getDiscountPercent, getStockStatus } from "@/lib/utils";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Rating from "@/components/ui/Rating";
import { useToast } from "@/components/ui/Toast";
import { useCompare } from "@/hooks/useCompare";
import { useCountdown } from "@/hooks/useFlashSale";
import { getCategoryFallbackImage, getProductPrimaryImage, isRemoteImage } from "@/lib/product-images";
import PriceDropBadge from "./PriceDropBadge";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(() => getProductPrimaryImage(product));
  useEffect(() => { setImgSrc(getProductPrimaryImage(product)); }, [product.id, product.images, product.category_id, product.category?.slug]);
  const { addItem, items, updateQuantity, removeItem, isInCart } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const discount = getDiscountPercent(product.price_usd, product.sale_price_usd);
  const stock = getStockStatus(product.stock, product.critical_stock);
  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  const { toggleCompare, isInCompare, isFull } = useCompare();
  const inCompare = isInCompare(product.id);
  const flashSale = useCountdown(product.sale_ends_at);
  const cartItem = items.find((i) => i.product_id === product.id);
  const cartQty = cartItem?.qty || 0;

  return (
    <div className="card group relative flex flex-col overflow-hidden">
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            Tükendi
          </span>
        )}
        {product.stock > 0 && product.stock <= product.critical_stock && (
          <span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white animate-pulse">
            Son {product.stock} adet!
          </span>
        )}
        <PriceDropBadge productId={product.id} currentPrice={product.sale_price || product.price} />
        {flashSale.ready && !flashSale.isExpired && product.sale_ends_at && product.stock > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-1 text-xs font-bold text-white animate-pulse">
            <Zap size={12} />
            {String(flashSale.hours).padStart(2, "0")}:{String(flashSale.minutes).padStart(2, "0")}:{String(flashSale.seconds).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Action Buttons — min 44px touch target */}
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 sm:right-3 sm:top-3 sm:gap-1.5">
        <button
          onClick={() => {
            toggleItem(product.id);
            showToast(inWishlist ? "Favorilerden çıkarıldı" : "Favorilere eklendi", inWishlist ? "info" : "success");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all active:scale-95 sm:h-auto sm:w-auto sm:p-2 sm:hover:scale-110 dark:bg-dark-700"
          aria-label={inWishlist ? "Favorilerden çıkar" : "Favorilere ekle"}
        >
          <Heart
            size={18}
            className={inWishlist ? "fill-primary-600 text-primary-600" : "text-dark-500"}
          />
        </button>
        <button
          onClick={() => {
            if (!inCompare && isFull) {
              showToast("En fazla 4 ürün karşılaştırabilirsiniz", "error");
              return;
            }
            toggleCompare(product.id);
            showToast(inCompare ? "Karşılaştırmadan çıkarıldı" : "Karşılaştırmaya eklendi", inCompare ? "info" : "success");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all active:scale-95 sm:h-auto sm:w-auto sm:p-2 sm:hover:scale-110 dark:bg-dark-700"
          title="Karşılaştır"
          aria-label={inCompare ? "Karşılaştırmadan çıkar" : "Karşılaştırmaya ekle"}
        >
          <GitCompareArrows
            size={16}
            className={inCompare ? "text-blue-600" : "text-dark-500"}
          />
        </button>
      </div>

      {/* Product Image */}
      <Link href={`/urunler/${product.slug}`} className="relative aspect-square overflow-hidden !bg-white p-4">
        <Image
          src={imgSrc}
          alt={`${product.name} - ${product.brand?.name || "ürün"} | Fiyatcim.com`}
          width={300}
          height={300}
          unoptimized={isRemoteImage(imgSrc)}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgSrc(getCategoryFallbackImage(product.category_id, product.category?.slug))}
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand */}
        {product.brand?.name && (
          <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
            {product.brand.name}
          </span>
        )}

        {/* Name */}
        <Link
          href={`/urunler/${product.slug}`}
          className="mt-1 line-clamp-2 text-sm font-medium text-dark-900 dark:text-dark-50 transition-colors hover:text-primary-600"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1.5">
          {(() => {
            const approvedReviews = product.reviews?.filter((r: { is_approved?: boolean }) => r.is_approved !== false) || [];
            if (approvedReviews.length > 0) {
              const avg = approvedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / approvedReviews.length;
              return (
                <>
                  <Rating rating={avg} size="sm" />
                  <span className="text-xs text-dark-500">({approvedReviews.length})</span>
                </>
              );
            }
            return (
              <Link href={`/urunler/${product.slug}#degerlendirmeler`} className="text-xs text-primary-500 hover:text-primary-600 hover:underline">
                İlk değerlendirmeyi yaz
              </Link>
            );
          })()}
        </div>

        {/* Price — USD + TL */}
        <div className="mt-auto pt-3">
          <PriceDisplay
            priceUsd={product.price_usd}
            salePriceUsd={product.sale_price_usd}
            priceTry={product.price}
            salePriceTry={product.sale_price}
            size="sm"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`text-xs font-medium ${stock.color}`}>{stock.label}</span>
            {product.price >= 2000 && (
              <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Ücretsiz Kargo</span>
            )}
          </div>
        </div>

        {/* Add to Cart / Quantity Controls */}
        {inCart ? (
          <div className="mt-3 flex w-full items-center gap-2">
            {/* Quantity Controls */}
            <div className="flex flex-1 items-center justify-between rounded-lg border border-green-200 bg-green-50">
              <button
                onClick={() => {
                  if (cartQty <= 1) {
                    removeItem(product.id);
                    showToast("Ürün sepetten çıkarıldı", "info");
                  } else {
                    updateQuantity(product.id, cartQty - 1);
                  }
                }}
                className="flex h-10 w-10 items-center justify-center rounded-l-lg text-green-700 transition-colors hover:bg-green-100"
              >
                {cartQty <= 1 ? (
                  <Trash2 size={15} />
                ) : (
                  <Minus size={15} />
                )}
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-green-700">
                {cartQty}
              </span>
              <button
                onClick={() => {
                  if (cartQty < product.stock) {
                    updateQuantity(product.id, cartQty + 1);
                  }
                }}
                disabled={cartQty >= product.stock}
                className="flex h-10 w-10 items-center justify-center rounded-r-lg text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              addItem(product);
              showToast("Ürün sepete eklendi", "success");
            }}
            disabled={product.stock === 0}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
              product.stock === 0
                ? "cursor-not-allowed bg-dark-200 text-dark-500 dark:bg-dark-700 dark:text-dark-400"
                : "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md"
            }`}
          >
            <ShoppingCart size={16} />
            {product.stock === 0 ? "Stok Bildir" : "Sepete Ekle"}
          </button>
        )}
      </div>
    </div>
  );
}
