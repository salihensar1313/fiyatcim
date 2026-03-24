import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { formatPrice } from "@/lib/utils";
import { PREMIUM_PRICE_WITH_ORDER, PREMIUM_PRICE_STANDALONE } from "@/lib/premium";

export const metadata: Metadata = {
  title: "Premium Üyelik Sözleşmesi — Fiyatcim",
  description: "Fiyatcim Premium Üyelik hizmet sözleşmesi, kullanım koşulları ve üyelik şartları.",
  alternates: { canonical: "/premium/sozlesme" },
};

export default function PremiumAgreementPage() {
  const today = new Date().toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="bg-dark-50 pb-16 dark:bg-dark-900">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Premium Üyelik", href: "/premium" }, { label: "Üyelik Sözleşmesi" }]} />
      </div>

      <div className="container-custom">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow-sm dark:bg-dark-800 sm:p-12">
          <h1 className="mb-2 text-2xl font-bold text-dark-900 dark:text-dark-50 sm:text-3xl">
            Premium Üyelik Sözleşmesi
          </h1>
          <p className="mb-8 text-sm text-dark-500 dark:text-dark-400">Son güncelleme: {today}</p>

          <div className="prose prose-sm max-w-none text-dark-700 dark:text-dark-300 dark:prose-invert">

            {/* 1. TARAFLAR */}
            <h2>1. Taraflar</h2>
            <p>
              <strong>Hizmet Sağlayıcı:</strong> Fiyatcim E-Ticaret (&ldquo;Fiyatcim&rdquo;)<br />
              Web sitesi: <Link href="/" className="text-primary-600 hover:underline">www.fiyatcim.com</Link>
            </p>
            <p>
              <strong>Premium Üye:</strong> www.fiyatcim.com adresinden Premium Üyelik hizmetini satın alan gerçek veya tüzel kişi (&ldquo;Üye&rdquo;).
            </p>

            {/* 2. SÖZLEŞMENİN KONUSU */}
            <h2>2. Sözleşmenin Konusu</h2>
            <p>
              İşbu sözleşme, Fiyatcim Premium Üyelik hizmetinin kapsamını, tarafların hak ve yükümlülüklerini, ücretlendirme politikasını ve fesih koşullarını düzenler.
            </p>

            {/* 3. PREMIUM ÜYELİK KAPSAMI */}
            <h2>3. Premium Üyelik Kapsamı</h2>
            <p>Premium Üyelik kapsamında aşağıdaki ayrıcalıklar sunulur:</p>
            <ul>
              <li><strong>Ücretsiz Profesyonel Kurulum Desteği:</strong> Fiyatcim&apos;den satın alınan tüm ürünlerin uzman teknik ekip tarafından ücretsiz kurulumu. Kurulum, ürünün tesliminden itibaren 30 iş günü içinde, Türkiye genelinde hizmet verilen illerde gerçekleştirilir.</li>
              <li><strong>7/24 Öncelikli Destek:</strong> Premium üyelere özel telefon ve online destek hattı üzerinden öncelikli teknik destek.</li>
              <li><strong>Genişletilmiş Garanti:</strong> Standart üretici garantisine ek olarak +1 yıl uzatılmış garanti.</li>
              <li><strong>Tüm Siparişlerde Ücretsiz Kargo:</strong> Sipariş tutarı fark etmeksizin tüm kargolar ücretsiz.</li>
              <li><strong>Aynı Gün Kargo:</strong> Saat 14:00&apos;e kadar verilen siparişler aynı gün kargoya teslim edilir (stokta bulunan ürünler için).</li>
              <li><strong>Altın Premium Tema:</strong> Site genelinde özel altın renkli navigasyon, avatar çerçevesi ve buton tasarımı.</li>
              <li><strong>Premium Profil Rozeti:</strong> Hesap ve değerlendirmelerde görünen altın Premium rozeti.</li>
              <li><strong>Dijital Hediyeler:</strong> 1 aylık Netflix ve 1 aylık Spotify Premium hediye kodu (üyelik aktivasyonundan itibaren 7 iş günü içinde e-posta ile gönderilir).</li>
              <li><strong>Uzaktan Erişim Kurulumu:</strong> Mobil uygulama ve uzaktan izleme yapılandırması.</li>
              <li><strong>Yıllık Bakım Ziyareti:</strong> Yılda 1 kez ücretsiz yerinde sistem kontrolü ve bakım hizmeti.</li>
              <li><strong>Erken Erişim:</strong> Yeni ürünler ve kampanyalardan öncelikli haberdar olma.</li>
            </ul>

            {/* 4. ÜCRET VE ÖDEME */}
            <h2>4. Ücret ve Ödeme Koşulları</h2>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Paket</th>
                  <th className="text-left">Ücret</th>
                  <th className="text-left">Açıklama</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Siparişle Birlikte</td>
                  <td><strong>{formatPrice(PREMIUM_PRICE_WITH_ORDER)}</strong></td>
                  <td>Sepette ürün alırken eklenir</td>
                </tr>
                <tr>
                  <td>Sadece Premium</td>
                  <td><strong>{formatPrice(PREMIUM_PRICE_STANDALONE)}</strong></td>
                  <td>Ürün siparişi olmadan tek başına</td>
                </tr>
              </tbody>
            </table>
            <ul>
              <li>Ücretler tek seferlik olup yıllık yenileme gerektirmez.</li>
              <li>Ödeme, Fiyatcim&apos;in sunduğu ödeme yöntemleri (kredi kartı, banka kartı, havale/EFT) ile yapılır.</li>
              <li>Fiyatcim, Premium Üyelik ücretlerini önceden bildirmek kaydıyla değiştirme hakkını saklı tutar. Mevcut üyelerin hakları etkilenmez.</li>
            </ul>

            {/* 5. ÜYELİK SÜRESİ */}
            <h2>5. Üyelik Süresi</h2>
            <ul>
              <li>Premium Üyelik, ödemenin onaylanmasıyla aktif hale gelir.</li>
              <li>Üyelik süresi satın alma tarihinden itibaren <strong>1 (bir) yıldır</strong>.</li>
              <li>Üyelik süresi sona erdiğinde ayrıcalıklar otomatik olarak sona erer. Yenileme için yeni satın alma gerekir.</li>
              <li>Dijital hediyeler (Netflix, Spotify) yalnızca ilk aktivasyonda bir kez sağlanır.</li>
            </ul>

            {/* 6. ÜYENİN HAK VE YÜKÜMLÜLÜKLERİ */}
            <h2>6. Üyenin Hak ve Yükümlülükleri</h2>
            <ul>
              <li>Üye, kayıt sırasında doğru ve güncel bilgiler vermekle yükümlüdür.</li>
              <li>Üye, hesap bilgilerinin gizliliğinden ve güvenliğinden sorumludur.</li>
              <li>Premium Üyelik kişiye özeldir ve devredilemez.</li>
              <li>Üye, hizmeti yasal amaçlar doğrultusunda kullanmayı kabul eder.</li>
              <li>Üye, Premium ayrıcalıklarını kötüye kullanmamayı, üçüncü kişilere satmamayı veya ticari amaçla kullanmamayı taahhüt eder.</li>
            </ul>

            {/* 7. FİYATCİM'İN HAK VE YÜKÜMLÜLÜKLERİ */}
            <h2>7. Fiyatcim&apos;in Hak ve Yükümlülükleri</h2>
            <ul>
              <li>Fiyatcim, Premium hizmetlerini bu sözleşmede belirtilen kapsamda sunmakla yükümlüdür.</li>
              <li>Fiyatcim, teknik arıza, bakım veya mücbir sebepler nedeniyle hizmette geçici kesinti yaşanabileceğini bildirmekle yükümlüdür.</li>
              <li>Kurulum hizmeti, ürünün teslimat adresine ve bölge kapsamına bağlıdır. Hizmet verilemeyen bölgelerde alternatif çözüm sunulur.</li>
              <li>Fiyatcim, sözleşme şartlarını ihlal eden üyelerin Premium üyeliğini askıya alma veya iptal etme hakkını saklı tutar.</li>
              <li>Fiyatcim, Premium Üyelik kapsamındaki hizmetleri önceden bildirim yaparak değiştirme hakkını saklı tutar.</li>
            </ul>

            {/* 8. İPTAL VE İADE */}
            <h2>8. İptal ve İade Politikası</h2>
            <ul>
              <li>Premium Üyelik satın alımından itibaren <strong>14 gün</strong> içinde cayma hakkı kullanılabilir.</li>
              <li>Cayma hakkı kullanımında, kurulum hizmeti veya dijital hediyelerden hiçbiri kullanılmamış olmalıdır.</li>
              <li>Cayma hakkı kapsamında iade, ödemenin yapıldığı yönteme uygun şekilde 10 iş günü içinde gerçekleştirilir.</li>
              <li>Kurulum hizmeti veya dijital hediyelerden herhangi biri kullanılmışsa cayma hakkı geçerli değildir.</li>
              <li>İptal talebi için <Link href="/iletisim" className="text-primary-600 hover:underline">iletişim formu</Link> veya destek hattı kullanılabilir.</li>
            </ul>

            {/* 9. KİŞİSEL VERİLER */}
            <h2>9. Kişisel Verilerin Korunması</h2>
            <p>
              Üyenin kişisel verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenir. Detaylı bilgi için <Link href="/gizlilik-politikasi" className="text-primary-600 hover:underline">Gizlilik Politikası</Link> sayfamızı inceleyebilirsiniz.
            </p>
            <ul>
              <li>Kurulum hizmeti için paylaşılan adres bilgileri yalnızca bu amaçla kullanılır.</li>
              <li>İletişim bilgileri, Premium üyelik kapsamındaki bildirimler için kullanılır.</li>
              <li>Üye, ticari elektronik ileti almayı kabul veya reddetme hakkına sahiptir.</li>
            </ul>

            {/* 10. FİKRİ MÜLKİYET */}
            <h2>10. Fikri Mülkiyet Hakları</h2>
            <p>
              Fiyatcim.com&apos;da yer alan tüm içerikler (logo, tasarım, yazılım, metin, görsel) Fiyatcim&apos;in mülkiyetinde olup telif hakları ile korunmaktadır. Üye, bu içerikleri izinsiz kopyalayamaz, çoğaltamaz veya ticari amaçla kullanamaz.
            </p>

            {/* 11. MÜCBİR SEBEPLER */}
            <h2>11. Mücbir Sebepler</h2>
            <p>
              Doğal afetler, savaş, pandemi, hükümet kararları, iletişim altyapı arızaları gibi tarafların kontrolü dışındaki mücbir sebep hallerinde Fiyatcim, yükümlülüklerini yerine getirememesinden sorumlu tutulamaz.
            </p>

            {/* 12. UYUŞMAZLIK */}
            <h2>12. Uyuşmazlıkların Çözümü</h2>
            <p>
              İşbu sözleşmeden doğabilecek uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır. Uyuşmazlıkların çözümünde Sakarya Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>

            {/* 13. YÜRÜRLÜK */}
            <h2>13. Yürürlük</h2>
            <p>
              İşbu sözleşme, Üyenin Premium Üyelik satın alması ve ödemeyi tamamlaması ile yürürlüğe girer. Üye, satın alma işlemi sırasında bu sözleşmeyi okuduğunu ve tüm şartları kabul ettiğini beyan eder.
            </p>

            <div className="mt-10 rounded-lg border border-dark-200 bg-dark-50 p-6 text-center dark:border-dark-600 dark:bg-dark-700">
              <p className="text-sm text-dark-500 dark:text-dark-400">
                Premium Üyelik hakkında sorularınız için{" "}
                <Link href="/iletisim" className="font-semibold text-primary-600 hover:underline">iletişim sayfamızı</Link> ziyaret edebilir veya{" "}
                <strong>destek@fiyatcim.com</strong> adresine e-posta gönderebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
