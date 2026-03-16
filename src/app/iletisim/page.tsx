"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
        return;
      }

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
      setErrorMsg("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
    }
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

              {status === "success" ? (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-6 text-center">
                  <CheckCircle size={40} className="mx-auto mb-3 text-green-600" />
                  <p className="font-semibold text-green-700 dark:text-green-400">Mesajınız gönderildi!</p>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-500">En kısa sürede size dönüş yapacağız.</p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-sm font-medium text-primary-600 hover:underline"
                  >
                    Yeni mesaj gönder
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === "error" && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                      {errorMsg}
                    </div>
                  )}

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
                    disabled={status === "loading"}
                    className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Gönder
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Harita */}
        <div className="mt-8 overflow-hidden rounded-xl border border-dark-100 dark:border-dark-700">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48499.97431894015!2d30.3828!3d40.6934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x409bba60daa9907b%3A0x38042db462f76f1c!2sAdapazar%C4%B1%2C%20Sakarya!5e0!3m2!1str!2str!4v1"
            width="100%"
            height="250"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Fiyatcim.com Konum"
            className="w-full h-[250px] sm:h-[350px]"
          />
        </div>
      </div>
    </div>
  );
}
