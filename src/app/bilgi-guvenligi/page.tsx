import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { SITE_URL, CONTACT } from "@/lib/constants";
import {
  ShieldCheck,
  Lock,
  Server,
  Eye,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Bilgi Güvenliği Politikası",
  description:
    "Fiyatcim.com bilgi güvenliği politikası. Verilerinizin korunması için aldığımız teknik ve idari tedbirleri öğrenin.",
  alternates: { canonical: `${SITE_URL}/bilgi-guvenligi` },
};

const PRINCIPLES = [
  {
    icon: Lock,
    title: "Gizlilik",
    desc: "Bilgiye yalnızca yetkili kişilerin erişmesini sağlarız. Tüm kullanıcı verileri şifrelenerek saklanır.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    icon: CheckCircle,
    title: "Bütünlük",
    desc: "Verilerin doğruluğunu ve tutarlılığını koruruz. Yetkisiz değişikliklere karşı önlem alırız.",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  {
    icon: RefreshCw,
    title: "Erişilebilirlik",
    desc: "Yetkili kullanıcıların bilgiye her zaman erişebilmesini garanti ederiz. Sistemlerimiz 7/24 izlenir.",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
];

const MEASURES = [
  {
    category: "Teknik Tedbirler",
    icon: Server,
    items: [
      "256-bit SSL/TLS şifreleme ile güvenli veri iletimi",
      "Güvenlik duvarı (Firewall) ve saldırı tespit sistemleri (IDS/IPS)",
      "Düzenli güvenlik açığı taramaları ve penetrasyon testleri",
      "Veritabanı şifreleme ve erişim kontrolü",
      "Otomatik yedekleme ve felaket kurtarma planları",
      "DDoS koruma ve CDN altyapısı",
      "PCI DSS uyumlu ödeme altyapısı",
    ],
  },
  {
    category: "İdari Tedbirler",
    icon: Users,
    items: [
      "Bilgi güvenliği farkındalık eğitimleri",
      "Erişim yetkilendirme ve rol tabanlı kontrol politikaları",
      "Gizlilik sözleşmeleri ve veri işleme anlaşmaları",
      "Düzenli iç denetim ve değerlendirme süreçleri",
      "Olay müdahale prosedürleri",
      "Tedarikçi güvenlik değerlendirmesi",
    ],
  },
];

export default function BilgiGuvenligiPage() {
  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Bilgi Güvenliği Politikası" }]} />
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-dark-800 to-dark-900 py-10">
        <div className="container mx-auto px-4 text-center text-white">
          <ShieldCheck size={48} className="mx-auto mb-3 text-green-400" />
          <h1 className="text-3xl font-extrabold">Bilgi Güvenliği Politikası</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-dark-300">
            Fiyatcim.com olarak müşterilerimizin ve iş ortaklarımızın bilgi varlıklarını en
            üst düzeyde korumayı taahhüt ederiz.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Temel İlkeler */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-dark-900">Temel Güvenlik İlkelerimiz</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className={`rounded-xl border ${p.border} ${p.bg} p-5 text-center`}
                >
                  <p.icon size={32} className={`mx-auto mb-2 ${p.color}`} />
                  <h3 className="text-sm font-bold text-dark-900">{p.title}</h3>
                  <p className="mt-1 text-xs text-dark-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Amaç ve Kapsam */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-3 text-lg font-bold text-dark-900">Amaç ve Kapsam</h2>
            <p className="text-sm leading-relaxed text-dark-600">
              Bu politika, Fiyatcim.com&apos;un sahip olduğu, işlediği veya eriştiği tüm bilgi
              varlıklarının korunmasını amaçlar. Politika; tüm çalışanları, iş ortaklarını,
              tedarikçileri ve Fiyatcim bilgi sistemlerine erişimi olan tüm tarafları kapsar.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-dark-600">
              Bilgi güvenliği yönetim sistemimiz; uluslararası standartlar ve ulusal
              mevzuat doğrultusunda tasarlanmış olup sürekli iyileştirme prensibiyle yönetilir.
            </p>
          </section>

          {/* Teknik & İdari Tedbirler */}
          {MEASURES.map((m) => (
            <section key={m.category} className="rounded-xl border border-dark-100 bg-white p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900">
                <m.icon size={20} className="text-primary-600" />
                {m.category}
              </h2>
              <ul className="space-y-2">
                {m.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Ödeme Güvenliği */}
          <section className="rounded-xl border border-green-200 bg-green-50 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-green-800">
              <Lock size={20} />
              Ödeme Güvenliği
            </h2>
            <p className="text-sm text-green-700">
              Fiyatcim.com&apos;da tüm ödeme işlemleri PCI DSS uyumlu altyapı üzerinden
              gerçekleştirilir. Kredi kartı bilgileriniz hiçbir zaman sunucularımızda saklanmaz;
              tüm işlemler bankalar arası güvenli ödeme ağı üzerinden şifreli olarak iletilir.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["SSL Şifreleme", "3D Secure", "PCI DSS", "Güvenli Ödeme"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  {badge}
                </span>
              ))}
            </div>
          </section>

          {/* Güvenlik İhlali */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900">
              <AlertTriangle size={20} className="text-orange-500" />
              Güvenlik İhlali Bildirimi
            </h2>
            <p className="text-sm text-dark-600">
              Olası bir güvenlik ihlali tespit edilmesi halinde; ilgili kişiler ve KVKK uyarınca
              Kişisel Verileri Koruma Kurulu en kısa sürede bilgilendirilir. İhlalin etkilerini
              azaltmak için derhal müdahale planı devreye alınır.
            </p>
          </section>

          {/* İletişim */}
          <section className="rounded-xl border border-dark-100 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-dark-900">
              <Eye size={20} className="text-primary-600" />
              Politika Güncellemeleri ve İletişim
            </h2>
            <p className="text-sm text-dark-600">
              Bu politika düzenli olarak gözden geçirilir ve gerektiğinde güncellenir.
              Güncellemeler web sitemiz üzerinden duyurulur. Bilgi güvenliği ile ilgili
              sorularınız için{" "}
              <a href={`mailto:${CONTACT.email}`} className="font-medium text-primary-600 underline">
                {CONTACT.email}
              </a>{" "}
              adresinden bize ulaşabilirsiniz.
            </p>
          </section>

          <p className="text-center text-xs text-dark-400">Son güncelleme: Mart 2026</p>
        </div>
      </div>
    </div>
  );
}
