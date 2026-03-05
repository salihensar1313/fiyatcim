"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Truck, FileText, MapPin, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useAddresses } from "@/context/AddressContext";
import { formatPrice, formatUSD } from "@/lib/utils";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getShipping, getTotal, discount, couponCode, clearCart } = useCart();
  const { user, isLoading } = useAuth();
  const { createOrder } = useOrders();
  const { addresses } = useAddresses();

  const userAddresses = addresses.filter((a) => a.user_id === user?.id);

  const [step, setStep] = useState<"address" | "payment">("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [address, setAddress] = useState({
    ad: "", soyad: "", telefon: "905", il: "", ilce: "", adres: "", posta_kodu: "",
  });
  const [addressAttempted, setAddressAttempted] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  // G7: Checkout agreements — tümü default false
  const [agreeSales, setAgreeSales] = useState(false);
  const [agreePreInfo, setAgreePreInfo] = useState(false);
  const [agreeKVKK, setAgreeKVKK] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const allMandatoryAgreed = agreeSales && agreePreInfo && agreeKVKK && agreeTerms;

  const isAddressValid =
    address.ad.trim() &&
    address.soyad.trim() &&
    address.telefon.length >= 12 &&
    address.il &&
    address.ilce.trim() &&
    address.adres.trim();

  const handleAddressSubmit = () => {
    setAddressAttempted(true);
    if (!isAddressValid) return;
    setStep("payment");
  };

  // G3: Hydration-safe redirect — render body'de router.push YASAK
  useEffect(() => {
    if (!isLoading && !user) router.push("/giris");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (items.length === 0 && !orderCompleted) router.push("/sepet");
  }, [items, router, orderCompleted]);

  if (isLoading || !user || (items.length === 0 && !orderCompleted)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const total = getTotal();

  return (
    <div className="bg-dark-50 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Sepet", href: "/sepet" }, { label: "Ödeme" }]} />
      </div>

      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-2xl font-bold text-dark-900">Ödeme</h1>

        {/* Steps */}
        <div className="mb-8 flex items-center gap-4">
          {[
            { key: "address" as const, label: "Adres", icon: Truck },
            { key: "payment" as const, label: "Ödeme", icon: CreditCard },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-8 bg-dark-200" />}
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                step === s.key ? "bg-primary-600 text-white" : "bg-dark-100 text-dark-500"
              }`}>
                <s.icon size={16} />
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "address" && (
              <div className="space-y-4">
                {/* Kayıtlı Adresler */}
                {userAddresses.length > 0 && (
                  <div className="rounded-xl border border-dark-100 bg-white p-6">
                    <h2 className="mb-4 text-lg font-bold text-dark-900">Kayıtlı Adreslerim</h2>
                    <div className="space-y-3">
                      {userAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                            selectedAddressId === addr.id
                              ? "border-primary-600 bg-primary-50"
                              : "border-dark-100 hover:border-dark-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => {
                              setSelectedAddressId(addr.id);
                              setShowManualForm(false);
                              setAddress({
                                ad: addr.ad,
                                soyad: addr.soyad,
                                telefon: addr.telefon,
                                il: addr.il,
                                ilce: addr.ilce,
                                adres: addr.adres,
                                posta_kodu: addr.posta_kodu,
                              });
                            }}
                            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-primary-600" />
                              <span className="text-sm font-semibold text-dark-900">{addr.baslik}</span>
                            </div>
                            <p className="mt-1 text-sm text-dark-600">
                              {addr.ad} {addr.soyad}
                            </p>
                            <p className="text-sm text-dark-500">
                              {addr.adres}, {addr.ilce}/{addr.il}
                            </p>
                          </div>
                        </label>
                      ))}

                      {/* Yeni adres ile devam et */}
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                          showManualForm
                            ? "border-primary-600 bg-primary-50"
                            : "border-dark-100 hover:border-dark-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved-address"
                          checked={showManualForm}
                          onChange={() => {
                            setSelectedAddressId(null);
                            setShowManualForm(true);
                            setAddress({ ad: "", soyad: "", telefon: "905", il: "", ilce: "", adres: "", posta_kodu: "" });
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <Plus size={16} className="text-primary-600" />
                        <span className="text-sm font-medium text-dark-700">Farklı bir adrese gönder</span>
                      </label>
                    </div>

                    {/* Seçili adresle devam */}
                    {selectedAddressId && !showManualForm && (
                      <button
                        onClick={() => setStep("payment")}
                        className="mt-4 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
                      >
                        Ödemeye Geç
                      </button>
                    )}
                  </div>
                )}

                {/* Manuel Adres Formu */}
                {(userAddresses.length === 0 || showManualForm) && (
                  <div className="rounded-xl border border-dark-100 bg-white p-6">
                    <h2 className="mb-4 text-lg font-bold text-dark-900">Teslimat Adresi</h2>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700">Ad <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.ad}
                            onChange={(e) => setAddress({ ...address, ad: e.target.value })}
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.ad.trim() ? "border-red-400" : "border-dark-200"}`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700">Soyad <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.soyad}
                            onChange={(e) => setAddress({ ...address, soyad: e.target.value })}
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.soyad.trim() ? "border-red-400" : "border-dark-200"}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dark-700">Telefon <span className="text-primary-600">*</span></label>
                        <input
                          type="tel" required
                          value={address.telefon.replace(/(\d{2})(\d{3})(\d{0,3})(\d{0,2})(\d{0,2})/, (_m, a, b, c, d, e) => [a, b, c, d, e].filter(Boolean).join(" "))}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            if (raw.length < 3 || !raw.startsWith("905")) return;
                            if (raw.length <= 12) setAddress({ ...address, telefon: raw });
                          }}
                          placeholder="90 5XX XXX XX XX"
                          inputMode="numeric"
                          maxLength={16}
                          className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && address.telefon.length < 12 ? "border-red-400" : "border-dark-200"}`}
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700">İl <span className="text-primary-600">*</span></label>
                          <select
                            required value={address.il}
                            onChange={(e) => setAddress({ ...address, il: e.target.value, ilce: "" })}
                            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.il ? "border-red-400" : "border-dark-200"}`}
                          >
                            <option value="">İl Seçin</option>
                            {["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"].map((il) => (
                              <option key={il} value={il}>{il}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700">İlçe <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.ilce}
                            onChange={(e) => setAddress({ ...address, ilce: e.target.value })}
                            placeholder="İlçe yazın"
                            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.ilce.trim() ? "border-red-400" : "border-dark-200"}`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700">Posta Kodu</label>
                          <input
                            type="text" value={address.posta_kodu}
                            onChange={(e) => setAddress({ ...address, posta_kodu: e.target.value })}
                            className="w-full rounded-lg border border-dark-200 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dark-700">Adres <span className="text-primary-600">*</span></label>
                        <textarea
                          rows={3} required value={address.adres}
                          onChange={(e) => setAddress({ ...address, adres: e.target.value })}
                          placeholder="Mahalle, sokak, bina no, daire no..."
                          className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.adres.trim() ? "border-red-400" : "border-dark-200"}`}
                        />
                      </div>

                      {addressAttempted && !isAddressValid && (
                        <p className="text-sm text-red-600">
                          Lütfen zorunlu (*) alanların tamamını doldurun.
                        </p>
                      )}

                      <button
                        onClick={handleAddressSubmit}
                        className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
                      >
                        Ödemeye Geç
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-xl border border-dark-100 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-dark-900">Ödeme Yöntemi</h2>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-blue-600" />
                    <p className="text-sm font-medium text-blue-700">Demo Modu</p>
                  </div>
                  <p className="mt-1 text-sm text-blue-600">
                    Ödeme sistemi (iyzico/PayTR) entegre edildikten sonra aktif olacaktır.
                    Şu an demo modundadır.
                  </p>
                </div>
                {/* G7: Zorunlu Sözleşme Onayları */}
                <div className="mt-6 space-y-2">
                  <h3 className="mb-2 text-sm font-bold text-dark-900">Sözleşme Onayları</h3>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 p-2.5 text-sm transition-colors hover:bg-dark-50">
                    <input type="checkbox" checked={agreeSales} onChange={(e) => setAgreeSales(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700">
                      <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="font-medium text-primary-600 hover:underline">Mesafeli Satış Sözleşmesi</Link>
                      {"\u2019"}ni okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 p-2.5 text-sm transition-colors hover:bg-dark-50">
                    <input type="checkbox" checked={agreePreInfo} onChange={(e) => setAgreePreInfo(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700">
                      <Link href="/on-bilgilendirme" target="_blank" className="font-medium text-primary-600 hover:underline">Ön Bilgilendirme Formu</Link>
                      {"\u2019"}nu okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 p-2.5 text-sm transition-colors hover:bg-dark-50">
                    <input type="checkbox" checked={agreeKVKK} onChange={(e) => setAgreeKVKK(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700">
                      <Link href="/kvkk" target="_blank" className="font-medium text-primary-600 hover:underline">KVKK Aydınlatma Metni</Link>
                      {"\u2019"}ni okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 p-2.5 text-sm transition-colors hover:bg-dark-50">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700">
                      <Link href="/kullanim-kosullari" target="_blank" className="font-medium text-primary-600 hover:underline">Kullanım Koşulları</Link>
                      {"\u2019"}nı okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 p-2.5 text-sm transition-colors hover:bg-dark-50">
                    <input type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700">
                      Kampanya ve indirimlerden haberdar olmak istiyorum. <span className="text-dark-400">(Opsiyonel)</span>
                    </span>
                  </label>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setStep("address")}
                    className="rounded-lg border border-dark-200 px-6 py-3 text-sm font-semibold text-dark-700 hover:bg-dark-50"
                  >
                    Geri
                  </button>
                  <button
                    disabled={!allMandatoryAgreed}
                    onClick={() => {
                      const order = createOrder({
                        items,
                        shippingAddress: address,
                        billingAddress: address,
                        user: user ? { id: user.id, email: user.email } : null,
                        customerName: { ad: address.ad, soyad: address.soyad },
                        subtotal,
                        shipping,
                        discount,
                        total,
                        couponCode,
                      });
                      setOrderCompleted(true);
                      clearCart();
                      router.push(`/siparis-basarili?order=${order.order_no}`);
                    }}
                    className="flex-1 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Siparişi Tamamla (Demo)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-24 rounded-xl border border-dark-100 bg-white p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-dark-900">
                <FileText size={18} />
                Sipariş Özeti
              </h3>

              <div className="space-y-3 border-b border-dark-100 pb-4">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-dark-600">
                      {item.product?.name} <span className="text-dark-400">x{item.qty}</span>
                    </span>
                    <div className="shrink-0 text-right">
                      <span className="font-medium text-dark-900">
                        {item.product && formatUSD((item.product.sale_price_usd || item.product.price_usd) * item.qty)}
                      </span>
                      <span className="ml-1.5 text-xs text-primary-600">
                        {item.product && formatPrice((item.product.sale_price || item.product.price) * item.qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Ara Toplam</span>
                  <span className="text-dark-900">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">İndirim</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">Kargo</span>
                  <span className="text-dark-900">
                    {shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500">KDV (%20 dahil)</span>
                  <span className="text-dark-900">{formatPrice(total - total / 1.2)}</span>
                </div>
                <div className="flex justify-between border-t border-dark-100 pt-2">
                  <span className="font-bold text-dark-900">Toplam (KDV Dahil)</span>
                  <span className="text-lg font-bold text-dark-900">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
