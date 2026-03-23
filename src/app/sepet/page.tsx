"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import CartItemComponent from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import Breadcrumb from "@/components/ui/Breadcrumb";
import CartRecommendations from "@/components/product/CartRecommendations";
import PremiumBanner from "@/components/premium/PremiumBanner";
import ConfirmModal from "@/components/ui/ConfirmModal";

const FREE_SHIPPING_THRESHOLD = 2000;

export default function CartPage() {
  const { items, clearCart, getItemCount, getTotal } = useCart();
  const itemCount = getItemCount();
  const total = getTotal();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const shippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - total;

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

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="mb-6 rounded-lg border border-dark-100 bg-white p-4 dark:border-dark-700 dark:bg-dark-800">
            <div className="flex items-center gap-3">
              <Truck size={20} className={remaining <= 0 ? "text-green-500" : "text-dark-500"} />
              <div className="flex-1">
                <p className="text-sm font-medium text-dark-700 dark:text-dark-200">
                  {remaining <= 0 ? (
                    <span className="text-green-600 dark:text-green-400">Tebrikler! Ücretsiz kargo kazandınız! 🎉</span>
                  ) : (
                    <>Ücretsiz kargo için <strong className="text-primary-600">{formatPrice(remaining)}</strong> daha ekleyin</>
                  )}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-dark-100 dark:bg-dark-600">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${remaining <= 0 ? "bg-green-500" : "bg-primary-600"}`}
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
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
