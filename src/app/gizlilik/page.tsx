import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Fiyatcim.com gizlilik politikası. Kişisel verilerinizin nasıl korunduğunu öğrenin.",
  alternates: { canonical: `${SITE_URL}/gizlilik` },
};

export default function PrivacyPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Gizlilik Politikası" }]} />
      </div>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-xl border border-dark-100 bg-white p-8">
          <h1 className="mb-6 text-2xl font-bold text-dark-900">Gizlilik Politikası</h1>
          <div className="space-y-4 text-sm leading-relaxed text-dark-600">
            <p>Fiyatcim.com olarak kişisel verilerinizin güvenliği bizim için önemlidir.</p>
            <h2 className="text-lg font-bold text-dark-900">Toplanan Bilgiler</h2>
            <p>Sitemizi ziyaret ettiğinizde ad, soyad, e-posta, telefon ve adres bilgileriniz toplanabilir. Bu bilgiler sipariş işlemleri, müşteri hizmetleri ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılır.</p>
            <h2 className="text-lg font-bold text-dark-900">Bilgi Kullanımı</h2>
            <p>Kişisel bilgileriniz siparişlerinizi işleme almak, ürün ve hizmetlerimizi geliştirmek ve yasal yükümlülüklerimizi yerine getirmek için kullanılır.</p>
            <h2 className="text-lg font-bold text-dark-900">Bilgi Güvenliği</h2>
            <p>SSL sertifikası ile şifreleme, güvenli sunucu altyapısı ve düzenli güvenlik denetimleri ile verilerinizi koruyoruz.</p>
            <h2 className="text-lg font-bold text-dark-900">Çerezler</h2>
            <p>Sitemizde kullanıcı deneyimini iyileştirmek için çerezler kullanılmaktadır. Çerez tercihlerinizi tarayıcınızdan yönetebilirsiniz.</p>
            <h2 className="text-lg font-bold text-dark-900">İletişim</h2>
            <p>Gizlilik politikamız hakkında sorularınız için destek@fiyatcim.com adresinden bize ulaşabilirsiniz.</p>
            <p className="mt-6 text-xs text-dark-400">Son güncelleme: Şubat 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}
