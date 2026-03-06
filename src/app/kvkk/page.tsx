import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL, CONTACT } from "@/lib/constants";
import { Shield, FileText, Eye, Trash2, AlertTriangle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Kişisel Verilerin Korunması",
  description:
    "Fiyatcim.com 6698 sayılı KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni. Haklarınızı ve veri işleme süreçlerimizi öğrenin.",
  alternates: { canonical: `${SITE_URL}/kvkk` },
};

export default function KVKKPage() {
  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "KVKK Aydınlatma Metni" }]} />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-600 py-10">
        <div className="container mx-auto px-4 text-center text-white">
          <Shield size={48} className="mx-auto mb-3 opacity-80" />
          <h1 className="text-3xl font-extrabold">Kişisel Verilerin Korunması ve Gizlilik</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">
            6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca kişisel verilerinizin
            işlenmesine ilişkin aydınlatma metni
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Güncelleme Tarihi */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/30 px-5 py-3 text-sm text-blue-800">
            <strong>Güncelleme Tarihi:</strong> 01.03.2026
          </div>

          {/* Veri Sorumlusu */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
              <FileText size={20} className="text-primary-600" />
              Veri Sorumlusu
            </h2>
            <p className="text-sm leading-relaxed text-dark-600 dark:text-dark-300">
              Fiyatcim Elektronik Ticaret (&quot;Fiyatcim&quot; veya &quot;Şirket&quot;), 6698 sayılı
              Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında veri sorumlusu
              sıfatıyla, kişisel verilerinizi aşağıda açıklanan şekilde işlemektedir.
            </p>
            <div className="mt-3 rounded-lg bg-dark-50 p-4 text-sm text-dark-600 dark:text-dark-300">
              <p><strong>Ticaret Unvanı:</strong> Fiyatcim Elektronik Ticaret</p>
              <p><strong>Adres:</strong> {CONTACT.address}</p>
              <p><strong>E-posta:</strong> {CONTACT.email}</p>
              <p><strong>Telefon:</strong> {CONTACT.phone}</p>
            </div>
          </section>

          {/* İşlenen Kişisel Veriler */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
              <Eye size={20} className="text-primary-600" />
              İşlenen Kişisel Veriler
            </h2>
            <div className="overflow-hidden rounded-lg border border-dark-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Veri Kategorisi</th>
                    <th className="px-4 py-3 text-left font-semibold">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: "Kimlik Bilgileri", desc: "Ad, soyad" },
                    { cat: "İletişim Bilgileri", desc: "E-posta adresi, telefon numarası, teslimat ve fatura adresi" },
                    { cat: "Müşteri İşlem Bilgileri", desc: "Sipariş bilgileri, ödeme geçmişi, iade talepleri" },
                    { cat: "İşlem Güvenliği Bilgileri", desc: "IP adresi, oturum bilgileri, cihaz bilgileri" },
                    { cat: "Pazarlama Bilgileri", desc: "Alışveriş tercihleri, çerez verileri, kampanya katılım bilgileri" },
                    { cat: "Hukuki İşlem Bilgileri", desc: "Fatura bilgileri, yasal süreç kapsamında gerekli veriler" },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-dark-800" : "bg-dark-50 dark:bg-dark-800"}>
                      <td className="px-4 py-3 font-medium text-dark-800 dark:text-dark-100">{row.cat}</td>
                      <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* İşleme Amaçları */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900 dark:text-dark-50">Kişisel Verilerin İşlenme Amaçları</h2>
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-300">
              {[
                "Üyelik ve hesap oluşturma süreçlerinin yürütülmesi",
                "Sipariş ve ödeme işlemlerinin gerçekleştirilmesi",
                "Ürün ve hizmetlerin teslimatının sağlanması",
                "Müşteri ilişkileri yönetimi ve destek hizmetleri",
                "İade, değişim ve garanti süreçlerinin yönetimi",
                "Yasal yükümlülüklerin yerine getirilmesi (fatura, vergi beyanı vb.)",
                "İletişim faaliyetlerinin yürütülmesi",
                "Bilgi güvenliği süreçlerinin yönetimi",
                "Saklama ve arşiv faaliyetlerinin yürütülmesi",
                "Hizmet kalitesinin artırılması ve analiz çalışmaları",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Aktarım */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900 dark:text-dark-50">Kişisel Verilerin Aktarılması</h2>
            <p className="mb-3 text-sm text-dark-600 dark:text-dark-300">
              Kişisel verileriniz, KVKK&apos;nın 8. ve 9. maddelerinde belirtilen koşullar
              çerçevesinde aşağıdaki taraflara aktarılabilir:
            </p>
            <ul className="space-y-2 text-sm text-dark-600 dark:text-dark-300">
              {[
                "Kargo ve lojistik şirketleri (teslimat için)",
                "Ödeme kuruluşları ve bankalar (ödeme işlemleri için)",
                "Yasal merciler ve düzenleyici kurumlar (yasal zorunluluk halinde)",
                "İş ortakları ve tedarikçiler (hizmet sunumu için)",
                "Bilgi teknoloji hizmet sağlayıcıları (altyapı desteği için)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Saklama Süreleri */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900 dark:text-dark-50">Saklama Süreleri</h2>
            <p className="text-sm text-dark-600 dark:text-dark-300">
              Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuatta
              öngörülen zamanaşımı süreleri boyunca saklanır. Saklama süresinin sona ermesiyle
              birlikte veriler silinir, yok edilir veya anonim hale getirilir.
            </p>
            <div className="mt-3 overflow-hidden rounded-lg border border-dark-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-800 text-white">
                    <th className="px-4 py-3 text-left font-semibold">Veri Türü</th>
                    <th className="px-4 py-3 text-left font-semibold">Saklama Süresi</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "Üyelik bilgileri", period: "Üyelik süresince + 3 yıl" },
                    { type: "Sipariş ve fatura bilgileri", period: "10 yıl (6102 s. TTK)" },
                    { type: "İşlem güvenliği logları", period: "2 yıl (5651 s. Kanun)" },
                    { type: "Çerez verileri", period: "Maks. 2 yıl" },
                    { type: "Pazarlama izinleri", period: "İzin geri çekilene kadar" },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-dark-800" : "bg-dark-50 dark:bg-dark-800"}>
                      <td className="px-4 py-3 font-medium text-dark-800 dark:text-dark-100">{row.type}</td>
                      <td className="px-4 py-3 text-dark-600 dark:text-dark-300">{row.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Haklar */}
          <section className="rounded-xl border border-dark-100 bg-white dark:bg-dark-800 dark:border-dark-700 dark:bg-dark-800 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
              <Trash2 size={20} className="text-primary-600" />
              KVKK Kapsamında Haklarınız
            </h2>
            <p className="mb-3 text-sm text-dark-600 dark:text-dark-300">
              KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                "İşlenmişse buna ilişkin bilgi talep etme",
                "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme",
                "Yurt içi/dışı aktarıldığı üçüncü kişileri bilme",
                "Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme",
                "KVKK madde 7 kapsamında silinmesini veya yok edilmesini isteme",
                "Düzeltme/silme işlemlerinin aktarılan kişilere bildirilmesini isteme",
                "Otomatik analiz yoluyla aleyhinize bir sonuç çıkmasına itiraz etme",
                "Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme",
              ].map((right, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-dark-100 bg-dark-50 p-3 text-sm text-dark-600 dark:text-dark-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  {right}
                </div>
              ))}
            </div>
          </section>

          {/* Başvuru */}
          <section className="rounded-xl border border-primary-200 bg-primary-50 dark:bg-primary-900/30 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary-800">
              <Mail size={20} />
              Başvuru Yöntemi
            </h2>
            <p className="text-sm text-primary-700">
              Yukarıda belirtilen haklarınızı kullanmak için kimliğinizi tespit edici bilgiler ile
              birlikte talebinizi aşağıdaki kanallardan bize iletebilirsiniz:
            </p>
            <div className="mt-3 space-y-2 text-sm text-primary-700">
              <p>
                <strong>E-posta:</strong>{" "}
                <a href={`mailto:${CONTACT.email}`} className="underline">
                  {CONTACT.email}
                </a>{" "}
                (konu satırına &quot;KVKK Başvuru&quot; yazınız)
              </p>
              <p>
                <strong>Posta:</strong> {CONTACT.address}
              </p>
            </div>
          </section>

          {/* Uyarı */}
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-5">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-orange-600" />
            <p className="text-sm text-orange-700">
              Başvurularınız en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrıca
              bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu tarafından
              belirlenen tarifedeki ücret alınabilir.
            </p>
          </div>

          <p className="text-center text-xs text-dark-400">Son güncelleme: Mart 2026</p>
        </div>
      </div>
    </div>
  );
}
