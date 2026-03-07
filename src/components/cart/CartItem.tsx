"use client";

import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/types";
import { formatPrice, getEffectivePrice, getDiscountPercent } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
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
        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-dark-50">
          <div className="h-14 w-14 rounded bg-dark-100" />
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
            <p className="mt-0.5 text-xs text-dark-400">SKU: {product.sku}</p>
          </div>
          <button
            onClick={() => removeItem(product.id)}
            className="shrink-0 rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-red-50 hover:text-red-600"
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

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-dark-200">
              <button
                onClick={() => updateQuantity(product.id, item.qty - 1)}
                className="px-2 py-1.5 text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:text-dark-50"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[32px] text-center text-sm font-semibold">{item.qty}</span>
              <button
                onClick={() => updateQuantity(product.id, Math.min(item.qty + 1, product.stock))}
                className="px-2 py-1.5 text-dark-600 dark:text-dark-300 hover:text-dark-900 dark:text-dark-50"
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
