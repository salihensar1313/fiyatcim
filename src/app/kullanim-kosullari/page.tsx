import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "Fiyatcim.com kullanım koşulları ve şartları.",
  alternates: { canonical: `${SITE_URL}/kullanim-kosullari` },
};

export default function TermsPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Kullanım Koşulları" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900">Kullanım Koşulları</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600">
            <p>Bu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.</p>
            <h2 className="text-lg font-bold text-dark-900">Genel</h2>
            <p>fiyatcim.com web sitesi Fiyatcim tarafından işletilmektedir. Sitedeki tüm içerik bilgilendirme amaçlıdır.</p>
            <h2 className="text-lg font-bold text-dark-900">Ürün Bilgileri</h2>
            <p>Sitedeki ürün bilgileri, fiyatlar ve stok durumları önceden haber verilmeksizin değiştirilebilir. Ürün görselleri temsilidir.</p>
            <h2 className="text-lg font-bold text-dark-900">Sipariş ve Ödeme</h2>
            <p>Sipariş onayı, ödemenin başarıyla tamamlanması ile gerçekleşir. Stok yetersizliği durumunda sipariş iptal edilebilir ve ödeme iade edilir.</p>
            <h2 className="text-lg font-bold text-dark-900">Fikri Mülkiyet</h2>
            <p>Sitedeki tüm içerik, görseller ve tasarım Fiyatcim&apos;e aittir ve izinsiz kullanılamaz.</p>
            <p className="mt-6 text-xs text-dark-400">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
