import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description: "Fiyatcim.com KVKK kapsamında kişisel verilerin korunması aydınlatma metni.",
  alternates: { canonical: `${SITE_URL}/kvkk` },
};

export default function KVKKPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "KVKK Aydınlatma Metni" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900">KVKK Aydınlatma Metni</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600">
            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca, Fiyatcim olarak veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlar doğrultusunda işlemekteyiz.</p>
            <h2 className="text-lg font-bold text-dark-900">Veri Sorumlusu</h2>
            <p>Fiyatcim, İstanbul, Türkiye</p>
            <h2 className="text-lg font-bold text-dark-900">İşlenen Kişisel Veriler</h2>
            <p>Kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta, telefon, adres), işlem güvenliği bilgileri (IP adresi, oturum bilgileri).</p>
            <h2 className="text-lg font-bold text-dark-900">İşleme Amaçları</h2>
            <p>Sipariş süreçlerinin yürütülmesi, müşteri ilişkileri yönetimi, yasal yükümlülüklerin yerine getirilmesi, hizmet kalitesinin artırılması.</p>
            <h2 className="text-lg font-bold text-dark-900">Haklarınız</h2>
            <p>KVKK&apos;nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silinmesini isteme ve itiraz etme haklarına sahipsiniz.</p>
            <p className="mt-6 text-xs text-dark-400">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
