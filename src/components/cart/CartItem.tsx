"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/types";
import { formatPrice, getEffectivePrice, getDiscountPercent } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { getProductPrimaryImage, isRemoteImage } from "@/lib/product-images";
import PriceDisplay from "@/components/ui/PriceDisplay";
import GiftWrapOption from "./GiftWrapOption";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const product = item.product;

  if (!product) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
        <div className="flex-1">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Bu ürün artık mevcut değil</p>
        </div>
        <button
          onClick={() => removeItem(item.product_id)}
          className="rounded-lg p-2 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          title="Kaldır"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  const effectivePrice = getEffectivePrice(product.price, product.sale_price);
  const discount = getDiscountPercent(product.price, product.sale_price);
  const lineTotal = effectivePrice * item.qty;

  return (
    <div className="flex gap-4 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-4">
      {/* Image */}
      <Link href={`/urunler/${product.slug}`} className="shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-dark-50 dark:bg-white/10">
          <Image
            src={getProductPrimaryImage(product)}
            alt={product.name}
            width={96}
            height={96}
            unoptimized={isRemoteImage(getProductPrimaryImage(product))}
            className="h-full w-full object-contain p-1"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/urunler/${product.slug}`}
              className="text-sm font-semibold text-dark-900 dark:text-dark-50 hover:text-primary-600"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-xs text-dark-500">SKU: {product.sku}</p>
          </div>
          <button
            onClick={() => removeItem(product.id)}
            className="shrink-0 rounded-lg p-2 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95"
            aria-label="Ürünü kaldır"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
          {/* Price */}
          <div>
            <PriceDisplay
              priceUsd={product.price_usd}
              salePriceUsd={product.sale_price_usd}
              priceTry={product.price}
              salePriceTry={product.sale_price}
              size="sm"
            />
            {discount > 0 && (
              <span className="mt-1 inline-block rounded bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-700">
                %{discount}
              </span>
            )}
          </div>

          {/* Quantity — 44px min touch targets */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-dark-200 dark:border-dark-600">
              <button
                onClick={() => updateQuantity(product.id, item.qty - 1)}
                className="flex h-10 w-10 items-center justify-center text-dark-600 transition-colors hover:text-dark-900 active:scale-95 dark:text-dark-300 dark:hover:text-dark-50"
                aria-label="Adet azalt"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[32px] text-center text-sm font-semibold text-dark-900 dark:text-dark-50">{item.qty}</span>
              <button
                onClick={() => updateQuantity(product.id, Math.min(item.qty + 1, product.stock))}
                className="flex h-10 w-10 items-center justify-center text-dark-600 transition-colors hover:text-dark-900 active:scale-95 dark:text-dark-300 dark:hover:text-dark-50"
                aria-label="Adet artır"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-sm font-bold text-dark-900 dark:text-dark-50">{formatPrice(lineTotal)}</span>
          </div>
        </div>

        {/* Gift Wrap */}
        <GiftWrapOption
          productId={product.id}
          isWrapped={item.giftWrap}
          message={item.giftMessage}
        />
      </div>
    </div>
  );
}
