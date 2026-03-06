import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "İade Politikası",
  description: "Fiyatcim.com iade ve değişim politikası. Ürün iade koşullarını öğrenin.",
  alternates: { canonical: `${SITE_URL}/iade-politikasi` },
};

export default function ReturnPolicyPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "İade ve Değişim Politikası" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">İade ve Değişim Politikası</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Koşulları</h2>
            <p>Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade veya değişim talebinde bulunabilirsiniz.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Şartları</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Ürün kullanılmamış ve orijinal ambalajında olmalıdır</li>
              <li>Tüm aksesuar ve dokümantasyon eksiksiz olmalıdır</li>
              <li>Fatura aslı iade paketine dahil edilmelidir</li>
              <li>Kurulum hizmeti dahil ürünlerde sökülüm bedeli uygulanabilir</li>
            </ul>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Süreci</h2>
            <p>1. Hesabınızdan veya müşteri hizmetlerinden iade talebi oluşturun. 2. Kargo etiketi tarafımızca gönderilir. 3. Ürünü kargoya verin. 4. Ürün kontrolü sonrası 3 iş günü içinde iade işleminiz tamamlanır.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">İade Edilemeyecek Ürünler</h2>
            <p>Özel sipariş üzerine üretilen veya yapılandırılan ürünler, yazılım lisansları ve aktive edilmiş elektronik ürünler iade edilemez.</p>
            <p className="mt-6 text-xs text-dark-400">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
