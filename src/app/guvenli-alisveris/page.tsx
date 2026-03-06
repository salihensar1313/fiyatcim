import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL, CONTACT } from "@/lib/constants";
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Truck,
  RotateCcw,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Güvenli Alışveriş Kılavuzu",
  description:
    "Fiyatcim.com güvenli alışveriş kılavuzu. Online alışverişte güvenliğiniz için ipuçları, ödeme güvenliği ve dolandırıcılıktan korunma yöntemleri.",
  alternates: { canonical: `${SITE_URL}/guvenli-alisveris` },
};

const SAFE_SHOPPING_TIPS = [
  {
    icon: Lock,
    title: "Güvenli Bağlantı",
    desc: "Adres çubuğunda kilit simgesi ve \"https://\" olduğundan emin olun. Fiyatcim.com 256-bit SSL şifreleme kullanır.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: CreditCard,
    title: "Güvenli Ödeme",
    desc: "3D Secure destekli ödeme altyapımız ile kredi kartı bilgileriniz bankalar arası güvenli ağda işlenir.",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    icon: Truck,
    title: "Güvenli Teslimat",
    desc: "Siparişleriniz sigortalı kargo ile gönderilir. Kargo takip numarası ile sürecin her aşamasını izleyebilirsiniz.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    icon: RotateCcw,
    title: "Kolay İade",
    desc: "14 gün içinde koşulsuz iade hakkı. İade süreciniz hızlı ve şeffaf şekilde yönetilir.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
];

export default function GuvenliAlisverisPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Güvenli Alışveriş Kılavuzu" }]} />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 py-12">
        <div className="container mx-auto px-4 text-center text-white">
          <ShieldCheck size={56} className="mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-extrabold sm:text-4xl">Güvenli Alışveriş Kılavuzu</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/80">
            Fiyatcim.com&apos;da alışveriş yaparken güvenliğiniz bizim önceliğimizdir.
            Online alışverişte dikkat etmeniz gerekenler ve güvencelerimiz.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Güvence Kartları */}
          <div className="grid gap-4 sm:grid-cols-2">
            {SAFE_SHOPPING_TIPS.map((tip) => (
              <div
                key={tip.title}
                className={`rounded-xl border ${tip.border} ${tip.bg} p-5`}
              >
                <tip.icon size={28} className={tip.color} />
                <h3 className="mt-2 text-sm font-bold text-dark-900">{tip.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-dark-600">{tip.desc}</p>
              </div>
            ))}
          </div>

          {/* Güvenli Alışveriş İpuçları */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-dark-900">
              <Eye size={20} className="text-primary-600" />
              Güvenli Alışveriş İpuçları
            </h2>
            <ul className="space-y-3">
              {[
                "Alışveriş yaparken her zaman adres çubuğunda kilit simgesini kontrol edin.",
                "Şifrenizi düzenli olarak değiştirin ve güçlü şifreler kullanın (büyük/küçük harf, rakam, özel karakter).",
                "Halka açık Wi-Fi ağlarında ödeme işlemi yapmaktan kaçının.",
                "Bilgisayarınızda güncel antivirüs yazılımı bulundurun.",
                "Fiyatcim.com dışındaki bağlantılardan alışveriş yapmayın.",
                "Sipariş onay e-postalarını ve kargo takip bilgilerini kontrol edin.",
                "Şüpheli bir durumla karşılaştığınızda müşteri hizmetlerimize hemen ulaşın.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-dark-600">
                  <CheckCircle size={16} className="mt-0.5 shrink-0 text-green-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {/* Dolandırıcılıktan Korunma */}
          <section className="rounded-xl border border-orange-200 bg-orange-50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-orange-800">
              <AlertTriangle size={20} />
              Dolandırıcılığa Karşı Dikkat!
            </h2>
            <p className="mb-3 text-sm text-orange-700">
              Fiyatcim.com adını kullanan sahte siteler veya dolandırıcılık girişimlerine karşı
              dikkatli olun. Aşağıdaki durumlarda kesinlikle bilgi paylaşmayın:
            </p>
            <ul className="space-y-2">
              {[
                "Fiyatcim adı kullanılarak kişisel bilgilerinizi, kredi kartı veya hesap bilgilerinizi talep eden e-posta ve SMS'lere cevap vermeyin.",
                "Fiyatcim tarafından arandığı izlenimi yaratan sahte web siteleri ve sosyal medya hesaplarına itibar etmeyin.",
                "Fiyatcim telefon veya e-posta yoluyla hiçbir işlemde şifre istememektedir. Şifre ve parolanızı kimseyle paylaşmayın.",
                "Gerçek olamayacak kadar iyi bir anlaşma vaat eden, derhal harekete geçmenizi talep eden e-postalara şüpheyle yaklaşın.",
                "Tanımadığınız kişilerden gelen bağlantıları açmayın ve yanıtlamayın.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-orange-700">
                  <XCircle size={14} className="mt-0.5 shrink-0 text-orange-600" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Sahte Site Tanıma */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900">
              Sahte E-posta ve Web Sitelerini Nasıl Tanırım?
            </h2>
            <div className="space-y-4 text-sm text-dark-600">
              <div>
                <h3 className="font-semibold text-dark-800">Gerçek E-posta</h3>
                <ul className="mt-1 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />
                    E-postalarımız her zaman @fiyatcim.com alan adından gönderilir.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />
                    Şifreniz, kredi kartı veya banka numaranız gibi kişisel verileri asla istemeyiz.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />
                    E-postalarımız ek dosya içermez. Ekli mesaj alırsanız açmayın.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-dark-800">Sahte E-posta Belirtileri</h3>
                <ul className="mt-1 space-y-1">
                  <li className="flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    Bilinmeyen alan adlarından gelen e-postalar (ör. fiyatcim@gmail.com)
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    Acil işlem yapmanızı isteyen baskıcı dil
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                    Yazım hataları ve profesyonel olmayan görünüm
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sahtecilik Bildir */}
          <section className="rounded-xl border border-primary-200 bg-primary-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-primary-800">Sahtecilik Bildirin</h2>
            <p className="text-sm text-primary-700">
              Dolandırıcılık amaçlı gönderilerle karşılaştığınızı düşünüyorsanız, aşağıdaki
              kanallardan bize bilgi verebilirsiniz:
            </p>
            <div className="mt-3 space-y-2 text-sm text-primary-700">
              <p className="flex items-center gap-2">
                <Mail size={16} />
                <a href={`mailto:${CONTACT.email}`} className="font-medium underline">
                  {CONTACT.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} />
                <span className="font-medium">{CONTACT.phone}</span>
              </p>
            </div>
          </section>

          {/* Kişisel Verilerin Korunması Linki */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900">Kişisel Verilerin Korunması</h2>
            <p className="text-sm text-dark-600">
              Kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında detaylı
              bilgi için{" "}
              <a href="/kvkk" className="font-medium text-primary-600 underline">
                KVKK Aydınlatma Metni
              </a>{" "}
              ve{" "}
              <a href="/gizlilik" className="font-medium text-primary-600 underline">
                Gizlilik Politikası
              </a>{" "}
              sayfalarımızı inceleyebilirsiniz.
            </p>
          </section>

          <p className="text-center text-xs text-dark-400">Son güncelleme: Mart 2026</p>
        </div>
      </div>
    </div>
  );
}
