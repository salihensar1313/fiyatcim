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
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Kullanım Koşulları" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">Kullanım Koşulları</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">
            <p>Bu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Genel</h2>
            <p>fiyatcim.com web sitesi Fiyatcim tarafından işletilmektedir. Sitedeki tüm içerik bilgilendirme amaçlıdır.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Ürün Bilgileri</h2>
            <p>Sitedeki ürün bilgileri, fiyatlar ve stok durumları önceden haber verilmeksizin değiştirilebilir. Ürün görselleri temsilidir.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Sipariş ve Ödeme</h2>
            <p>Sipariş onayı, ödemenin başarıyla tamamlanması ile gerçekleşir. Stok yetersizliği durumunda sipariş iptal edilebilir ve ödeme iade edilir.</p>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Fikri Mülkiyet</h2>
            <p>Sitedeki tüm içerik, görseller ve tasarım Fiyatcim&apos;e aittir ve izinsiz kullanılamaz.</p>
            <p className="mt-6 text-xs text-dark-500">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
