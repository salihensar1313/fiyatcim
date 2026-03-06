"use client";

import { Shield, RotateCcw, PackageCheck, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ReturnPolicyTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
        <Shield size={28} className="shrink-0 text-green-600" />
        <div>
          <h3 className="text-lg font-bold text-green-800">14 Gün İade Hakkı</h3>
          <p className="mt-0.5 text-sm text-green-700">
            Tüm ürünlerde koşulsuz iade ve değişim hakkınız bulunmaktadır.
          </p>
        </div>
      </div>

      {/* İade Koşulları */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark-900">
          <PackageCheck size={18} className="text-primary-600" />
          İade Koşulları
        </h4>
        <ul className="space-y-2 pl-7">
          {[
            "Ürün teslim tarihinden itibaren 14 gün içinde iade başvurusu yapılmalıdır.",
            "Ürün orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır.",
            "Fatura ve garanti belgesi iade paketine eklenmelidir.",
            "Kurulum yapılmış ürünlerde teknik ekip değerlendirmesi gereklidir.",
            "Aksesuarlar ve hediye ürünler eksiksiz iade edilmelidir.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-dark-600">
              <ChevronRight size={14} className="mt-0.5 shrink-0 text-primary-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* İade Süreci */}
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-dark-900">
          <RotateCcw size={18} className="text-primary-600" />
          İade Süreci
        </h4>
        <div className="space-y-3">
          {[
            { step: 1, title: "İade Başvurusu", desc: "Hesabım sayfasından veya müşteri hizmetlerini arayarak iade talebinizi oluşturun." },
            { step: 2, title: "Kargo Gönderimi", desc: "Ürünü orijinal ambalajında, fatura ile birlikte anlaşmalı kargo ile gönderin." },
            { step: 3, title: "Kontrol & Onay", desc: "Ürün tarafımıza ulaştıktan sonra 3 iş günü içinde kontrol edilir." },
            { step: 4, title: "İade / Değişim", desc: "Onay sonrası iade tutarı 5-7 iş günü içinde hesabınıza aktarılır veya değişim yapılır." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 rounded-lg border border-dark-100 bg-dark-50 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-dark-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-dark-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* İade Edilemeyen Ürünler */}
      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-800">
          <AlertTriangle size={18} className="text-orange-600" />
          İade Edilemeyen Durumlar
        </h4>
        <ul className="space-y-1.5 pl-6">
          {[
            "Ambalajı açılmış ve kullanılmış ürünler",
            "Fiziksel hasar görmüş ürünler (kullanıcı kaynaklı)",
            "14 günlük süre aşılmış iade talepleri",
            "Yazılım lisansı aktive edilmiş ürünler",
          ].map((item, i) => (
            <li key={i} className="text-xs text-orange-700">• {item}</li>
          ))}
        </ul>
      </div>

      {/* Detaylı bilgi linki */}
      <div className="text-center">
        <Link
          href="/iade-politikasi"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
        >
          Detaylı İade Politikası
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
