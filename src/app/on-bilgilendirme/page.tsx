import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_NAME, CONTACT, SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ön Bilgilendirme Formu",
  description: "Fiyatcim.com ön bilgilendirme formu.",
  alternates: { canonical: `${SITE_URL}/on-bilgilendirme` },
};

export default function PreInformationPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "On Bilgilendirme Formu" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">On Bilgilendirme Formu</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600 dark:text-dark-300">
            <p>
              6502 sayili Tuketicinin Korunmasi Hakkinda Kanun ve Mesafeli Sozlesmeler Yonetmeligi uyarinca,
              mesafeli sozlesmenin kurulmasindan once asagidaki bilgiler tuketiciye sunulmaktadir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">1. Satici Bilgileri</h2>
            <p>
              <strong>Unvan:</strong> {SITE_NAME}<br />
              <strong>Adres:</strong> {CONTACT.address}<br />
              <strong>E-posta:</strong> {CONTACT.email}<br />
              <strong>Telefon:</strong> {CONTACT.phone}
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">2. Urun/Hizmet Bilgileri</h2>
            <p>
              Satis konusu urunun temel nitelikleri (turu, miktari, marka/modeli, rengi, adedi) siparis sayfasinda
              belirtilmektedir. Urun gorselleri temsilidir; renk, boyut gibi ozellikler ekran ayarlarina gore
              farklilik gosterebilir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">3. Fiyat Bilgisi</h2>
            <p>
              Urun fiyatlarina KDV dahildir. Kargo ucreti siparis ozeti sayfasinda ayrica belirtilir. Toplam odeme
              tutari siparis onay sayfasinda gosterilir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">4. Odeme Bilgileri</h2>
            <p>
              Kredi karti ve banka karti ile odeme kabul edilmektedir. Taksit secenekleri bankaniza gore
              degisiklik gosterebilir. Odeme, guvenli alt yapi saglayicisi uzerinden gerceklestirilir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">5. Teslimat Bilgileri</h2>
            <p>
              Urun, siparis onayindan sonra en gec 30 gun icinde teslim edilir. Tahmini teslimat suresi urun
              sayfasinda ve siparis ozetinde belirtilir. Teslimat, Alici&apos;nin belirttigi adrese yapilir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">6. Cayma Hakki</h2>
            <p>
              Tuketici, urunun teslim tarihinden itibaren 14 gun icinde herhangi bir gerekce gostermeksizin
              sozlesmeden cayabilir. Cayma hakkinin kullanilmasi icin bu sure icinde Satici&apos;ya yazili bildirimde
              bulunulmasi yeterlidir.
            </p>

            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">7. Sikayet ve Itiraz</h2>
            <p>
              Sikayet ve itirazlarinizi {CONTACT.email} adresine veya {CONTACT.phone} numarasina iletebilirsiniz.
              Tuketici Hakem Heyetleri ve Tuketici Mahkemeleri&apos;ne basvuru hakkiniz saklıdır.
            </p>

            <p className="mt-6 text-xs text-dark-500">Son guncelleme: Mart 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
