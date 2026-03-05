import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Fiyatcim.com çerez politikası. Çerezlerin nasıl kullanıldığını öğrenin.",
  alternates: { canonical: `${SITE_URL}/cerez-politikasi` },
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Cerez Politikasi" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900">Cerez Politikasi</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600">
            <p>
              Fiyatcim.com olarak, web sitemizde cerezler (cookies) kullanmaktayiz. Bu politika, cerezlerin ne oldugunu,
              nasil kullanildigini ve tercihlerinizi nasil yonetebileceginizi aciklar.
            </p>

            <h2 className="text-lg font-bold text-dark-900">Cerez Nedir?</h2>
            <p>
              Cerezler, web sitelerinin tarayiciniza gonderdigi kucuk metin dosyalaridir. Tarayiciniz bu dosyalari
              cihazinizda saklar ve sonraki ziyaretlerinizde siteye geri gonderir. Cerezler, siteyi daha verimli
              kullanmanizi saglar.
            </p>

            <h2 className="text-lg font-bold text-dark-900">Kullanilan Cerez Turleri</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong>Zorunlu Cerezler:</strong> Sitenin temel islevlerinin calismasi icin gereklidir. Sepet, oturum
                yonetimi gibi islevleri kapsar.
              </li>
              <li>
                <strong>Performans Cerezleri:</strong> Ziyaretci istatistiklerini toplar, sayfa yuklenme surelerini
                olcer. Kimlik belirleyici bilgi icermez.
              </li>
              <li>
                <strong>Islevsellik Cerezleri:</strong> Dil tercihi, tema secimi gibi kisisellestirme ayarlarinizi
                hatirlar.
              </li>
              <li>
                <strong>Pazarlama Cerezleri:</strong> Ilgi alaniniza uygun reklamlar gosterilmesini saglar. Yalnizca
                onayiniz ile aktif olur.
              </li>
            </ul>

            <h2 className="text-lg font-bold text-dark-900">Cerez Tercihlerinizi Yonetme</h2>
            <p>
              Tarayici ayarlarinizdan cerezleri silebilir veya engelleyebilirsiniz. Ancak zorunlu cerezlerin
              engellenmesi sitenin duzgun calismasini engelleyebilir.
            </p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Chrome: Ayarlar &gt; Gizlilik ve Guvenlik &gt; Cerezler</li>
              <li>Firefox: Ayarlar &gt; Gizlilik &gt; Cerezler ve Site Verileri</li>
              <li>Safari: Tercihler &gt; Gizlilik &gt; Cerezleri Yonet</li>
              <li>Edge: Ayarlar &gt; Gizlilik &gt; Cerezler</li>
            </ul>

            <h2 className="text-lg font-bold text-dark-900">Veri Paylasimi</h2>
            <p>
              Cerezler araciligiyla toplanan veriler ucuncu taraflarla yalnizca anonim istatistik amacli paylasilir.
              Kisisel verileriniz cerezler araciligiyla ucuncu taraflara satilmaz veya devredilmez.
            </p>

            <h2 className="text-lg font-bold text-dark-900">Iletisim</h2>
            <p>
              Cerez politikamiz hakkinda sorulariniz icin destek@fiyatcim.com adresinden bize ulasabilirsiniz.
            </p>

            <p className="mt-6 text-xs text-dark-400">Son guncelleme: Mart 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
