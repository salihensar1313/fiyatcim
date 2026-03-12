import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_NAME, CONTACT, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mesafeli Satış Sözleşmesi",
  description: "Fiyatcim.com mesafeli satış sözleşmesi metni.",
  alternates: { canonical: `${SITE_URL}/mesafeli-satis-sozlesmesi` },
};

export default function DistanceSalesAgreementPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Mesafeli Satis Sozlesmesi" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">Mesafeli Satis Sozlesmesi</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 1 - Taraflar</h2>
            <p>
              <strong>Satici:</strong> {SITE_NAME}<br />
              <strong>Adres:</strong> {CONTACT.address}<br />
              <strong>E-posta:</strong> {CONTACT.email}<br />
              <strong>Telefon:</strong> {CONTACT.phone}
            </p>
            <p>
              <strong>Alici:</strong> Siparis formunda belirtilen ad, soyad ve iletisim bilgilerine sahip kisidir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 2 - Konu</h2>
            <p>
              Isbu sozlesme, Alici&apos;nin Satici&apos;ya ait internet sitesinden elektronik ortamda siparis verdigi urunun
              satisi ve teslimi ile ilgili olarak 6502 sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli
              Sozlesmeler Yonetmeligi hukumleri geregi taraflarin hak ve yukumluluklerini duzenlenmektedir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 3 - Sozlesme Konusu Urun Bilgileri</h2>
            <p>
              Urunun cinsi, miktari, marka/modeli, rengi, adedi ve satis fiyati siparis sayfasinda belirtildigi gibidir.
              Urun fiyatina KDV dahildir. Odeme sekli ve teslimat bilgileri siparis ozetinde yer almaktadir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 4 - Genel Hukumler</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Alici, siparis verdigi urune ait temel nitelikleri, satis fiyatini ve odeme sekli ile teslimata iliskin bilgileri okuyup bilgi sahibi oldugunu kabul eder.</li>
              <li>Siparis verildikten sonra bedelin odenmesi Alici&apos;nin yukumlulugundedir.</li>
              <li>Satici, siparis konusu urunu eksiksiz, saglam ve siparis spesifikasyonlarina uygun teslim etmeyi kabul eder.</li>
            </ul>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 5 - Teslimat</h2>
            <p>
              Urun, Alici&apos;nin siparis formunda belirttigi adrese teslim edilir. Satici, siparis tarihinden itibaren en
              gec 30 gun icinde teslimat gerceklestirir. Teslimat suresi urun sayfasinda ve siparis ozetinde belirtilir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 6 - Cayma Hakki</h2>
            <p>
              Alici, urunun kendisine veya gosterdigi adresteki kisiye teslim tarihinden itibaren 14 gun icinde
              herhangi bir gerekce gostermeksizin ve cezai sart odemeksizin sozlesmeden cayma hakkina sahiptir.
              Cayma hakki bildiriminin bu sure icinde Satici&apos;ya yoneltilmis olmasi yeterlidir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 7 - Cayma Hakkinin Kullanilamayacagi Durumlar</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Alici&apos;nin istekleri dogrultusunda ozel olarak hazirlanan urunler</li>
              <li>Acildiktan sonra iade edilemeyecek ambalajli urunler</li>
              <li>Kurulum yapilmis ve aktive edilmis elektronik cihazlar</li>
              <li>Yazilim lisanslari aktive edildikten sonra</li>
            </ul>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">Madde 8 - Yetkili Mahkeme</h2>
            <p>
              Isbu sozlesmeden dogan uyusmazliklarda Tuketici Hakem Heyetleri ve Tuketici Mahkemeleri yetkilidir.
              Basvurularda Sanayi ve Ticaret Bakanligi&apos;nca ilan edilen parasal sinirlar dikkate alinir.
            </p>

            <p className="mt-6 font-medium text-dark-700 dark:text-dark-200">
              Alici, isbu sozlesmeyi elektronik ortamda onaylayarak tum sartlari kabul etmis sayilir.
            </p>
            <p className="mt-6 text-xs text-dark-500">Son guncelleme: Mart 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
