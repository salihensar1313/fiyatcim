"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Truck, FileText, MapPin, Plus, Smartphone, LogIn, UserX, Building2, User } from "lucide-react";
import type { InvoiceType } from "@/types";
import SmsOtpVerify from "@/components/ui/SmsOtpVerify";
import CartRecommendations from "@/components/product/CartRecommendations";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/context/OrderContext";
import { useAddresses } from "@/context/AddressContext";
import { formatPrice, formatUSD } from "@/lib/utils";
import { TURKISH_PROVINCES } from "@/lib/constants";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getShipping, getTotal, discount, couponCode, clearCart, isCartLoaded } = useCart();
  const { user, isLoading } = useAuth();
  const { createOrder } = useOrders();
  const { addresses } = useAddresses();

  const userAddresses = user ? addresses.filter((a) => a.user_id === user.id) : [];

  const [step, setStep] = useState<"address" | "sms" | "payment">("address");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [address, setAddress] = useState({
    ad: "", soyad: "", telefon: "905", il: "", ilce: "", adres: "", posta_kodu: "",
  });
  const [addressAttempted, setAddressAttempted] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  // G7: Checkout agreements — tümü default false
  const [agreeSales, setAgreeSales] = useState(false);
  const [agreePreInfo, setAgreePreInfo] = useState(false);
  const [agreeKVKK, setAgreeKVKK] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ticari fatura
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>("kurumsal");
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    tcKimlik: "",
    fullName: "",
  });
  const [invoiceAttempted, setInvoiceAttempted] = useState(false);

  const allMandatoryAgreed = agreeSales && agreePreInfo && agreeKVKK && agreeTerms;

  const isAddressValid =
    address.ad.trim() &&
    address.soyad.trim() &&
    address.telefon.length >= 12 &&
    address.il &&
    address.ilce.trim() &&
    address.adres.trim();

  const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const isInvoiceValid = !wantsInvoice || (
    invoiceType === "kurumsal"
      ? invoiceInfo.companyName.trim() && invoiceInfo.taxOffice.trim() && /^\d{10}$/.test(invoiceInfo.taxNumber)
      : invoiceInfo.fullName.trim() && /^\d{11}$/.test(invoiceInfo.tcKimlik)
  );

  const handleAddressSubmit = () => {
    setAddressAttempted(true);
    if (wantsInvoice) setInvoiceAttempted(true);
    if (!isAddressValid || !isInvoiceValid) return;
    setStep(IS_DEMO ? "sms" : "payment");
  };

  const buildInvoiceInfo = () =>
    wantsInvoice
      ? {
          wantsInvoice: true as const,
          invoiceType,
          ...(invoiceType === "kurumsal"
            ? { companyName: invoiceInfo.companyName, taxOffice: invoiceInfo.taxOffice, taxNumber: invoiceInfo.taxNumber }
            : { fullName: invoiceInfo.fullName, tcKimlik: invoiceInfo.tcKimlik }),
        }
      : undefined;

  // Redirect to cart only when both auth and cart are fully loaded and cart is empty
  useEffect(() => {
    if (isLoading || !isCartLoaded) return; // Wait for both to settle
    if (items.length === 0 && !orderCompleted) router.push("/sepet");
  }, [items, router, orderCompleted, isCartLoaded, isLoading]);

  if (isLoading || !isCartLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Misafir checkout veya giriş seçimi
  if (!user && !guestMode) {
    return (
      <div className="bg-dark-50 dark:bg-dark-900 pb-16">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb items={[{ label: "Sepet", href: "/sepet" }, { label: "Ödeme" }]} />
        </div>
        <div className="container mx-auto flex justify-center px-4">
          <div className="w-full max-w-lg space-y-4">
            <h1 className="text-center text-2xl font-bold text-dark-900 dark:text-dark-50">Nasıl devam etmek istersiniz?</h1>
            <p className="text-center text-sm text-dark-500 dark:text-dark-400">Sipariş vermek için giriş yapabilir veya misafir olarak devam edebilirsiniz.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/giris?redirect=/odeme"
                className="flex flex-col items-center gap-3 rounded-xl border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-6 text-center transition-all hover:border-primary-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <LogIn size={22} className="text-primary-600" />
                </div>
                <span className="text-base font-bold text-dark-900 dark:text-dark-50">Giriş Yap</span>
                <span className="text-xs text-dark-500 dark:text-dark-400">Siparişlerinizi takip edin, adreslerinizi kaydedin</span>
              </Link>

              <button
                onClick={() => setGuestMode(true)}
                className="flex flex-col items-center gap-3 rounded-xl border border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-6 text-center transition-all hover:border-primary-400 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dark-100 dark:bg-dark-700">
                  <UserX size={22} className="text-dark-500 dark:text-dark-400" />
                </div>
                <span className="text-base font-bold text-dark-900 dark:text-dark-50">Misafir Olarak Devam Et</span>
                <span className="text-xs text-dark-500 dark:text-dark-400">Hesap oluşturmadan hızlıca sipariş verin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderCompleted) {
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
    <div className="bg-dark-50 dark:bg-dark-900 pb-16">
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[{ label: "Sepet", href: "/sepet" }, { label: "Ödeme" }]} />
      </div>

      <div className="container mx-auto px-4">
        <h1 className="mb-6 text-2xl font-bold text-dark-900 dark:text-dark-50">Ödeme</h1>

        {/* Steps */}
        <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4">
          {(IS_DEMO
            ? [
                { key: "address" as const, label: "Adres", icon: Truck },
                { key: "sms" as const, label: "SMS", icon: Smartphone },
                { key: "payment" as const, label: "Ödeme", icon: CreditCard },
              ]
            : [
                { key: "address" as const, label: "Adres", icon: Truck },
                { key: "payment" as const, label: "Ödeme", icon: CreditCard },
              ]
          ).map((s, i, arr) => {
            const stepOrder = arr.map((x) => x.key);
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = stepOrder.indexOf(s.key);
            const isActive = thisIdx <= currentIdx;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-4 bg-dark-200 dark:bg-dark-600 sm:w-8" />}
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium sm:px-4 ${
                  isActive ? "bg-primary-600 text-white" : "bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400"
                }`}>
                  <s.icon size={16} />
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === "address" && (
              <div className="space-y-4">
                {/* Kayıtlı Adresler */}
                {userAddresses.length > 0 && (
                  <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                    <h2 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Kayıtlı Adreslerim</h2>
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
                              <span className="text-sm font-semibold text-dark-900 dark:text-dark-50">{addr.baslik}</span>
                            </div>
                            <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                              {addr.ad} {addr.soyad}
                            </p>
                            <p className="text-sm text-dark-500 dark:text-dark-400">
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
                        <span className="text-sm font-medium text-dark-700 dark:text-dark-200">Farklı bir adrese gönder</span>
                      </label>
                    </div>

                    {/* Seçili adresle devam */}
                    {selectedAddressId && !showManualForm && (
                      <button
                        onClick={() => setStep(IS_DEMO ? "sms" : "payment")}
                        className="mt-4 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700"
                      >
                        Devam Et
                      </button>
                    )}
                  </div>
                )}

                {/* Manuel Adres Formu */}
                {(userAddresses.length === 0 || showManualForm) && (
                  <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                    <h2 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Teslimat Adresi</h2>
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ad <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.ad}
                            onChange={(e) => setAddress({ ...address, ad: e.target.value })}
                            className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${addressAttempted && !address.ad.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Soyad <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.soyad}
                            onChange={(e) => setAddress({ ...address, soyad: e.target.value })}
                            className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${addressAttempted && !address.soyad.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Telefon <span className="text-primary-600">*</span></label>
                        <div className="flex">
                          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-dark-200 dark:border-dark-600 bg-dark-50 dark:bg-dark-600 px-3 text-sm font-medium text-dark-500 dark:text-dark-300">+90</span>
                          <input
                            type="tel" required
                            value={address.telefon.slice(2)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                              setAddress({ ...address, telefon: "90" + raw });
                            }}
                            placeholder="05XX XXX XX XX"
                            inputMode="numeric"
                            maxLength={10}
                            className={`w-full rounded-r-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${addressAttempted && address.telefon.length < 12 ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İl <span className="text-primary-600">*</span></label>
                          <select
                            required value={address.il}
                            onChange={(e) => setAddress({ ...address, il: e.target.value, ilce: "" })}
                            className={`w-full rounded-lg border dark:bg-dark-800 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none ${addressAttempted && !address.il ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                          >
                            <option value="">İl Seçin</option>
                            {TURKISH_PROVINCES.map((il) => (
                              <option key={il} value={il}>{il}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">İlçe <span className="text-primary-600">*</span></label>
                          <input
                            type="text" required value={address.ilce}
                            onChange={(e) => setAddress({ ...address, ilce: e.target.value })}
                            placeholder="İlçe yazın"
                            className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${addressAttempted && !address.ilce.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Posta Kodu</label>
                          <input
                            type="text" value={address.posta_kodu}
                            onChange={(e) => setAddress({ ...address, posta_kodu: e.target.value })}
                            className="w-full rounded-lg border border-dark-200 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Adres <span className="text-primary-600">*</span></label>
                        <textarea
                          rows={3} required value={address.adres}
                          onChange={(e) => setAddress({ ...address, adres: e.target.value })}
                          placeholder="Mahalle, sokak, bina no, daire no..."
                          className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${addressAttempted && !address.adres.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"}`}
                        />
                      </div>

                      {/* Ticari Fatura */}
                      <div className="rounded-lg border border-dark-100 dark:border-dark-700 p-4">
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={wantsInvoice}
                            onChange={(e) => {
                              setWantsInvoice(e.target.checked);
                              if (!e.target.checked) setInvoiceAttempted(false);
                            }}
                            className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-primary-600" />
                            <span className="text-sm font-medium text-dark-900 dark:text-dark-50">Ticari Fatura İstiyorum</span>
                          </div>
                        </label>

                        {wantsInvoice && (
                          <div className="mt-4 space-y-4">
                            {/* Fatura Tipi Seçimi */}
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => setInvoiceType("kurumsal")}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                                  invoiceType === "kurumsal"
                                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                                    : "border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:border-dark-300"
                                }`}
                              >
                                <Building2 size={16} />
                                Kurumsal
                              </button>
                              <button
                                type="button"
                                onClick={() => setInvoiceType("bireysel")}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                                  invoiceType === "bireysel"
                                    ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                                    : "border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:border-dark-300"
                                }`}
                              >
                                <User size={16} />
                                Bireysel
                              </button>
                            </div>

                            {invoiceType === "kurumsal" ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Şirket Ünvanı <span className="text-primary-600">*</span></label>
                                  <input
                                    type="text"
                                    value={invoiceInfo.companyName}
                                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, companyName: e.target.value })}
                                    placeholder="Örn: ABC Güvenlik Ltd. Şti."
                                    className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${
                                      invoiceAttempted && !invoiceInfo.companyName.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"
                                    }`}
                                  />
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Vergi Dairesi <span className="text-primary-600">*</span></label>
                                    <input
                                      type="text"
                                      value={invoiceInfo.taxOffice}
                                      onChange={(e) => setInvoiceInfo({ ...invoiceInfo, taxOffice: e.target.value })}
                                      placeholder="Örn: Adapazarı"
                                      className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${
                                        invoiceAttempted && !invoiceInfo.taxOffice.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Vergi No <span className="text-primary-600">*</span></label>
                                    <input
                                      type="text"
                                      value={invoiceInfo.taxNumber}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                        setInvoiceInfo({ ...invoiceInfo, taxNumber: val });
                                      }}
                                      placeholder="10 haneli vergi no"
                                      inputMode="numeric"
                                      maxLength={10}
                                      className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${
                                        invoiceAttempted && !/^\d{10}$/.test(invoiceInfo.taxNumber) ? "border-red-400" : "border-dark-200 dark:border-dark-600"
                                      }`}
                                    />
                                    {invoiceAttempted && invoiceInfo.taxNumber && !/^\d{10}$/.test(invoiceInfo.taxNumber) && (
                                      <p className="mt-1 text-xs text-red-500">Vergi no 10 haneli olmalıdır</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">Ad Soyad <span className="text-primary-600">*</span></label>
                                  <input
                                    type="text"
                                    value={invoiceInfo.fullName}
                                    onChange={(e) => setInvoiceInfo({ ...invoiceInfo, fullName: e.target.value })}
                                    placeholder="Fatura üzerinde görünecek ad soyad"
                                    className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${
                                      invoiceAttempted && !invoiceInfo.fullName.trim() ? "border-red-400" : "border-dark-200 dark:border-dark-600"
                                    }`}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-dark-700 dark:text-dark-200">TC Kimlik No <span className="text-primary-600">*</span></label>
                                  <input
                                    type="text"
                                    value={invoiceInfo.tcKimlik}
                                    onChange={(e) => {
                                      const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                                      setInvoiceInfo({ ...invoiceInfo, tcKimlik: val });
                                    }}
                                    placeholder="11 haneli TC kimlik no"
                                    inputMode="numeric"
                                    maxLength={11}
                                    className={`w-full rounded-lg border dark:bg-dark-700 dark:text-dark-100 px-4 py-2.5 text-sm focus:border-primary-600 focus:outline-none dark:placeholder:text-dark-400 ${
                                      invoiceAttempted && !/^\d{11}$/.test(invoiceInfo.tcKimlik) ? "border-red-400" : "border-dark-200 dark:border-dark-600"
                                    }`}
                                  />
                                  {invoiceAttempted && invoiceInfo.tcKimlik && !/^\d{11}$/.test(invoiceInfo.tcKimlik) && (
                                    <p className="mt-1 text-xs text-red-500">TC kimlik no 11 haneli olmalıdır</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {addressAttempted && !isAddressValid && (
                        <p className="text-sm text-red-600">
                          Lütfen zorunlu (*) alanların tamamını doldurun.
                        </p>
                      )}
                      {invoiceAttempted && !isInvoiceValid && (
                        <p className="text-sm text-red-600">
                          Lütfen fatura bilgilerini eksiksiz doldurun.
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

            {step === "sms" && (
              <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <SmsOtpVerify
                  phone={address.telefon}
                  onVerified={() => setStep("payment")}
                  onBack={() => setStep("address")}
                />
              </div>
            )}

            {step === "payment" && (
              <div className="rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
                <h2 className="mb-4 text-lg font-bold text-dark-900 dark:text-dark-50">Ödeme Yöntemi</h2>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4">
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
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-dark-900 dark:text-dark-50">Sözleşme Onayları</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (allMandatoryAgreed) {
                          setAgreeSales(false);
                          setAgreePreInfo(false);
                          setAgreeKVKK(false);
                          setAgreeTerms(false);
                        } else {
                          setAgreeSales(true);
                          setAgreePreInfo(true);
                          setAgreeKVKK(true);
                          setAgreeTerms(true);
                        }
                      }}
                      className="text-xs font-medium text-primary-600 hover:underline"
                    >
                      {allMandatoryAgreed ? "Tüm Seçimleri Kaldır" : "Zorunlu Sözleşmeleri Onayla"}
                    </button>
                  </div>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 dark:border-dark-700 p-2.5 text-sm transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                    <input type="checkbox" checked={agreeSales} onChange={(e) => setAgreeSales(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700 dark:text-dark-200">
                      <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="font-medium text-primary-600 hover:underline">Mesafeli Satış Sözleşmesi</Link>
                      {"\u2019"}ni okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 dark:border-dark-700 p-2.5 text-sm transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                    <input type="checkbox" checked={agreePreInfo} onChange={(e) => setAgreePreInfo(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700 dark:text-dark-200">
                      <Link href="/on-bilgilendirme" target="_blank" className="font-medium text-primary-600 hover:underline">Ön Bilgilendirme Formu</Link>
                      {"\u2019"}nu okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 dark:border-dark-700 p-2.5 text-sm transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                    <input type="checkbox" checked={agreeKVKK} onChange={(e) => setAgreeKVKK(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700 dark:text-dark-200">
                      <Link href="/kvkk" target="_blank" className="font-medium text-primary-600 hover:underline">KVKK Aydınlatma Metni</Link>
                      {"\u2019"}ni okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 dark:border-dark-700 p-2.5 text-sm transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                    <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700 dark:text-dark-200">
                      <Link href="/kullanim-kosullari" target="_blank" className="font-medium text-primary-600 hover:underline">Kullanım Koşulları</Link>
                      {"\u2019"}nı okudum ve kabul ediyorum. <span className="text-primary-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 rounded-lg border border-dark-100 dark:border-dark-700 p-2.5 text-sm transition-colors hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800">
                    <input type="checkbox" checked={agreeMarketing} onChange={(e) => setAgreeMarketing(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-dark-700 dark:text-dark-200">
                      Kampanya ve indirimlerden haberdar olmak istiyorum. <span className="text-dark-500">(Opsiyonel)</span>
                    </span>
                  </label>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setStep(IS_DEMO ? "sms" : "address")}
                    className="rounded-lg border border-dark-200 dark:border-dark-600 px-6 py-3 text-sm font-semibold text-dark-700 dark:text-dark-200 hover:bg-dark-50 dark:hover:bg-dark-700 dark:bg-dark-800"
                  >
                    Geri
                  </button>
                  <button
                    disabled={!allMandatoryAgreed || isSubmitting}
                    onClick={async () => {
                      if (isSubmitting) return;
                      setIsSubmitting(true);
                      try {
                        const safeTotal = Math.max(0, total);
                        const order = await createOrder({
                          items,
                          shippingAddress: address,
                          billingAddress: address,
                          user: user ? { id: user.id, email: user.email } : null,
                          customerName: { ad: address.ad, soyad: address.soyad },
                          subtotal,
                          shipping,
                          discount,
                          total: safeTotal,
                          couponCode,
                          invoiceInfo: buildInvoiceInfo(),
                        });
                        // Kampanya mail listesine kaydet
                        if (agreeMarketing && user?.email) {
                          fetch("/api/newsletter", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: user.email, source: "checkout" }),
                          }).catch(() => {});
                        }
                        setOrderCompleted(true);
                        clearCart();
                        router.push(`/siparis-basarili?order=${order.order_no}`);
                      } catch {
                        setIsSubmitting(false);
                      }
                    }}
                    className="flex-1 rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Sipariş oluşturuluyor..." : "Siparişi Tamamla (Demo)"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary — sağ kolonda, sticky, her zaman üstte */}
          <div className="lg:row-start-1 lg:col-start-3">
            <div className="sticky top-24 rounded-xl border border-dark-100 bg-white dark:border-dark-700 dark:bg-dark-800 p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-dark-900 dark:text-dark-50">
                <FileText size={18} />
                Sipariş Özeti
              </h3>

              <div className="space-y-3 border-b border-dark-100 pb-4">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-dark-600 dark:text-dark-300">
                      {item.product?.name} <span className="text-dark-500">x{item.qty}</span>
                    </span>
                    <div className="shrink-0 text-right">
                      <span className="font-medium text-dark-900 dark:text-dark-50">
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
                  <span className="text-dark-500 dark:text-dark-400">Ara Toplam</span>
                  <span className="text-dark-900 dark:text-dark-50">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">İndirim</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500 dark:text-dark-400">Kargo</span>
                  <span className="text-dark-900 dark:text-dark-50">
                    {shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-500 dark:text-dark-400">KDV (%20 dahil)</span>
                  <span className="text-dark-900 dark:text-dark-50">{formatPrice(total - total / 1.2)}</span>
                </div>
                <div className="flex justify-between border-t border-dark-100 pt-2">
                  <span className="font-bold text-dark-900 dark:text-dark-50">Toplam (KDV Dahil)</span>
                  <span className="text-lg font-bold text-dark-900 dark:text-dark-50">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Recommendations — grid dışında */}
        {step === "address" && <CartRecommendations />}
      </div>

      {/* Sticky Mobile CTA — Checkout */}
      {step === "payment" && (
        <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-dark-200 bg-white dark:border-dark-700 dark:bg-dark-800 p-3 shadow-lg lg:hidden">
          <div className="flex flex-col gap-2">
            {!allMandatoryAgreed && (
              <p className="text-center text-xs text-red-500">Devam etmek için sözleşmeleri onaylayın</p>
            )}
            <button
              disabled={!allMandatoryAgreed || isSubmitting}
              onClick={async () => {
                if (isSubmitting) return;
                setIsSubmitting(true);
                try {
                  const safeTotal = Math.max(0, total);
                  const order = await createOrder({
                    items,
                    shippingAddress: address,
                    billingAddress: address,
                    user: user ? { id: user.id, email: user.email } : null,
                    customerName: { ad: address.ad, soyad: address.soyad },
                    subtotal,
                    shipping,
                    discount,
                    total: safeTotal,
                    couponCode,
                    invoiceInfo: buildInvoiceInfo(),
                  });
                  // Kampanya mail listesine kaydet
                  if (agreeMarketing && user?.email) {
                    fetch("/api/newsletter", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user.email, source: "checkout" }),
                    }).catch(() => {});
                  }
                  setOrderCompleted(true);
                  clearCart();
                  router.push(`/siparis-basarili?order=${order.order_no}`);
                } catch {
                  setIsSubmitting(false);
                }
              }}
              className="w-full rounded-lg bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sipariş oluşturuluyor..." : `Siparişi Tamamla (${formatPrice(total)})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
