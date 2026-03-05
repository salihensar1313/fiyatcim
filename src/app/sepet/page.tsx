"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartItemComponent from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function CartPage() {
  const { items, clearCart, getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <div className="bg-dark-50 pb-16">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Sepetim" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark-900 md:text-3xl">
            Sepetim
            {itemCount > 0 && (
              <span className="ml-2 text-lg font-normal text-dark-400">({itemCount} ürün)</span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} />
              Sepeti Temizle
            </button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => (
                <CartItemComponent key={item.product_id} item={item} />
              ))}
            </div>

            {/* Summary */}
            <div>
              <div className="sticky top-24">
                <CartSummary />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white py-20">
            <ShoppingCart size={64} className="mb-4 text-dark-200" />
            <h2 className="text-xl font-bold text-dark-900">Sepetiniz Boş</h2>
            <p className="mt-2 text-dark-500">
              Henüz sepetinize ürün eklemediniz.
            </p>
            <Link
              href="/urunler"
              className="mt-6 rounded-lg bg-primary-600 px-8 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              Alışverişe Başla
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
