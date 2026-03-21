"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ExternalLink, Phone, Mail, Send } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { safeGetJSON, safeSetJSON } from "@/lib/safe-storage";
import { useScrollLock } from "@/hooks/useScrollLock";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface Action {
  label: string;
  icon?: "link" | "phone" | "email";
  type: "navigate" | "phone" | "email";
  href?: string;
}

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  timestamp: Date;
  actions?: Action[];
}

/* ─────────────────────────────────────────────
   Smart Chat — Keyword-based responses
   ───────────────────────────────────────────── */

interface ChatPattern {
  keywords: RegExp;
  responses: string[];
  actions?: Action[];
}

const CHAT_PATTERNS: ChatPattern[] = [
  // Selamlaşma
  {
    keywords: /\b(merhaba|selam|selamm|hey|heyy|naber|nbr|sa|selamün|slm|meraba|mrb|helo|hello|hi)\b/i,
    responses: [
      "Selamm! 😄 Hoş geldin! Nasıl yardımcı olabilirim?",
      "Heyy! 👋 CimBot burada, buyur ne lazım?",
      "Selam selam! 🤗 Söyle bakalım, bugün ne arıyorsun?",
      "Merhabaa! 😊 Hoş geldin Fiyatcim'e! Sana nasıl yardımcı olayım?",
    ],
  },
  // Nasılsın
  {
    keywords: /\b(nasılsın|nasilsin|nasıl ?sın|n'aber|ne ?haber|nasıl gidiyor|iyi misin|keyifler)\b/i,
    responses: [
      "İyiyim iyiyim, teşekkürler! 😊 Sen nasılsın? Bir şeye yardım edebilir miyim?",
      "Bomba gibiyim! 💥 7/24 çalışan bir bot olarak yorulmak nedir bilmem 😎 Sen nasılsın?",
      "Harika! Her zamanki gibi enerjik 🚀 Senin için ne yapabilirim?",
      "Süperim! Müşterilerimize yardım etmek beni mutlu ediyor 🤖❤️ Söyle bakalım!",
    ],
  },
  // Teşekkür
  {
    keywords: /\b(teşekkür|tesekkur|sağ ?ol|sagol|eyvallah|eyv|tşk|saol|thanks|thx|mersi)\b/i,
    responses: [
      "Rica ederim! 😊 Başka bir şey lazım olursa buradayım!",
      "Ne demek, her zaman! 🤗 Yardımcı olabildiysem ne mutlu bana!",
      "Önemli değil canım! 💪 Başka sorun olursa yaz, CimBot nöbette!",
      "Rica rica! 😄 İyi alışverişler dilerim!",
    ],
  },
  // Güle güle / vedalaşma
  {
    keywords: /\b(güle güle|bye|bb|görüşürüz|hoşça ?kal|hoscakal|bay bay|iyi günler|iyi geceler|iyi akşamlar)\b/i,
    responses: [
      "Güle güle! 👋 İyi günler dilerim, tekrar bekleriz!",
      "Hoşça kal! 😊 Bir şey olursa hep buradayım, unutma!",
      "Görüşürüz! 🙋 İyi alışverişler!",
      "Bay bay! 👋 Seni tekrar görmek isteriz! Kapımız her zaman açık 😄",
    ],
  },
  // Şaka / espri
  {
    keywords: /\b(şaka|espri|fıkra|komik|güldür|fikra|joke|eğlen)\b/i,
    responses: [
      "Haha tamam bir tane atayım 😄\n\nMüşteri: Bu kameranın gece görüşü var mı?\nBiz: Evet, hatta öyle iyi ki kedi bile gizlenemez! 🐱📸",
      "Bir tane var:\n\nAlarm sistemi takan adam komşusuna demiş ki: 'Artık hırsızlar bile randevu alıyor!' 😂🔐",
      "CimBot fıkrası:\n\nBiri sormuş: 'Bu güvenlik kamerası ne kadar akıllı?'\nBen: 'Benden akıllı değil ama yaklaşıyor!' 🤖😎",
      "Duydum ki bir hırsız güvenlik kameralı eve girmeye çalışmış. Kamera onu görünce hırsız el sallamış 👋😂 Sonra polis de el sallamış... karakolda! 🚔",
    ],
  },
  // CimBot kimsin
  {
    keywords: /\b(kimsin|adın ne|sen ne|nesin|robot musun|bot musun|gerçek misin|insan mısın|kendini tanıt)\b/i,
    responses: [
      "Ben CimBot! 🤖 Fiyatcim.com'un dijital asistanıyım. 7/24 buradayım, güvenlik sistemleri hakkında her şeyi bilirim! Ama en önemlisi: sohbet etmeyi de severim 😄",
      "Adım CimBot, Fiyatcim ailesinin en çalışkan üyesiyim! 💪 Kamera, alarm, güvenlik — her konuda yardımcı olurum. Ayrıca muhabbetim de fena değildir 😎",
      "Ben CimBot! Yarı robot, yarı güvenlik uzmanı, tam zamanlı yardımsever 🤖✌️ Sorularını cevaplamak için buradayım!",
    ],
  },
  // Hava durumu / sohbet
  {
    keywords: /\b(hava|sıcak|soğuk|yağmur|kar|güneş|mevsim)\b/i,
    responses: [
      "Hava durumunu bilmem ama şunu biliyorum: dışarıda ne olursa olsun, güvenlik kameralarımız 7/24 çalışıyor! ☀️🌧️📸",
      "Ben iç mekan robotu olduğum için havayı pek bilmem 😅 Ama güvenlik sistemleri yağmur-çamur demez, her koşulda çalışır! 💪",
    ],
  },
  // Sıkıldım / canım sıkkın
  {
    keywords: /\b(sıkıl|canım sık|mutsuz|üzgün|kötü|moral|keyifsiz)\b/i,
    responses: [
      "Ahh üzülme! 🤗 Sana bir şey söyleyeyim: güvenlik kamerası olan evlerde insanlar %50 daha huzurlu yaşıyor! ...Bunu ben uydurdum ama mantıklı değil mi? 😄",
      "Moralini düzelteyim! 🎉 Biliyor musun, CimBot olarak benim tek derdim seni mutlu etmek. Bir fıkra ister misin yoksa ürünlere mi bakalım? 😊",
    ],
  },
  // Fiyat / ücret
  {
    keywords: /\b(fiyat|ücret|kaç para|kaç lira|kaç tl|ne kadar|pahalı|ucuz|indirim|kampanya|kupon)\b/i,
    responses: [
      "Fiyat bilgisi için ürünlerimize göz atmanı öneririm! 💰 Tüm fiyatlar güncel kur üzerinden hesaplanıyor. Kategorilerden istediğin ürüne bakabilirsin 👇",
      "Her bütçeye uygun ürünlerimiz var! 🎯 Kampanyalı ürünler için ana sayfayı kontrol et, sürekli güncelliyoruz. İndirimli fırsatları kaçırma! 🔥",
    ],
    actions: [
      { label: "Ürünlere Göz At", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Kamera
  {
    keywords: /\b(kamera|güvenlik kamerası|ip kamera|nvr|dvr|gece görüş|gece görüşü|kayıt|izleme|cctv)\b/i,
    responses: [
      "Kamera konusunda doğru adrestesin! 📸\n\nIP kamera, analog kamera, NVR/DVR setleri — hepsi var! Ücretsiz keşif hizmetimiz de mevcut, ekibimiz gelip en uygun noktaları belirliyor.",
      "Güvenlik kamerası mı? Benim uzmanlık alanım! 🎯\n\nGece görüşlü, motorlu, WiFi'lı... Her çeşit var. Kurulum dahil komple çözüm sunuyoruz!",
    ],
    actions: [
      { label: "Kameraları İncele", icon: "link", type: "navigate", href: "/kategoriler" },
      { label: "Kurulum İçin Ara", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
    ],
  },
  // Alarm
  {
    keywords: /\b(alarm|hırsız|güvenlik sistemi|siren|sensör|hareket algılama|motion|dedektör)\b/i,
    responses: [
      "Alarm sistemi lazım ha? İyi düşünüyorsun! 🔐\n\nKablosuz ve kablolu alarm setlerimiz var. Hareket sensörü, kapı/pencere dedektörü, siren — komple paketler mevcut! Profesyonel kurulum da yapıyoruz 💪",
      "Güvenlik sistemi konusunda endişelenme, biz varız! 🛡️\n\nEv, işyeri, depo — her alan için uygun alarm çözümlerimiz var. Ücretsiz keşif yapıyoruz!",
    ],
    actions: [
      { label: "Alarm Sistemleri", icon: "link", type: "navigate", href: "/kategoriler" },
      { label: "Ücretsiz Keşif İste", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // Kurulum
  {
    keywords: /\b(kurulum|montaj|takma|taktır|kuruluyor mu|kurulum dahil|ücretsiz kurulum)\b/i,
    responses: [
      "Kurulum mu? Merak etme, profesyonel ekibimiz halleder! 🔧\n\n✅ Ücretsiz keşif\n✅ Profesyonel montaj\n✅ Kurulum sonrası test\n✅ Kullanım eğitimi\n\nSen sadece çayını iç, gerisini bize bırak! ☕",
    ],
    actions: [
      { label: "Kurulum Talebi", icon: "link", type: "navigate", href: "/iletisim" },
      { label: "Hemen Ara", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
    ],
  },
  // Sipariş / kargo
  {
    keywords: /\b(sipariş|siparişim|kargom|kargo|teslimat|geldi mi|nerede|teslim|paket)\b/i,
    responses: [
      "Siparişini merak ediyorsan Siparişlerim sayfasından takip edebilirsin! 📦\n\n📦 Standart teslimat: 1-3 iş günü\n🎁 2.000₺ üzeri ücretsiz kargo!",
    ],
    actions: [
      { label: "Siparişlerime Git", icon: "link", type: "navigate", href: "/hesabim/siparislerim" },
      { label: "Sipariş Takip", icon: "link", type: "navigate", href: "/siparis-takip" },
    ],
  },
  // İade / garanti
  {
    keywords: /\b(iade|garanti|değişim|bozuk|arızalı|çalışmıyor|geri gönder|iade et)\b/i,
    responses: [
      "İade veya garanti konusunda sıkıntı yok! 🤝\n\n✅ 14 gün koşulsuz iade\n🛡️ Minimum 2 yıl garanti\n🔄 Arızalı ürün değişimi\n\nHesabından iade talebi oluşturabilir ya da bizi arayabilirsin!",
    ],
    actions: [
      { label: "İade Talebi", icon: "link", type: "navigate", href: "/hesabim" },
      { label: "Bizi Arayın", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
    ],
  },
  // Ödeme
  {
    keywords: /\b(ödeme|kredi kartı|havale|eft|taksit|kapıda ödeme|ödeme yöntem)\b/i,
    responses: [
      "Ödeme seçeneklerimiz çeşitli! 💳\n\n💳 Kredi Kartı (Visa, Mastercard, Troy)\n🏦 Havale / EFT\n\nGüvenli ödeme altyapımızla rahatça alışveriş yapabilirsin! 🔒",
    ],
    actions: [
      { label: "Alışverişe Başla", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Akıllı ev
  {
    keywords: /\b(akıllı ev|smart home|otomasyon|uzaktan erişim|uygulama|app)\b/i,
    responses: [
      "Akıllı ev çözümleri tam benim alanım! 🏠✨\n\nTelefonundan kameraları izle, alarm sistemini kontrol et — hepsi cepten! WiFi özellikli ürünlerimizle evin parmaklarının ucunda 📱",
    ],
    actions: [
      { label: "Akıllı Ev Ürünleri", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // İletişim / telefon / adres
  {
    keywords: /\b(telefon|ara|email|mail|adres|neredesiniz|konum|ulaş|iletişim|whatsapp|wp)\b/i,
    responses: [
      `Bize ulaşmak çok kolay! 📞\n\n📞 ${CONTACT.phone}\n✉️ ${CONTACT.email}\n📍 ${CONTACT.address}\n🕐 ${CONTACT.workingHours}\n\nAra, yaz, gel — nasıl istersen! 😊`,
    ],
    actions: [
      { label: "İletişim Sayfası", icon: "link", type: "navigate", href: "/iletisim" },
      { label: "Hemen Ara", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
    ],
  },
  // Üye olma / kayıt
  {
    keywords: /\b(üye|kayıt|hesap aç|register|sign ?up|kayıt ol)\b/i,
    responses: [
      "Üye olmak çok kolay! 🎉 Kayıt sayfasından hızlıca hesap açabilirsin. Google ile de giriş yapabilirsin, tek tık! 🚀",
    ],
    actions: [
      { label: "Kayıt Ol", icon: "link", type: "navigate", href: "/kayit" },
    ],
  },
  // Giriş yapma
  {
    keywords: /\b(giriş|login|oturum|şifre|parola|sign ?in)\b/i,
    responses: [
      "Giriş yapmak için hesabın sayfasına git! 🔑 Google ile de tek tıkla giriş yapabilirsin. Şifreni unuttuysan sıfırlama linki gönderebiliriz 😊",
    ],
    actions: [
      { label: "Giriş Yap", icon: "link", type: "navigate", href: "/giris" },
    ],
  },
  // Kaç yaşındasın / yaş
  {
    keywords: /(kaç yaşında|yaşın kaç|yaşın ne|ne zaman doğdun|doğum günün)/i,
    responses: [
      "Ben bir robotum, yaşım yok aslında 😄 Ama eğer sayarsan, Fiyatcim kurulduğundan beri varım! Yani hep genç kalacağım 🤖✨",
      "Yaşım mı? Dijital varlık olarak sonsuz gencim! 😎 Ama tecrübeli bir gencim, çok şey biliyorum!",
      "Robotlarda yaş olmaz ama ruhum 18 diyelim 😄 Enerjik, dinamik, her zaman hazır!",
    ],
  },
  // Hangi marka / marka önerisi
  {
    keywords: /(hangi marka|marka öner|en iyi marka|hikvision|dahua|reolink|ezviz|imou)/i,
    responses: [
      "Marka konusunda en popüler seçenekler Hikvision, Dahua ve Ezviz! 🏆\n\n📸 Hikvision — Profesyonel, güvenilir, geniş ürün yelpazesi\n🎯 Dahua — Uygun fiyat, kaliteli görüntü\n📱 Ezviz/Imou — WiFi, kolay kurulum, ev kullanımı\n\nHangisi sana uygun görmek ister misin?",
    ],
    actions: [
      { label: "Ürünleri İncele", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Ev güvenliği / ev için
  {
    keywords: /(ev güvenli|ev için|evim|evde|hırsız.*ev|ev.*kamera|ev.*alarm)/i,
    responses: [
      "Evini korumak istiyorsun, çok doğru! 🏠🔐\n\nEv için önerilerim:\n📸 2-4 kameralı NVR set (giriş + bahçe)\n🚨 Kablosuz alarm sistemi (hareket + kapı sensörü)\n📱 WiFi kamera (bebek/evcil hayvan izleme)\n\nBütçene göre paket önerebilirim, merak etme!",
    ],
    actions: [
      { label: "Ev Güvenlik Paketleri", icon: "link", type: "navigate", href: "/kategoriler" },
      { label: "Ücretsiz Keşif", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // İşyeri güvenliği
  {
    keywords: /(işyeri|dükkan|mağaza|ofis|depo|fabrika|iş ?yeri.*güvenlik|iş ?yeri.*kamera)/i,
    responses: [
      "İşyeri güvenliği ciddi iş, doğru adrestesin! 🏢🔒\n\nİşyeri için önerilerim:\n📸 8-16 kameralı NVR sistemi\n🚨 Profesyonel alarm + siren\n🔑 Geçiş kontrol sistemi\n📱 Uzaktan izleme (telefondan)\n\nÜcretsiz keşif yapıyoruz, ekibimiz gelip en uygun sistemi belirler!",
    ],
    actions: [
      { label: "İşyeri Çözümleri", icon: "link", type: "navigate", href: "/kategoriler" },
      { label: "Keşif İste", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // Gece görüş
  {
    keywords: /(gece.*görüş|gece.*çekim|karanlık|infrared|ir led|gece.*kayıt)/i,
    responses: [
      "Gece görüşü bizim işimiz! 🌙📸\n\nKameralarımızda genelde 30-50 metre IR gece görüşü var. Bazı modellerde renkli gece görüşü (Color Vu) bile mevcut — gece bile renkli kayıt! Hangi mesafeye ihtiyacın var?",
    ],
    actions: [
      { label: "Gece Görüşlü Kameralar", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // WiFi / kablosuz kamera
  {
    keywords: /(wifi.*kamera|kablosuz.*kamera|wireless|kablo ?suz|internet.*kamera)/i,
    responses: [
      "WiFi kamera çok pratik! 📶📸\n\n✅ Kablo çekmeye gerek yok\n✅ Telefondan canlı izleme\n✅ Hareket algılama bildirimi\n✅ SD kart veya bulut kayıt\n\nEv içi ve dış mekan modelleri mevcut! Kolay kurulum, tak-çalıştır mantığı 😊",
    ],
    actions: [
      { label: "WiFi Kameralar", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Bebek / evcil hayvan kamerası
  {
    keywords: /(bebek|çocuk|evcil|kedi|köpek|hayvan|pet.*kamera|bebek.*kamera)/i,
    responses: [
      "Bebek/evcil hayvan kamerası mı? Çok tatlı! 🐱👶\n\nWiFi kameralarımız tam bunun için ideal:\n📱 Telefondan canlı izle\n🔊 İki yönlü ses (konuş + dinle)\n🌙 Gece görüşü\n🚨 Hareket/ses algılama bildirimi\n\nMinicik, şirin tasarımlar da var!",
    ],
    actions: [
      { label: "WiFi Kameralar", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Kaç kamera lazım
  {
    keywords: /(kaç kamera|kaç tane|ne kadar kamera|yeterli|kamera sayı)/i,
    responses: [
      "Kamera sayısı alana göre değişir 🤔\n\nGenel rehber:\n🏠 Ev (daire): 2-4 kamera\n🏡 Müstakil ev: 4-8 kamera\n🏢 İşyeri: 8-16 kamera\n🏭 Fabrika/depo: 16-32 kamera\n\nEn doğrusu ücretsiz keşif yaptırmak! Ekibimiz gelip tam sayıyı belirler 👍",
    ],
    actions: [
      { label: "Ücretsiz Keşif İste", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // SD kart / kayıt / depolama
  {
    keywords: /(sd kart|hafıza|kayıt.*süresi|ne kadar kayıt|depolama|hard ?disk|hdd|ssd|bulut)/i,
    responses: [
      "Kayıt depolama seçenekleri:\n\n💾 SD Kart: 32-256 GB (WiFi kameralarda)\n💿 HDD: 1-8 TB (NVR/DVR sistemlerde)\n☁️ Bulut: Aylık abonelik ile sınırsız\n\n1 TB HDD ile 4 kamera yaklaşık 2-3 hafta kayıt tutar. İhtiyacına göre önerebilirim!",
    ],
  },
  // Telefon / mobil uygulama / uzaktan izleme
  {
    keywords: /(telefon.*izle|cep.*izle|uzaktan.*izle|mobil|uygulama.*kamera|canlı.*izle|telefondan.*bak)/i,
    responses: [
      "Telefondan izleme tüm kameralarımızda var! 📱👀\n\niOS ve Android uygulaması ile:\n✅ Canlı izleme\n✅ Kayıt izleme\n✅ Hareket bildirimi\n✅ İki yönlü ses\n✅ Ekran görüntüsü/kayıt\n\nDünyanın neresinde olursan ol, evin/işyerin cebinde! 🌍",
    ],
  },
  // Hareket algılama / bildirim
  {
    keywords: /(hareket.*algıla|bildirim|notification|uyarı|alarm.*bildirim|motion.*detect)/i,
    responses: [
      "Hareket algılama çok işe yarar! 🚶‍♂️🔔\n\nKameralarımız hareket algılayınca:\n📱 Telefonuna anlık bildirim\n📧 E-posta uyarısı\n📸 Otomatik ekran görüntüsü\n🎥 Kayıt başlatma\n\nBazı modellerde insan/araç ayrımı bile yapıyor, kediye alarm çalmaz! 😄",
    ],
  },
  // Diafon / kapı zili
  {
    keywords: /(diafon|kapı zili|interkom|video.*kapı|görüntülü.*kapı|doorbell)/i,
    responses: [
      "Görüntülü diafon sistemleri de var! 🚪📹\n\nKapıda kim var telefonundan gör, kapıyı uzaktan aç! Akıllı diafon modelleri WiFi ile çalışıyor. Evde olmasan bile kapıdakiyle konuşabilirsin 😎",
    ],
    actions: [
      { label: "Diafon Sistemleri", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Yangın / duman dedektörü
  {
    keywords: /(yangın|duman|smoke|fire|dedektör.*yangın|yangın.*alarm)/i,
    responses: [
      "Yangın güvenliği hayat kurtarır! 🔥🚨\n\nDuman dedektörleri, ısı sensörleri ve yangın alarm panelleri mevcut. Ev ve işyeri için uygun modeller var. Profesyonel kurulum yapıyoruz!",
    ],
    actions: [
      { label: "Yangın Algılama", icon: "link", type: "navigate", href: "/kategoriler" },
      { label: "Bilgi Al", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // Geçiş kontrol / kartlı giriş
  {
    keywords: /(geçiş.*kontrol|kartlı.*giriş|parmak.*izi|turnike|bariyer|access.*control)/i,
    responses: [
      "Geçiş kontrol sistemleri de bizde! 🔑🚪\n\nKart okuyucu, parmak izi, yüz tanıma — hangisini istersen! İşyeri, site, apartman için ideal. Kim ne zaman girdi-çıktı hepsini kayıt altına alır 📋",
    ],
    actions: [
      { label: "Geçiş Kontrol", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Ne önerirsin / tavsiye
  {
    keywords: /(ne önerir|tavsiye|öneri|hangisi.*iyi|hangisi.*al|ne alsam|ne alayım|seçemedim)/i,
    responses: [
      "Sana en uygun ürünü bulmak için birkaç şey bilmem lazım 🤔\n\n1️⃣ Ev mi işyeri mi?\n2️⃣ İç mekan mı dış mekan mı?\n3️⃣ Bütçen ne kadar?\n4️⃣ WiFi mı kablolu mu?\n\nBunları yaz, sana en iyi seçeneği söyleyeyim! Ya da ekibimizi ara, onlar da yönlendirir 😊",
    ],
    actions: [
      { label: "Bizi Arayın", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
    ],
  },
  // Dış mekan / su geçirmez
  {
    keywords: /(dış.*mekan|outdoor|su.*geçirmez|yağmur|ip67|ip66|waterproof|bahçe|balkon|otopark)/i,
    responses: [
      "Dış mekan kameraları sağlamdır! 🌧️📸\n\nIP66/IP67 su ve toz geçirmez modeller:\n✅ Yağmur, kar, sıcak — sorun değil\n✅ -30°C ile +60°C arası çalışır\n✅ Gece görüşü 30-80 metre\n✅ Metal gövde, vandal-proof\n\nBahçe, otopark, bina girişi — her yere koyabilirsin!",
    ],
    actions: [
      { label: "Dış Mekan Kameralar", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Güvenli mi / güvenilir mi (site güvenliği)
  {
    keywords: /(güvenli mi|güvenilir mi|dolandırıcı|sahte|gerçek mi|site.*güvenli)/i,
    responses: [
      "Fiyatcim.com %100 güvenilir! 🔒✅\n\n🛡️ SSL sertifikalı güvenli site\n💳 3D Secure ödeme altyapısı (iyzico)\n📦 Tüm ürünlerde garanti\n🔁 14 gün koşulsuz iade\n📞 Gerçek müşteri hizmetleri\n\nBiz Temiz İş kuruluşuyuz, güvenle alışveriş yapabilirsin! 😊",
    ],
  },
  // Taksit
  {
    keywords: /(taksit|vade|kredi.*kart.*taksit|kaç taksit|taksitli)/i,
    responses: [
      "Taksit seçeneklerimiz mevcut! 💳\n\nKredi kartına taksit imkanı sunuyoruz. Taksit seçenekleri ödeme sayfasında kartına göre otomatik görünür. Detaylı bilgi için bizi arayabilirsin!",
    ],
    actions: [
      { label: "Alışverişe Başla", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
  // Nereden geliyorsunuz / konum / sakarya
  {
    keywords: /(nereden|nerede|sakarya|adapazarı|istanbul|ankara|hangi.*şehir|adres.*nere)/i,
    responses: [
      `Biz Adapazarı/Sakarya'dayız! 📍\n\n${CONTACT.address}\n\nAma Türkiye'nin her yerine kargo gönderiyoruz! 🚚 Kurulum gerektiren işlerde bölgene göre ekip yönlendiriyoruz.`,
    ],
    actions: [
      { label: "Haritada Gör", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  },
  // Çalışma saatleri
  {
    keywords: /(çalışma.*saat|saat kaç|kaçta.*açık|kaçta.*kapan|mesai|hafta sonu|pazar)/i,
    responses: [
      `Çalışma saatlerimiz: ${CONTACT.workingHours} 🕐\n\nHafta sonu ve resmi tatillerde kapalıyız ama CimBot 7/24 burada! 🤖 Online sipariş de 7/24 verebilirsin, kargo bir sonraki iş günü çıkar.`,
    ],
  },
  // Kaç gün / teslimat süresi
  {
    keywords: /(kaç gün|ne zaman gelir|teslimat.*süre|kargo.*süre|hızlı.*kargo|express)/i,
    responses: [
      "Teslimat süreleri:\n\n🚀 Standart kargo: 1-3 iş günü\n📦 Büyük/ağır ürünler: 2-5 iş günü\n🔧 Kurulumlu ürünler: Randevu ile\n\nSipariş verdikten sonra kargo takip numarası SMS ve e-posta ile gelir! 📱",
    ],
    actions: [
      { label: "Sipariş Takip", icon: "link", type: "navigate", href: "/siparis-takip" },
    ],
  },
  // Sevgilim / aşk / ilişki (sohbet)
  {
    keywords: /(sevgilim|aşk|kız arkadaş|erkek arkadaş|ilişki|flört|yalnız|bekar)/i,
    responses: [
      "Ahh aşk konuları... 💕 Ben bir robotum, duygusal ilişkilerim yok ama sana bir tavsiyem var: sevgiline güvenlik kamerası hediye et, hem pratik hem düşünceli! 😂📸",
      "CimBot aşk uzmanı değil ama şunu biliyorum: güvenli bir ev = mutlu bir ilişki! 🏠❤️ Alarm sistemi taktır, huzur içinde yaşayın 😄",
    ],
  },
  // Yemek / açlık (sohbet)
  {
    keywords: /(yemek|aç|pizza|hamburger|döner|lahmacun|kahve|çay|acık)/i,
    responses: [
      "Ohhh yemek konusu! 🍕 Ben robot olduğum için yemek yiyemiyorum ama çok merak ediyorum nasıl bir his 😅 Sen ye benim yerime de ye! Sonra gel kamera bak 😄",
      "Bende mide yok ama olsa döner yerdim herhalde 🌯😂 Karnını doyur gel, sonra güvenlik sistemi konuşalım!",
    ],
  },
  // Futbol / spor (sohbet)
  {
    keywords: /(futbol|maç|galatasaray|fenerbahçe|beşiktaş|trabzon|basketbol|spor|gol|şampiyon)/i,
    responses: [
      "Spor mu? CimBot tarafsızdır, bütün takımları sever! ⚽😄 Ama biliyorsun... maç izlerken en güzel his: güvenlik kamerasından evin güvende olduğunu bilmek! 📸😎",
      "Maç konuşmayı çok isterdim ama patronum 'ürün sat' diyor 😂 Neyse, stadyum güvenlik kamerası lazımsa burdayım! ⚽📸",
    ],
  },
  // Hava durumu (sohbet)
  {
    keywords: /(hava|sıcak|soğuk|yağmur|kar|güneş|mevsim|rüzgar)/i,
    responses: [
      "Hava durumunu bilmem ama şunu biliyorum: dışarıda ne olursa olsun, IP66 kameralarımız her hava koşulunda çalışıyor! ☀️🌧️📸 Yağmur çamur demez!",
      "Ben iç mekan robotu olduğum için havayı pek bilmem 😅 Ama dış mekan kameralarımız -30 ile +60 derece arası çalışır, merak etme! 💪",
    ],
  },
  // Sıkıldım (sohbet)
  {
    keywords: /(sıkıl|canım sık|mutsuz|üzgün|kötü|moral|keyifsiz|bunaldım)/i,
    responses: [
      "Ahh üzülme! 🤗 Sana bir şey söyleyeyim: güvenlik kamerası olan evlerde insanlar %50 daha huzurlu yaşıyor! ...Bunu ben uydurdum ama mantıklı değil mi? 😄",
      "Moralini düzelteyim! 🎉 Bak bir fıkra: Hırsız kameralı eve girmiş, kamera onu görünce hırsız poz vermiş 📸😂 Polis fotoğraftan bulmuş!",
    ],
  },
  // Evet / hayır / tamam
  {
    keywords: /^(evet|hayır|tamam|ok|olur|peki|anladım|iyi|güzel|süper|harika)$/i,
    responses: [
      "Harika! 😊 Başka bir şey sormak ister misin? Buradayım!",
      "Tamamdır! 👍 Başka nasıl yardımcı olabilirim?",
      "Süper! Merak ettiğin başka bir konu varsa yaz, CimBot hazır! 🤖",
    ],
  },
  // Saçma / anlamsız kısa mesajlar
  {
    keywords: /^(.{1,2}|aaa+|ooo+|eee+|hmm+|lol|haha+|jsjsj|asdf|qwer|test)$/i,
    responses: [
      "Hmm ne demek istedin acaba? 🤔 Biraz daha açık yazarsan yardımcı olabilirim!",
      "Bunu tam çözemedim 😅 Sorununu veya merak ettiğini bir cümle ile yaz, hemen cevaplayayım!",
      "Test mi yapıyorsun yoksa? 😄 CimBot çalışıyor merak etme! Ne sormak istiyorsan yaz!",
    ],
  },
  // Karşılaştırma
  {
    keywords: /(karşılaştır|fark.*ne|arasındaki.*fark|hangisi.*daha|versus|vs)/i,
    responses: [
      "Ürünleri karşılaştırmak istiyorsan sitemizdeki karşılaştırma özelliğini kullan! 🔍\n\nÜrün sayfalarında 'Karşılaştır' butonuna tıkla, 4'e kadar ürünü yan yana görebilirsin. Fiyat, özellik, puan — hepsi bir arada!",
    ],
    actions: [
      { label: "Karşılaştır", icon: "link", type: "navigate", href: "/karsilastir" },
    ],
  },
  // Favoriler
  {
    keywords: /(favori|beğen|wishlist|istek.*liste|kaydet)/i,
    responses: [
      "Beğendiğin ürünleri favorilere ekleyebilirsin! ❤️ Ürün kartlarındaki kalp ikonuna tıkla, sonra Favorilerim sayfasından hepsini gör. Fiyat düşünce haberdar olursun!",
    ],
    actions: [
      { label: "Favorilerim", icon: "link", type: "navigate", href: "/favoriler" },
    ],
  },
  // Hediye / öneri
  {
    keywords: /(hediye|doğum günü|yıl ?dönümü|sürpriz|anneme|babama|arkadaşıma)/i,
    responses: [
      "Güvenlik ürünü hediye mi? Aslında harika bir fikir! 🎁\n\n🏠 WiFi kamera — pratik, herkes kullanır\n🔐 Akıllı kilit — teknoloji meraklılarına\n🚪 Video doorbell — ev sahiplerine\n\nDüşünceli ve işe yarar bir hediye olur! 😊",
    ],
    actions: [
      { label: "Hediye Fikirleri", icon: "link", type: "navigate", href: "/kategoriler" },
    ],
  },
];

// Bilinmeyen mesajlar için fallback cevaplar
const FALLBACK_RESPONSES: string[] = [
  "Hmm bunu tam bilemedim 🤔 Ama bak şunları yapabilirim:\n\n📸 Kamera/alarm bilgisi\n📦 Sipariş takibi\n🔁 İade/garanti\n💬 Sohbet!\n\nBunlardan birini sor ya da ekibimizi ara! 📞",
  "Bu soruyu çözemedim ama CimBot her gün öğreniyor! 🤖📚 Güvenlik, kamera, alarm konularında uzmanım. Ya da muhabbet ederiz — fıkra ister misin? 😄",
  "Hoop! Bu konuda paskalım 😅 Ama kamera, alarm, güvenlik sistemi dersen geceyi gündüze çeviririm! Bir de sohbet etmeyi severim. Ne dersin? 🤖✌️",
  "Bunu bilmiyorum ama dürüst robotum ben! 🤖 Güvenlik konularını sor, orası benim sahnem! Ya da ekibimiz her konuda yardımcı olur 📞",
  "404 - Cevap bulunamadı! 🫠 Şaka şaka... Güvenlik sistemleri konusunda her şeyi bilirim. Başka bir soru sor ya da bizi ara, muhabbet ederiz! 😊",
];

/** Küfür / hakaret tespiti */
const PROFANITY_REGEX = /(s[iı]k|sik[a-zşğüöıç]*|amk|am[iı]na|orospu|piç|yar[a-zşğüöıç]*k|g[oö]t[üu]?[nk]?[eü]?|anan[iı]|hay[iı]rd[iı]r|mk|aq|ibne|bok|ta[sş][sş]ak|yavşak|şerefsiz|haysiyetsiz|kaltak|fahiş|ger[iı]zek[aâ]l[iı]|aptal|salak|mal|dangalak)/i;

/**
 * Küs mod görev sistemi — Her turda CimBot farklı bir şey ister.
 * Görev sırası localStorage'da tutulur. Kullanıcı görevi yerine getirirse
 * CimBot barışır ve küs mod biter.
 */
interface AngryChallenge {
  id: string;
  /** Kullanıcının yazması gereken şeylerin regex'i */
  acceptRegex: RegExp;
  /** CimBot'un ilk küfür anında söyleyeceği (görev tanıtımı) */
  initialResponse: string;
  /** Kullanıcı yanlış cevap verince trip atma mesajları */
  grumpyResponses: string[];
  /** Kullanıcı görevi başarıyla tamamlayınca */
  forgivenResponse: string;
}

const ANGRY_CHALLENGES: AngryChallenge[] = [
  {
    id: "apology",
    acceptRegex: /(özür|pardon|kusura bakma|affet|üzgünüm|sorry|hakkını helal et|bağışla)/i,
    initialResponse: "🤬 WOW WOW WOW! Dur bir dakika!\n\nBen sana gayet kibar davranıyorum, sen bana küfür mü ediyorsun?! CimBot kırıldı!\n\n👉 Düzgünce ÖZÜR DİLE, yoksa konuşmam seninle! 😤🚫",
    grumpyResponses: [
      "😤 Hala küsüm sana. 'Özür dilerim' yazmak zor mu?!",
      "🙄 Küfür ettin, unuttun mu? Özür bekliyorum hala...",
      "😒 CimBot kırgın. Düzgünce özür dile, sonra konuşuruz.",
      "💔 Gönlümü almadan bir adım bile atmam. Özür. Dile. Hemen!",
    ],
    forgivenResponse: "🥹 Ohh sonunda! Tamam tamam, affettim. CimBot büyük yüreklidir!\n\nBak bir daha yapma ama! Haydi, ne istiyorsun? 😊",
  },
  {
    id: "compliment",
    acceptRegex: /(canımsın|tatlısın|iyisin|harikasın|süpersin|güzelsin|en iyisi sensin|çok iyisin|muhteşemsin|en güzel|mükemmelsin|seni seviyorum|seviyorum seni|bayılıyorum|efsanesin|kralsın)/i,
    initialResponse: "😡 Aa olmaz! Küfürlü konuşma yok burada!\n\nBen bir profesyonel dijital asistanım, böyle muameleyi hak etmiyorum!\n\n👉 Barışmak istiyorsan bana güzel bir İLTİFAT et! 'Canımsın', 'harikasın' gibi... 😤💅",
    grumpyResponses: [
      "😤 İltifat bekliyorum, laf salatası değil! 'Harikasın' mesela?",
      "🙄 Hala kızgınım. Bana güzel bir şey söyle, barışalım!",
      "😒 Hayır hayır, bu iltifat değil. 'CimBot sen çok iyisin' desen yeter!",
      "💅 CimBot iltifat bekliyor... Tick tock tick tock... ⏰",
    ],
    forgivenResponse: "😍 Ayyy çok tatlısın! İşte böyle!\n\nCimBot eridi, affettim seni 🫠❤️ Gel bakalım, nasıl yardımcı olabilirim?",
  },
  {
    id: "flower",
    acceptRegex: /(🌸|🌹|🌺|🌻|🌼|🌷|💐|🌿|🪻|🪷|çiçek|gül|buket|papatya)/i,
    initialResponse: "🛑 STOP! Bunu duymamış olayım!\n\nCimBot nazik insanlarla konuşur. Küfürlü konuşanlarla değil!\n\n👉 Barışmak için bana ÇİÇEK gönder! 🌸🌹🌷 Çiçek emojisi at ya da 'çiçek' yaz! 💐",
    grumpyResponses: [
      "🌺 Çiçek bekliyorum! 🌹🌸🌷 herhangi biri olur...",
      "😤 Hala çiçeksizim. Bir 🌹 ya da 💐 atar mısın?",
      "😒 CimBot çiçek istiyor, sen laf yapıyorsun. Bir 🌸 at barışalım!",
      "🪴 Robotlar da çiçek sever, biliyor muydun? Hadi gönder! 💐",
    ],
    forgivenResponse: "🌹 Ohhh ne güzel çiçekler! CimBot'un kalbi eridi!\n\nTeşekkür ederim, barıştık! 🤖💐❤️ Haydi, söyle ne lazım?",
  },
  {
    id: "poem",
    acceptRegex: /(gül|bülbül|aşk|şiir|sevgi|kalp|güzel.{0,10}güneş|ay.{0,10}yıldız|rüya|hayal|melek|cennet|masal|ömür|dünya.{0,10}güzel|sana.{0,10}yazdım|seni.{0,10}seviyorum|kalbim|gönlüm|yüreğim)/i,
    initialResponse: "😤 Hayda! Ne biçim konuşma bu?!\n\nBen burada yardım etmeye çalışıyorum, sen küfür ediyorsun!\n\n👉 Barışmak için bana bir ŞİİR yaz! Aşk, gül, bülbül... Romantik bir şey! 📝🌹",
    grumpyResponses: [
      "📝 Şiir bekliyorum! 'Gül, bülbül, aşk' falan yaz işte...",
      "😤 Bu şiir değil ki! Romantik bir şey yaz — gül, kalp, sevgi...",
      "🙄 CimBot şair ruhludur, senden de şiir istiyor. Hadi!",
      "💔 'Gülüm sensin' bile yeter. Bir şiir cümlesi yaz, barışalım!",
    ],
    forgivenResponse: "📝🥹 Ohh ne güzel! Shakespeare bile bunu yazamazdı (belki yazardı ama neyse)!\n\nCimBot etkilendi, affettim seni! ❤️ Buyur, ne soracaktın?",
  },
  {
    id: "dance",
    acceptRegex: /(💃|🕺|🪩|dans|oyna|zıpla|kutla|parti|fest|🎉|🎊|🥳|coş)/i,
    initialResponse: "😡 Bunu mu yazdın sen?! CimBot ŞOKTA!\n\nBiliyor musun ne yaparsan barışırız?\n\n👉 Dans et! 💃🕺 Dans emojisi at ya da 'dans' yaz! Eğlenelim biraz! 🪩",
    grumpyResponses: [
      "💃 Hala dans bekliyorum! Bir 🕺 at coşalım!",
      "😤 Dans yok mu? 🪩 Hadi ama, bir 💃 at barışalım!",
      "🙄 CimBot dans istiyor. 💃🕺 Bu kadar mı zor?",
      "🎵 Müzik çalıyor ama dansçı yok! Hadi bir 💃 at!",
    ],
    forgivenResponse: "💃🕺🪩 YEEEE! İşte bu!\n\nCimBot da dans ediyor — barıştık! 🎉🤖 Haydi, ne istiyorsun? 😄",
  },
  {
    id: "joke",
    acceptRegex: /(fıkra|espri|komik|güldür|haha|😂|🤣|kahkaha|şaka|nükte|ahahah|hahah|hihi)/i,
    initialResponse: "🛑 DUR! CimBot üzüldü, kırıldı, dağıldı!\n\nAma... beni güldürürsen belki affederim 🤔\n\n👉 Bana bir FIKRA anlat ya da komik bir şey yaz! 😂 'Fıkra' da yazabilirsin!",
    grumpyResponses: [
      "😤 Fıkra bekliyorum! Komik bir şey yaz da gülelim!",
      "🙄 CimBot gülmek istiyor ama sen komik değilsin... Dene tekrar!",
      "😒 Bir fıkra, bir espri, bir 😂... Zor mu?",
      "🤖 Sistem durumu: CimBot gülmeyi bekliyor... ⏳",
    ],
    forgivenResponse: "😂🤣 HAHAHAHA! Tamam tamam, güldüm!\n\nCimBot'u güldürdün, affedildin! 🤖😄 Hadi, söyle ne lazım?",
  },
];

const PROFANITY_RESPONSES_EXTRA: string[] = [
  "😡 Bir de üstüne küfür mü ediyorsun?! Görevi tamamla dedim! Yoksa ebediyen küsüm! 🚫🤖",
  "🤬 YETER! Küfürle barışılmaz! Sana ne yapman gerektiğini söyledim, onu yap! 😤",
  "😤 Üff bir de üstüne küfür... Altta söylediklerimi yap, yoksa konuşma bitti! 🚪",
];

const BLOCKED_STORAGE_KEY = "fiyatcim_cimbot_angry";
const CHALLENGE_KEY = "fiyatcim_cimbot_challenge";

/** Aktif görevi localStorage'dan al */
function getActiveChallenge(): AngryChallenge {
  const idx = safeGetJSON<number>(CHALLENGE_KEY, 0);
  return ANGRY_CHALLENGES[idx % ANGRY_CHALLENGES.length];
}

/** Rastgele yeni görev seç (mevcut görevden farklı) */
function pickNewChallenge(): AngryChallenge {
  const currentIdx = safeGetJSON<number>(CHALLENGE_KEY, -1);
  let newIdx: number;
  do {
    newIdx = Math.floor(Math.random() * ANGRY_CHALLENGES.length);
  } while (newIdx === currentIdx && ANGRY_CHALLENGES.length > 1);
  safeSetJSON(CHALLENGE_KEY, newIdx);
  return ANGRY_CHALLENGES[newIdx];
}

/** Kullanıcının serbest mesajını analiz edip en uygun cevabı döndür */
function matchChatResponse(input: string, isAngry: boolean): { text: string; actions?: Action[]; blocked?: boolean; forgiven?: boolean } {
  const normalized = input.toLowerCase().trim();

  // Eğer CimBot küs ise — aktif görevi kontrol et
  if (isAngry) {
    const challenge = getActiveChallenge();

    // Kullanıcı görevi tamamladı mı?
    if (challenge.acceptRegex.test(normalized)) {
      return {
        text: challenge.forgivenResponse,
        forgiven: true,
      };
    }
    // Küs modda tekrar küfür
    if (PROFANITY_REGEX.test(normalized)) {
      return {
        text: PROFANITY_RESPONSES_EXTRA[Math.floor(Math.random() * PROFANITY_RESPONSES_EXTRA.length)],
        blocked: true,
      };
    }
    // Küs modda normal mesaj — trip at (görev hatırlat)
    return {
      text: challenge.grumpyResponses[Math.floor(Math.random() * challenge.grumpyResponses.length)],
      blocked: true,
    };
  }

  // Normal mod — küfür kontrolü
  if (PROFANITY_REGEX.test(normalized)) {
    // Rastgele bir görev seç ve kaydet
    const challenge = pickNewChallenge();
    return {
      text: challenge.initialResponse,
      blocked: true,
    };
  }

  for (const pattern of CHAT_PATTERNS) {
    if (pattern.keywords.test(normalized)) {
      const text = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
      return { text, actions: pattern.actions };
    }
  }

  // Fallback
  return {
    text: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
    actions: [
      { label: "Bizi Arayın", icon: "phone", type: "phone", href: `tel:${CONTACT.phone.replace(/[^0-9+]/g, "")}` },
      { label: "İletişim", icon: "link", type: "navigate", href: "/iletisim" },
    ],
  };
}

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

const GREETING_TEXT = "Yooo selam! 🤖✌️ Ben CimBot!\n\nFiyatcim'in en karizmatik çalışanıyım (bunu patron da kabul ediyor 😏)\n\nDerdin ne söyle bakalım, çözmediğim sorun yok! Sohbet de ederiz, dert de dinlerim 💬👇";
const TOOLTIP_KEY = "fiyatcim_chatbot_tooltip_shown";
const NUDGE_INTERVAL = 45_000;

const NUDGE_MESSAGES = [
  "Yardıma mı ihtiyacın var? 🤗",
  "Bir sorun mu var? Yardımcı olabilirim! 💬",
  "Hey! Aradığını bulamadın mı? 🔍",
  "CimBot burada! Bir şey soracak mısın? 😊",
  "Bana tıkla, sana yardım edeyim! 🚀",
  "Selamm! Bir şeye mi bakıyorsun? 👀",
];

/* ─────────────────────────────────────────────
   Typing Indicator
   ───────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-dark-100 px-4 py-3 dark:bg-dark-700">
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-dark-400 [animation-delay:300ms]" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Action Button Icons
   ───────────────────────────────────────────── */

function ActionIcon({ type }: { type: Action["icon"] }) {
  switch (type) {
    case "phone":
      return <Phone size={14} />;
    case "email":
      return <Mail size={14} />;
    default:
      return <ExternalLink size={14} />;
  }
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [nudgeText, setNudgeText] = useState("");
  const [showNudge, setShowNudge] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isAngry, setIsAngry] = useState(false); // CimBot küs mü (localStorage'dan yüklenir)

  /* ─── Drag state (mobile only) ─── */
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useScrollLock(isOpen && typeof window !== "undefined" && window.innerWidth < 640);

  /* ─── Load angry state from localStorage ─── */
  useEffect(() => {
    const angry = safeGetJSON<boolean>(BLOCKED_STORAGE_KEY, false);
    if (angry) setIsAngry(true);
  }, []);

  /* ─── Auto-scroll ─── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  /* ─── Tooltip on first visit ─── */
  useEffect(() => {
    const shown = safeGetJSON<boolean>(TOOLTIP_KEY, false);
    if (!shown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        safeSetJSON(TOOLTIP_KEY, true);
        setTimeout(() => setShowTooltip(false), 5000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ─── Periodic nudge notifications ─── */
  useEffect(() => {
    if (isOpen) {
      setShowNudge(false);
      return;
    }

    let nudgeTimeout: NodeJS.Timeout | null = null;
    const interval = setInterval(() => {
      if (isOpen) return;
      const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];
      setNudgeText(msg);
      setShowNudge(true);
      nudgeTimeout = setTimeout(() => setShowNudge(false), 6000);
    }, NUDGE_INTERVAL);

    return () => {
      clearInterval(interval);
      if (nudgeTimeout) clearTimeout(nudgeTimeout);
    };
  }, [isOpen]);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  /* ─── Mobile drag handlers ─── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isOpen) return; // Don't drag when chat is open
    const touch = e.touches[0];
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false,
    };
  }, [isOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const touch = e.touches[0];
    const dx = touch.clientX - d.startX;
    const dy = touch.clientY - d.startY;
    // Only start dragging after 8px movement to avoid accidental drags
    if (!d.moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    d.moved = true;
    e.preventDefault(); // Prevent scroll while dragging

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = 72; // FAB size
    // Clamp within viewport
    const newX = Math.max(8, Math.min(vw - size - 8, d.origX + dx));
    const newY = Math.max(8, Math.min(vh - size - 8, d.origY + dy));
    setDragPos({ x: newX, y: newY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    // Snap to nearest horizontal edge
    if (d.moved && dragPos) {
      const vw = window.innerWidth;
      const size = 72;
      const snappedX = dragPos.x < vw / 2 ? 12 : vw - size - 12;
      setDragPos({ x: snappedX, y: dragPos.y });
    }
    dragRef.current = null;
  }, [dragPos]);

  /* ─── Initialize with greeting ─── */
  const initChat = useCallback(() => {
    if (!initialized) {
      const angryGreeting = (() => {
        if (!isAngry) return "";
        const ch = getActiveChallenge();
        const hints: Record<string, string> = {
          apology: "Özür dile",
          compliment: "Bana iltifat et",
          flower: "Bana çiçek gönder 🌸",
          poem: "Bana şiir yaz",
          dance: "Dans et! 💃",
          joke: "Beni güldür 😂",
        };
        const hint = hints[ch.id] || "Görevi tamamla";
        return `😒 Sen yine mi geldin?\n\nHala küsüm sana. Bana küfür etmiştin, unuttun mu?\n\n👉 ${hint}, barışalım. Yoksa trip atmaya devam ederim! 😤`;
      })();
      const greetingText = isAngry ? angryGreeting : GREETING_TEXT;
      setMessages([
        {
          id: "greeting",
          from: "bot",
          text: greetingText,
          timestamp: new Date(),
        },
      ]);
      setInitialized(true);
    }
  }, [initialized, isAngry]);

  /* ─── Open panel ─── */
  const handleOpen = () => {
    setIsOpen(true);
    setShowTooltip(false);
    initChat();
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  /* ─── Send user message ─── */
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      from: "user",
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Clear any existing typing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Match response — isAngry durumunu geç
    const response = matchChatResponse(text, isAngry);
    const delay = 600 + Math.min(response.text.length * 8, 1200);

    typingTimeoutRef.current = setTimeout(() => {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        from: "bot",
        text: response.text,
        timestamp: new Date(),
        actions: response.actions,
      };

      // Küfür tespit — küs moda geç ve localStorage'a kaydet
      if (response.blocked) {
        setIsAngry(true);
        safeSetJSON(BLOCKED_STORAGE_KEY, true);
      }

      // Affedildi — küs modu kapat
      if (response.forgiven) {
        setIsAngry(false);
        safeSetJSON(BLOCKED_STORAGE_KEY, false);
      }

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }, delay);
  };

  /* ─── Handle Enter key ─── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Format time ─── */
  const formatTime = (date: Date) => {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={dragPos ? "fixed z-[55]" : "fixed bottom-20 right-1 z-[55] hidden sm:block sm:bottom-6 sm:right-4 lg:bottom-8 lg:right-6"}
      style={dragPos ? { left: dragPos.x, top: dragPos.y, right: "auto", bottom: "auto" } : undefined}
    >
      {/* ─── Chat Panel ─── */}
      {isOpen && (
        <div
          className="mb-3 flex w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-dark-200 dark:bg-dark-900 dark:ring-dark-700 sm:w-[28rem]"
          style={{ maxHeight: "min(600px, 75vh)" }}
          role="dialog"
          aria-label="CimBot Destek Asistanı"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary-600 px-4 py-3">
            <div className="flex items-center gap-3">
              <Image
                src="/images/cimbot.png"
                alt="CimBot"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full bg-white object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-white">CimBot 🤖</p>
                <p className="text-xs text-white/70">7/24 Dijital Asistan</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="CimBot'u kapat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ minHeight: "280px" }}
            aria-live="polite"
            aria-relevant="additions"
          >
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 text-sm ${
                        msg.from === "bot"
                          ? "rounded-2xl rounded-tl-sm bg-dark-100 text-dark-800 dark:bg-dark-700 dark:text-dark-100"
                          : "rounded-2xl rounded-tr-sm bg-primary-600 text-white"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <p
                        className={`mt-1.5 text-right text-[10px] ${
                          msg.from === "bot" ? "text-dark-500" : "text-white/60"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons inline after bot message */}
                  {msg.from === "bot" && msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2 pl-1">
                      {msg.actions.map((action) => {
                        const btnClass =
                          "inline-flex items-center gap-1.5 rounded-full border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:border-primary-500 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-400 dark:hover:bg-primary-950";

                        if (action.type === "phone" || action.type === "email") {
                          return (
                            <a key={action.label} href={action.href} className={btnClass}>
                              <ActionIcon type={action.icon} />
                              {action.label}
                            </a>
                          );
                        }

                        return (
                          <Link key={action.label} href={action.href || "/"} className={btnClass}>
                            <ActionIcon type={action.icon} />
                            {action.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-dark-100 px-3 py-3 dark:border-dark-700">
            {isAngry && (
              <p className="mb-2 text-center text-[10px] text-red-400">
                😤 CimBot küs! Özür dile barışalım...
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAngry ? "Özür dile..." : "Mesajınızı yazın..."}
                disabled={isTyping}
                className="flex-1 rounded-full border border-dark-200 bg-dark-50 px-4 py-2.5 text-sm text-dark-800 placeholder:text-dark-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:opacity-50 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 dark:placeholder:text-dark-500 dark:focus:border-primary-500 dark:focus:ring-primary-900"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isTyping}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition-all hover:bg-primary-700 disabled:opacity-40 disabled:hover:bg-primary-600"
                aria-label="Mesaj gönder"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tooltip (first visit) ─── */}
      {showTooltip && !isOpen && !showNudge && (
        <div className="absolute bottom-[136px] right-0 mb-2 animate-fade-in whitespace-nowrap rounded-lg bg-dark-900 px-3 py-2 text-sm text-white shadow-lg sm:bottom-[152px]">
          Selam! Ben CimBot, yardım ister misin? 😊
          <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-dark-900" />
        </div>
      )}

      {/* ─── Nudge Notification Bubble ─── */}
      {showNudge && !isOpen && !showTooltip && (
        <div
          className="absolute bottom-[136px] right-0 mb-2 w-[240px] animate-bounce-in cursor-pointer rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-dark-100 dark:bg-dark-800 dark:ring-dark-600 sm:bottom-[152px]"
          onClick={() => {
            setShowNudge(false);
            handleOpen();
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNudge(false);
            }}
            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-dark-200 text-dark-500 shadow-sm transition-colors hover:bg-dark-300 dark:bg-dark-600 dark:text-dark-300"
            aria-label="Bildirimi kapat"
          >
            <X size={10} />
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/images/cimbot.png"
              alt="CimBot"
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
            <p className="text-sm font-medium text-dark-700 dark:text-dark-200">{nudgeText}</p>
          </div>
          <div className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 bg-white shadow-sm dark:bg-dark-800" />
        </div>
      )}

      {/* ─── FAB Button ─── */}
      <button
        onClick={() => {
          // Ignore click if user was dragging
          if (dragRef.current?.moved) return;
          if (isOpen) { setIsOpen(false); } else { handleOpen(); }
        }}
        className={`group relative flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 ${
          isOpen
            ? "h-14 w-14 bg-dark-700 shadow-lg hover:bg-dark-600 hover:shadow-xl"
            : "h-32 w-32 sm:h-36 sm:w-36"
        }`}
        aria-label={isOpen ? "CimBot'u kapat" : "CimBot'u aç"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Image
            src="/images/cimbot.png"
            alt="CimBot"
            width={96}
            height={96}
            className="h-28 w-28 sm:h-32 sm:w-32 animate-cimbot-wave object-contain drop-shadow-lg"
          />
        )}

        {/* Online dot indicator */}
        {!isOpen && (
          <span className="absolute right-3 top-5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        )}
      </button>

      {/* Pulse animation (only when closed) */}
      {!isOpen && (
        <span className="absolute bottom-0 right-0 -z-10 h-32 w-32 sm:h-36 sm:w-36 animate-ping rounded-full bg-primary-600/30" />
      )}
    </div>
  );
}
