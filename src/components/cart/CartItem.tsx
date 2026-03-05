"use client";

import Link from "next/link";
import { Trash2, Minus, Plus } from "lucide-react";
import type { CartItem as CartItemType } from "@/types";
import { formatPrice, getEffectivePrice, getDiscountPercent } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import PriceDisplay from "@/components/ui/PriceDisplay";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart();
  const product = item.product;

  if (!product) return null;

  const effectivePrice = getEffectivePrice(product.price, product.sale_price);
  const discount = getDiscountPercent(product.price, product.sale_price);
  const lineTotal = effectivePrice * item.qty;

  return (
    <div className="flex gap-4 rounded-xl border border-dark-100 bg-white p-4">
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
              className="text-sm font-semibold text-dark-900 hover:text-primary-600"
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
                className="px-2 py-1.5 text-dark-600 hover:text-dark-900"
              >
                <Minus size={14} />
              </button>
              <span className="min-w-[32px] text-center text-sm font-semibold">{item.qty}</span>
              <button
                onClick={() => updateQuantity(product.id, Math.min(item.qty + 1, product.stock))}
                className="px-2 py-1.5 text-dark-600 hover:text-dark-900"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="text-sm font-bold text-dark-900">{formatPrice(lineTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
