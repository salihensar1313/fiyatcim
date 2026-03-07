"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: form göndermiyoruz
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "İletişim" }]} />
      </div>

      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-center text-2xl font-bold text-dark-900 dark:text-dark-50 md:text-3xl">İletişim</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-4">
            {[
              { icon: Phone, label: "Telefon", value: CONTACT.phone },
              { icon: Mail, label: "E-posta", value: CONTACT.email },
              { icon: MapPin, label: "Adres", value: CONTACT.address },
              { icon: Clock, label: "Çalışma Saatleri", value: CONTACT.workingHours },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600">
                  <item.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-900 dark:text-dark-50">{item.label}</p>
                  <p className="mt-0.5 text-sm text-dark-600 dark:text-dark-300">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
              <h2 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Bize Yazın</h2>

              {sent ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-6 text-center">
                  <p className="font-semibold text-green-700">Mesajınız gönderildi!</p>
                  <p className="mt-1 text-sm text-green-600">En kısa sürede size dönüş yapacağız.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ad Soyad</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">E-posta</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Telefon</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Konu</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                      >
                        <option value="">Seçiniz</option>
                        <option value="satis">Satış / Sipariş</option>
                        <option value="destek">Teknik Destek</option>
                        <option value="iade">İade & Değişim</option>
                        <option value="isbirligi">İş Birliği</option>
                        <option value="diger">Diğer</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Mesajınız</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
                  >
                    <Send size={16} />
                    Gönder
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Harita ileride eklenecek */}
      </div>
    </div>
  );
}
