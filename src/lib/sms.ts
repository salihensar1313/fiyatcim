/**
 * SMS Provider Abstraction Layer
 *
 * Mevcut: Mock provider (test/gelistirme icin)
 * Uretim: NetGSM entegrasyonu icin asagidaki yorum satirlarini takip edin
 *
 * NetGSM Entegrasyonu icin:
 *   1. .env dosyasina NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER ekleyin
 *   2. NetGSMProvider sinifini aktif edin
 *   3. getProvider() fonksiyonunda NetGSMProvider'a gecin
 */

// ==========================================
// SMS PROVIDER INTERFACE
// ==========================================

export interface SMSResult {
  success: boolean;
  error?: string;
}

export interface OTPResult {
  success: boolean;
  /** Sadece mock/test modunda doner, production'da undefined */
  code?: string;
  error?: string;
}

export interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<SMSResult>;
}

// ==========================================
// OTP STORE (In-Memory — Production'da Redis kullanin)
// ==========================================

interface OTPEntry {
  code: string;
  phone: string;
  expiresAt: number;
  attempts: number;
}

/** OTP kodlarini bellekte tutar. Production'da Redis/Upstash ile degistirilmeli. */
const otpStore = new Map<string, OTPEntry>();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 dakika
const MAX_VERIFY_ATTEMPTS = 5;

/** Telefon numarasini normalize eder: +905XXXXXXXXX formatina cevirir */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+90" + cleaned.slice(1);
  } else if (cleaned.startsWith("90") && !cleaned.startsWith("+90")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+")) {
    cleaned = "+90" + cleaned;
  }
  return cleaned;
}

/** 6 haneli rastgele OTP kodu uretir */
function generateOTPCode(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/** Suresi dolmus OTP kodlarini temizler */
function cleanupExpiredOTPs(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  otpStore.forEach((entry, key) => {
    if (entry.expiresAt < now) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => otpStore.delete(key));
}

// ==========================================
// MOCK SMS PROVIDER (Test/Gelistirme)
// ==========================================

class MockSMSProvider implements SMSProvider {
  async sendSMS(phone: string, message: string): Promise<SMSResult> {
    console.log(`[MockSMS] ${phone} numarasina gonderildi: ${message}`);
    return { success: true };
  }
}

// ==========================================
// NETGSM SMS PROVIDER (Production)
// ==========================================

/*
 * NetGSM API Entegrasyonu
 *
 * .env degiskenleri:
 *   NETGSM_USERCODE=...
 *   NETGSM_PASSWORD=...
 *   NETGSM_MSGHEADER=FIYATCIM  (Baslık/alfanumerik gonderici adi)
 *
 * API Dokumantasyonu: https://www.netgsm.com.tr/dokuman/
 *
 * class NetGSMProvider implements SMSProvider {
 *   private usercode = process.env.NETGSM_USERCODE!;
 *   private password = process.env.NETGSM_PASSWORD!;
 *   private msgHeader = process.env.NETGSM_MSGHEADER || "FIYATCIM";
 *
 *   async sendSMS(phone: string, message: string): Promise<SMSResult> {
 *     try {
 *       const params = new URLSearchParams({
 *         usercode: this.usercode,
 *         password: this.password,
 *         gsmno: phone.replace("+", ""),
 *         message: message,
 *         msgheader: this.msgHeader,
 *         dil: "TR",
 *       });
 *
 *       const response = await fetch(
 *         `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`
 *       );
 *       const text = await response.text();
 *
 *       // NetGSM basarili donus kodlari: 00, 01, 02
 *       const code = text.split(" ")[0];
 *       if (["00", "01", "02"].includes(code)) {
 *         return { success: true };
 *       }
 *
 *       console.error("[NetGSM] Hata kodu:", text);
 *       return { success: false, error: `NetGSM hatasi: ${text}` };
 *     } catch (err) {
 *       console.error("[NetGSM] Baglanti hatasi:", err);
 *       return { success: false, error: "SMS gonderilemedi" };
 *     }
 *   }
 * }
 */

// ==========================================
// PROVIDER FACTORY
// ==========================================

/**
 * GÜVENLIK: Güvenli varsayılan — SMS sağlayıcısı yoksa null döner.
 * Mock provider yalnızca NODE_ENV=development'ta çalışır.
 * Production'da provider yoksa sendOTP 500 döner.
 *
 * @see claude2-detailed-security-report-2026-03-23.md — Bulgu #3
 */
function getProvider(): SMSProvider | null {
  // Production: NetGSM
  // if (process.env.NETGSM_USERCODE && process.env.NETGSM_PASSWORD) {
  //   return new NetGSMProvider();
  // }

  // Geliştirme ortamında mock provider kullan
  if (process.env.NODE_ENV === "development") {
    return new MockSMSProvider();
  }

  // Production'da SMS sağlayıcısı yoksa null — endpoint fail eder
  return null;
}

// ==========================================
// PUBLIC API
// ==========================================

/**
 * Belirtilen telefon numarasina OTP kodu gonderir.
 * Mock modda kodu console'a yazar ve response'ta dondurur.
 */
export async function sendOTP(phone: string): Promise<OTPResult> {
  try {
    cleanupExpiredOTPs();

    const normalized = normalizePhone(phone);
    const provider = getProvider();

    // GÜVENLIK: SMS sağlayıcısı yoksa endpoint fail etsin
    if (!provider) {
      console.error("[SMS] SMS saglayicisi yapilandirilmamis. OTP gonderilemez.");
      return { success: false, error: "SMS servisi su anda kullanilamamaktadir." };
    }

    const code = generateOTPCode();
    const message = `Fiyatcim.com dogrulama kodunuz: ${code} — Bu kodu kimseyle paylasmayiniz.`;

    const result = await provider.sendSMS(normalized, message);

    if (!result.success) {
      return { success: false, error: result.error || "SMS gonderilemedi" };
    }

    // OTP'yi kaydet
    otpStore.set(normalized, {
      code,
      phone: normalized,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    // GÜVENLIK: OTP kodu asla HTTP response'a eklenmez.
    // Geliştirme ortamında bile kod yalnızca console log'da görünür.
    return { success: true };
  } catch (err) {
    console.error("[SMS] OTP gonderme hatasi:", err);
    return { success: false, error: "Beklenmedik bir hata olustu" };
  }
}

/**
 * Telefon numarasina gonderilen OTP kodunu dogrular.
 * Basarili dogrulamadan sonra OTP silinir.
 */
export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  const entry = otpStore.get(normalized);

  if (!entry) {
    return false;
  }

  // Sure kontrolu
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return false;
  }

  // Deneme limiti
  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalized);
    return false;
  }

  // Kod kontrolu
  if (entry.code !== code) {
    entry.attempts += 1;
    return false;
  }

  // Basarili — OTP'yi sil
  otpStore.delete(normalized);
  return true;
}

/**
 * Belirtilen telefon icin aktif OTP var mi kontrol eder.
 * Cooldown suresi kontrolu icin kullanilir.
 */
export function hasActiveOTP(phone: string): boolean {
  const normalized = normalizePhone(phone);
  const entry = otpStore.get(normalized);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalized);
    return false;
  }
  return true;
}
