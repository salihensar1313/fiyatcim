"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/lib/utils";

export default function ShippingInfoPage() {
  const settings = useSettings();

  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Kargo Bilgileri" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900">Kargo Bilgileri</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600">
            <h2 className="text-lg font-bold text-dark-900">Kargo Ücreti</h2>
            <p>{formatPrice(settings.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti {formatPrice(settings.defaultShippingFee)}&apos;dir.</p>
            <h2 className="text-lg font-bold text-dark-900">Teslimat Süreleri</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>İstanbul içi: 1 iş günü</li>
              <li>Diğer iller: 2-3 iş günü</li>
              <li>Doğu Anadolu / Güneydoğu: 3-4 iş günü</li>
            </ul>
            <h2 className="text-lg font-bold text-dark-900">Kargo Takibi</h2>
            <p>Siparişiniz kargoya verildikten sonra takip numarası e-posta ve SMS ile bildirilir. Hesabım bölümünden kargo durumunuzu takip edebilirsiniz.</p>
            <h2 className="text-lg font-bold text-dark-900">Kurulum Dahil Ürünler</h2>
            <p>Kurulum hizmeti dahil ürünlerde teslimat, teknik ekip tarafından yerinde kurulum şeklinde yapılır. Kurulum randevusu sipariş sonrası telefonla planlanır.</p>
            <p className="mt-6 text-xs text-dark-400">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
