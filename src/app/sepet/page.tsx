"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight, Crown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import CartItemComponent from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Breadcrumb from "@/components/ui/Breadcrumb";
import CartRecommendations from "@/components/product/CartRecommendations";
import PremiumBanner from "@/components/premium/PremiumBanner";
import PremiumCartItem from "@/components/cart/PremiumCartItem";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function CartPage() {
  const { items, clearCart, getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Sepetim" }]} />
      </div>

      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">
            Sepetim
            {itemCount > 0 && (
              <span className="ml-2 text-lg font-normal text-dark-500">({itemCount} ürün)</span>
            )}
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-dark-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} />
              Sepeti Temizle
            </button>
          )}
        </div>

        {/* Premium Upsell — kargo progress bar yerine */}
        {items.length > 0 && (
          <Link
            href="/premium"
            className="mb-6 flex items-center gap-4 rounded-lg border-2 border-amber-400/40 bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition-colors hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-600/30 dark:hover:from-amber-950/50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-dark-900 dark:text-dark-50">
                <span className="text-amber-600">Premium</span> üye ol, kargo her zaman ücretsiz!
              </p>
              <p className="text-xs text-dark-500 dark:text-dark-400">
                + Ücretsiz profesyonel kurulum + Netflix & Spotify hediye
              </p>
            </div>
            <ArrowRight size={18} className="ml-auto shrink-0 text-amber-500" />
          </Link>
        )}

        {/* Clear Cart Confirmation */}
        <ConfirmModal
          isOpen={showClearConfirm}
          title="Sepeti Temizle"
          message={`Sepetinizdeki ${itemCount} ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmLabel="Evet, Temizle"
          cancelLabel="Vazgeç"
          variant="danger"
          onConfirm={() => { clearCart(); setShowClearConfirm(false); }}
          onCancel={() => setShowClearConfirm(false)}
        />

        {items.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-3 lg:col-span-2">
              {items.map((item) => (
                <CartItemComponent key={item.product_id} item={item} />
              ))}
              {/* Premium Üyelik — sepete ekle/çıkar */}
              <PremiumCartItem />
            </div>

            {/* Summary */}
            <div>
              <div className="sticky top-24">
                <CartSummary />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 py-16">
            <ShoppingCart size={64} className="mb-4 text-dark-200" />
            <h2 className="text-xl font-bold text-dark-900 dark:text-dark-50">Sepetiniz Boş</h2>
            <p className="mt-2 text-dark-500 dark:text-dark-400">
              Henüz sepetinize ürün eklemediniz.
            </p>
            <Link
              href="/urunler"
              className="mt-6 rounded-lg bg-primary-600 px-8 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              Alışverişe Başla
            </Link>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { label: "Alarm Sistemleri", href: "/kategori/alarm-sistemleri" },
                { label: "Güvenlik Kameraları", href: "/kategori/guvenlik-kameralari" },
                { label: "Akıllı Ev", href: "/kategori/akilli-ev-sistemleri" },
                { label: "Akıllı Kilit", href: "/kategori/akilli-kilit" },
                { label: "Geçiş Kontrol", href: "/kategori/gecis-kontrol-sistemleri" },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="rounded-full border border-dark-200 dark:border-dark-600 px-4 py-1.5 text-xs font-medium text-dark-600 dark:text-dark-300 hover:border-primary-600 hover:text-primary-600 transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Boş Sepette Öne Çıkan Ürünler */}
        {items.length === 0 && <CartRecommendations />}

        {/* Premium Üyelik Banner */}
        {items.length > 0 && (
          <div className="mt-6">
            <PremiumBanner variant="cart" />
          </div>
        )}

        {/* Bunu Alanlar Şunları da Aldı */}
        {items.length > 0 && <CartRecommendations />}
      </div>

      {/* Sticky Mobile CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-3 shadow-lg lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400">Toplam</p>
              <p className="text-lg font-bold text-dark-900 dark:text-dark-50">{formatPrice(getTotal())}</p>
            </div>
            <Link
              href="/odeme"
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
            >
              Ödemeye Geç
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
