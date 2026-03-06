"use client";

import { ShoppingCart, Heart, Truck, Shield, Package, Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types";
import { formatPrice, getDiscountPercent, getEffectivePrice, getStockStatus } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Rating from "@/components/ui/Rating";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { useProductReviews } from "@/hooks/useProductReviews";

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [qty, setQty] = useState(1);
  const { addItem, isInCart, items, updateQuantity, removeItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const discount = getDiscountPercent(product.price, product.sale_price);
  const effectivePrice = getEffectivePrice(product.price, product.sale_price);
  const stock = getStockStatus(product.stock, product.critical_stock);
  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  const brand = product.brand;
  const { reviews, averageRating } = useProductReviews(product.id);

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) {
      addItem(product);
    }
    showToast(`${qty > 1 ? qty + " adet ürün" : "Ürün"} sepete eklendi`, "success");
  };

  return (
    <div className="space-y-5">
      {/* Brand */}
      {brand && (
        <span className="text-sm font-medium uppercase tracking-wider text-dark-400">
          {brand.name}
        </span>
      )}

      {/* Name */}
      <h1 className="text-2xl font-bold text-dark-900 lg:text-3xl">{product.name}</h1>

      {/* Rating & SKU */}
      <div className="flex items-center gap-4">
        {reviews.length > 0 ? (
          <button
            onClick={() => {
              document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" });
              window.location.hash = "reviews";
            }}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Rating rating={averageRating} size="sm" />
            <span className="text-sm text-primary-600 hover:underline">
              {reviews.length} değerlendirme
            </span>
          </button>
        ) : (
          <span className="text-sm text-dark-400">Henüz değerlendirme yok</span>
        )}
        <span className="text-sm text-dark-400">SKU: {product.sku}</span>
      </div>

      {/* Short desc */}
      <p className="text-dark-600">{product.short_desc}</p>

      {/* Price */}
      <div className="flex items-center gap-3">
        <PriceDisplay
          priceUsd={product.price_usd}
          salePriceUsd={product.sale_price_usd}
          priceTry={product.price}
          salePriceTry={product.sale_price}
          size="lg"
        />
        {discount > 0 && (
          <Badge variant="red">%{discount} İndirim</Badge>
        )}
      </div>

      {/* KDV info */}
      <p className="text-xs text-dark-400">KDV dahil fiyattır.</p>

      {/* G15: Taksit Bilgisi */}
      {effectivePrice >= 500 && effectivePrice > 0 && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-medium text-blue-700">
            Taksit Seçenekleri
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {[3, 6, 9, 12].map((ay) => (
              <span key={ay} className="rounded bg-white px-2 py-1 text-xs font-medium text-blue-600 shadow-sm">
                {ay} Taksit: {formatPrice(effectivePrice / ay)}/ay
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-blue-500">
            Demo: Gerçek taksit bilgisi ödeme adımında hesaplanır.
          </p>
        </div>
      )}

      {/* G16: Stok FOMO */}
      {product.stock > 0 && product.stock <= 10 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
          <span className="text-lg">🔥</span>
          <p className="text-xs font-medium text-orange-700">
            Bu ürün çok talep görüyor! Son <span className="font-bold">{product.stock} adet</span> kaldı.
          </p>
        </div>
      )}

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <span className={`flex h-2.5 w-2.5 rounded-full ${
          product.stock === 0 ? "bg-red-500" : product.stock <= product.critical_stock ? "bg-orange-500" : "bg-green-500"
        }`} />
        <span className={`text-sm font-medium ${stock.color}`}>{stock.label}</span>
        {product.stock > 0 && product.stock <= product.critical_stock && (
          <span className="text-xs text-dark-400">(Son {product.stock} adet)</span>
        )}
      </div>

      {/* Quantity + Add to Cart */}
      {product.stock > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {inCart ? (
            <>
              {/* In-cart quantity controls */}
              <div className="flex items-center rounded-lg border border-green-200 bg-green-50">
                <button
                  onClick={() => {
                    const cartItem = items.find((i) => i.product_id === product.id);
                    if (cartItem && cartItem.qty <= 1) {
                      removeItem(product.id);
                      showToast("Ürün sepetten çıkarıldı", "info");
                    } else {
                      updateQuantity(product.id, (cartItem?.qty || 1) - 1);
                    }
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-l-lg text-green-700 transition-colors hover:bg-green-100"
                >
                  {(items.find((i) => i.product_id === product.id)?.qty || 0) <= 1 ? (
                    <Trash2 size={16} />
                  ) : (
                    <Minus size={16} />
                  )}
                </button>
                <span className="min-w-[3rem] text-center text-sm font-bold text-green-700">
                  {items.find((i) => i.product_id === product.id)?.qty || 0}
                </span>
                <button
                  onClick={() => {
                    const cartItem = items.find((i) => i.product_id === product.id);
                    if (cartItem && cartItem.qty < product.stock) {
                      updateQuantity(product.id, cartItem.qty + 1);
                    }
                  }}
                  disabled={
                    (items.find((i) => i.product_id === product.id)?.qty || 0) >= product.stock
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-r-lg text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Sepette label */}
              <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-50 px-6 py-3 text-sm font-bold text-green-700">
                <ShoppingCart size={18} />
                Sepette
              </div>
            </>
          ) : (
            <>
              {/* Quantity selector */}
              <div className="flex items-center rounded-lg border border-dark-200">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-dark-600 hover:text-dark-900"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-[40px] text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(product.stock, qty + 1))}
                  className="px-3 py-2 text-dark-600 hover:text-dark-900"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700"
              >
                <ShoppingCart size={18} />
                Sepete Ekle
              </button>
            </>
          )}

          {/* Wishlist */}
          <button
            onClick={() => {
              toggleItem(product.id);
              showToast(inWishlist ? "Favorilerden çıkarıldı" : "Favorilere eklendi", inWishlist ? "info" : "success");
            }}
            className={`rounded-lg border p-3 transition-all ${
              inWishlist
                ? "border-primary-200 bg-primary-50 text-primary-600"
                : "border-dark-200 text-dark-400 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            <Heart size={18} className={inWishlist ? "fill-current" : ""} />
          </button>
        </div>
      )}

      {/* Shipping & Features */}
      <div className="space-y-3 rounded-xl border border-dark-100 bg-dark-50 p-4">
        <div className="flex items-center gap-3">
          <Truck size={18} className="text-primary-600" />
          <div>
            <p className="text-sm font-medium text-dark-900">
              {product.shipping_type === "kurulum" ? "Ücretsiz Kurulum" : "Hızlı Kargo"}
            </p>
            <p className="text-xs text-dark-500">
              {product.shipping_type === "kurulum"
                ? "Profesyonel kurulum ekibi ile yerinde montaj"
                : "2.000₺ üzeri siparişlerde ücretsiz kargo"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-primary-600" />
          <div>
            <p className="text-sm font-medium text-dark-900">{product.warranty_months} Ay Garanti</p>
            <p className="text-xs text-dark-500">Üretici garantisi kapsamında</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Package size={18} className="text-primary-600" />
          <div>
            <p className="text-sm font-medium text-dark-900">14 Gün İade Hakkı</p>
            <p className="text-xs text-dark-500">Koşulsuz iade ve değişim</p>
          </div>
        </div>
      </div>
    </div>
  );
}
