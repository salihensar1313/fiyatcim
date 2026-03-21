// ============================================================
// CimBot V2 — Knowledge Base
// Product knowledge, FAQ, installation guides, comparisons, terminology
// ============================================================

import type { KnowledgeEntry } from "../types";

// ─── Product Category Knowledge ───
export const CATEGORY_KNOWLEDGE: KnowledgeEntry[] = [
  {
    topic: "Güvenlik Kameraları",
    keywords: ["kamera", "ip kamera", "dome", "bullet", "ptz", "turret"],
    content: `Güvenlik kameraları iç ve dış mekan kullanımına göre seçilir:

• **Dome Kamera:** Tavan montajı, estetik, iç mekan ideal
• **Bullet Kamera:** Duvar montajı, uzun menzil, dış mekan ideal
• **PTZ Kamera:** Uzaktan yönlendirilebilir, 360° dönüş, geniş alan
• **Turret Kamera:** Dome + Bullet karışımı, çok yönlü
• **Cube/Mini Kamera:** Küçük, iç mekan, bebek/pet takibi

Önemli özellikler: Çözünürlük (MP), gece görüşü (IR), PoE, WiFi, ses kaydı, hareket algılama, IP67 su geçirmezlik.`,
    relatedCategories: ["guvenlik-kameralari"],
  },
  {
    topic: "Alarm Sistemleri",
    keywords: ["alarm", "hirsiz", "siren", "sensor", "hareket"],
    content: `Alarm sistemleri ev ve iş yeri güvenliği için kritiktir:

• **Kablosuz Alarm:** Kolay kurulum, WiFi/GSM bağlantı
• **Kablolu Alarm:** Daha güvenilir, büyük alanlar
• **Hibrit Alarm:** Hem kablolu hem kablosuz sensör desteği

Bileşenler: Ana panel, hareket sensörü (PIR), kapı/pencere kontağı, siren, kumanda, tuş takımı.

Tavsiye: Ev için kablosuz alarm + 2-3 PIR + kapı kontağı yeterli. İş yeri için kablolu tercih edilmeli.`,
    relatedCategories: ["alarm-sistemleri"],
  },
  {
    topic: "Akıllı Kilitler",
    keywords: ["akilli kilit", "parmak izi", "sifre", "kartli", "bluetooth"],
    content: `Akıllı kilitler modern güvenlik çözümleridir:

• **Parmak İzi:** En hızlı erişim, 100+ parmak izi
• **Şifreli:** 4-8 haneli kod, misafir şifresi
• **Kartlı:** RFID/NFC kart ile açma
• **Bluetooth/WiFi:** Telefon ile uzaktan kontrol
• **Mekanik Yedek:** Acil durum için anahtar girişi

Yale, Desi, Kale, Blitzlock gibi markalar mevcuttur. Kapı tipinize uygun model seçimi önemlidir.`,
    relatedCategories: ["akilli-ev-sistemleri"],
  },
  {
    topic: "Yangın Algılama",
    keywords: ["yangin", "duman", "gaz", "dedektor", "sprinkler"],
    content: `Yangın algılama sistemleri can ve mal güvenliği için zorunludur:

• **Duman Dedektörü:** Duman algılar, en yaygın
• **Isı Dedektörü:** Sıcaklık artışı algılar
• **Gaz Dedektörü:** CO, LPG, doğalgaz algılar
• **Manuel Yangın İhbar Butonu:** Acil durumda elle basılır
• **Konvansiyonel Sistem:** Küçük alanlar, uygun fiyat
• **Adresli Sistem:** Büyük binalar, hangi dedektör tetiklendi gösterir

GST ve Sens markaları profesyonel çözümler sunar.`,
    relatedCategories: ["yangin-algilama"],
  },
  {
    topic: "Kayıt Cihazları",
    keywords: ["nvr", "dvr", "xvr", "kayit", "hard disk"],
    content: `Kamera kayıt cihazları:

• **NVR (Network Video Recorder):** IP kameralar için, PoE destekli
• **DVR (Digital Video Recorder):** Analog (Turbo HD) kameralar için
• **XVR (Hybrid):** Hem IP hem analog kamera desteği

Kanal sayısı: 4, 8, 16, 32 kanal seçenekleri. Hard disk ayrı satılır.
Tavsiye: 4 kameraya kadar 4CH, 4-8 kamera 8CH, daha fazlası 16CH.`,
    relatedCategories: ["guvenlik-kameralari"],
  },
];

// ─── FAQ Knowledge ───
export const FAQ_KNOWLEDGE: KnowledgeEntry[] = [
  {
    topic: "Kargo ve Teslimat",
    keywords: ["kargo", "teslimat", "gonderim", "suresi", "ucretsiz"],
    content: "2.000₺ üzeri siparişlerde ücretsiz kargo! Siparişler 1-3 iş günü içinde kargoya verilir. Kargo takip numarası SMS ile gönderilir.",
  },
  {
    topic: "İade Politikası",
    keywords: ["iade", "degisim", "geri gonderme", "para iade"],
    content: "14 gün içinde koşulsuz iade hakkınız var. Ürün kullanılmamış ve orijinal ambalajında olmalıdır. İade kargo ücretsizdir.",
  },
  {
    topic: "Garanti",
    keywords: ["garanti", "suresi", "garanti kapsamı", "ariza"],
    content: "Tüm ürünlerde minimum 2 yıl garanti. Garanti süresi içinde ücretsiz onarım veya değişim yapılır. Garanti belgesi fatura ile birlikte gönderilir.",
  },
  {
    topic: "Kurulum Hizmeti",
    keywords: ["kurulum", "montaj", "teknik", "hizmet"],
    content: "Profesyonel kurulum hizmeti sunuyoruz. Kamera, alarm ve akıllı kilit sistemleri için uzman ekibimiz adresinize gelir. Kurulum ücreti ürün ve lokasyona göre değişir.",
  },
  {
    topic: "Ödeme Yöntemleri",
    keywords: ["odeme", "kredi karti", "havale", "taksit", "eft"],
    content: "Kredi kartı (tek çekim + taksit), banka havalesi/EFT ve kapıda ödeme seçenekleri mevcuttur. 12 aya kadar taksit imkanı!",
  },
  {
    topic: "Çalışma Saatleri",
    keywords: ["calisma", "saat", "acik", "kapali", "mesai"],
    content: "Pazartesi-Cuma: 09:00-18:00, Cumartesi: 10:00-16:00. Pazar günleri kapalıyız. Online sipariş 7/24 verebilirsiniz!",
  },
  {
    topic: "Taksit",
    keywords: ["taksit", "taksitle", "taksit imkani", "kac taksit"],
    content: "12 aya kadar taksit imkanı! Kredi kartıyla taksitli ödeme yapabilirsiniz. Taksit seçenekleri ödeme sayfasında gösterilir.",
  },
  {
    topic: "Toplu Alım",
    keywords: ["toplu", "toptan", "toplu alim", "cok adet", "fiyat teklifi"],
    content: "Toplu alımlarda özel fiyat teklifi sunuyoruz. 10+ ürün siparişlerinde bizi arayın! Proje bazlı özel indirimler için iletişime geçin.",
  },
  {
    topic: "Kargo ve Teslimat Süreleri",
    keywords: ["kargo suresi", "kac gunde", "ne zaman gelir", "teslimat", "kargo ucreti", "ucretsiz kargo"],
    content: "Kargo süresi 1-3 iş günüdür. 2.000₺ üzeri siparişlerde kargo ücretsiz! Saat 14:00'e kadar verilen siparişler aynı gün kargoya verilir. Kurulum gerektiren ürünlerde randevulu teslimat yapılır.",
  },
  {
    topic: "Stok ve Ürün Durumu",
    keywords: ["stok", "stokta", "mevcut", "var mi", "tukendi", "bitti"],
    content: "Ürünlerimizin stok durumu anlık olarak güncellenir. Stokta olmayan ürünler için bekleme listesine kayıt olabilirsiniz. Genellikle 3-5 iş günü içinde yeni stok gelir.",
  },
  {
    topic: "Paket ve Set Ürünler",
    keywords: ["paket", "set", "komple", "full set", "her sey dahil"],
    content: "Komple güvenlik sistemi setleri sunuyoruz! Kamera + NVR + HDD setleri, alarm + sensör paketleri ve akıllı ev komple çözümleri mevcuttur. Set alımlarda %10-20 tasarruf sağlarsınız!",
  },
];

// ─── Technical Terms ───
export const TECH_TERMS: Record<string, string> = {
  "mp": "Megapiksel — Kamera çözünürlüğü. 2MP HD, 4MP süper HD, 8MP 4K kalitesinde.",
  "megapiksel": "Kamera çözünürlüğü birimi. Sayı büyüdükçe görüntü daha net.",
  "ir": "Infrared — Gece görüşü teknolojisi. Kızılötesi LED'ler ile karanlıkta görüntü alır.",
  "poe": "Power over Ethernet — Tek kablo ile hem veri hem elektrik taşır. Ayrı güç kablosu gerekmez.",
  "nvr": "Network Video Recorder — IP kameraların kayıtlarını saklayan cihaz.",
  "dvr": "Digital Video Recorder — Analog kameraların kayıtlarını saklayan cihaz.",
  "ptz": "Pan-Tilt-Zoom — Uzaktan yönlendirilebilir, yakınlaştırma yapabilen kamera.",
  "ip67": "Su ve toz geçirmezlik standardı. Dış mekanda kullanıma uygundur.",
  "wdr": "Wide Dynamic Range — Aydınlık ve karanlık alanları dengeler. Ters ışıkta bile net görüntü.",
  "pir": "Passive Infrared — Hareket algılama sensörü. Vücut ısısını tespit eder.",
  "wifi": "Kablosuz bağlantı. Kablo çekmeden kullanım imkanı sağlar.",
  "h265": "H.265+ — Yeni nesil video sıkıştırma. %50 daha az depolama alanı kullanır.",
  "colorvu": "Hikvision'ın renkli gece görüşü teknolojisi. Gece bile renkli görüntü.",
  "acusense": "Hikvision'ın yapay zeka tabanlı insan/araç algılama teknolojisi.",
  "starlight": "Dahua'nın düşük ışıkta renkli görüntü teknolojisi.",
  "lighthunter": "UNV'nin düşük ışık teknolojisi. 0.0005 Lux'te bile renkli görüntü.",
  "fibra": "Ajax'ın kablolu haberleşme teknolojisi. Tek kablo üzerinden veri + güç iletimi sağlar, 2000m menzile kadar destekler.",
  "jeweller": "Ajax'ın kablosuz haberleşme protokolü. 2000m menzil, çift yönlü şifreli iletişim, düşük güç tüketimi. Pil ömrü 7 yıla kadar.",
  "smart ir": "Akıllı kızılötesi teknolojisi. IR LED'lerin yoğunluğunu mesafeye göre otomatik ayarlar, yakın nesnelerde parlama önler.",
  "ai": "Yapay zeka tabanlı algılama teknolojisi. İnsan/araç ayrımı yaparak yanlış alarmları %95'e kadar azaltır.",
  "smd": "Smart Motion Detection — Akıllı hareket algılama. İnsan ve araç hareketlerini hayvan/yaprak gibi hareketlerden ayırır.",
  "4k": "3840x2160 çözünürlük, 8 megapiksel. Ultra HD kalitesinde görüntü, dijital zoom'da bile net detay.",
  "2k": "2560x1440 çözünürlük, 4 megapiksel. Super HD kalite, en popüler çözünürlük tercihi.",
  "full hd": "1920x1080 çözünürlük, 2 megapiksel. Standart HD kalite, genel izleme için yeterli.",
  "tfe": "Thin Film Elektronik — Akıllı kilitlerdeki yarı iletken parmak izi sensör teknolojisi. Hızlı ve hassas okuma sağlar.",
  "zigbee": "Akıllı ev cihazları için düşük güçlü kablosuz haberleşme protokolü. Mesh ağ yapısı ile geniş kapsama alanı.",
};

// ─── Comparison Knowledge ───
export const COMPARISONS: Record<string, string> = {
  "ip_vs_analog": `**IP Kamera vs Analog Kamera:**
• IP: Yüksek çözünürlük (4-8MP), uzaktan erişim, akıllı özellikler, PoE
• Analog: Uygun fiyat, basit kurulum, düşük çözünürlük (2MP max)
• Tavsiye: Yeni kurulum → IP, mevcut kablolu altyapı → Analog`,

  "wifi_vs_kablolu": `**WiFi Kamera vs Kablolu Kamera:**
• WiFi: Kolay kurulum, esnek yerleşim, internet bağımlı
• Kablolu: Kararlı bağlantı, kesintisiz kayıt, daha güvenilir
• Tavsiye: Ev → WiFi OK, iş yeri → Kablolu tercih edin`,

  "dome_vs_bullet": `**Dome vs Bullet Kamera:**
• Dome: Estetik, tavan montajı, vandal-proof, iç mekan
• Bullet: Uzun menzil IR, dış mekan, caydırıcı görünüm
• Tavsiye: İç mekan → Dome, dış mekan → Bullet`,

  "kablosuz_vs_kablolu_alarm": `**Kablosuz vs Kablolu Alarm:**
• Kablosuz: Kolay kurulum, taşınabilir, pil ömrü sınırlı
• Kablolu: Kesintisiz, büyük alanlar, profesyonel kurulum
• Tavsiye: Ev → Kablosuz, iş yeri/fabrika → Kablolu`,

  "hikvision_vs_dahua": `**Hikvision vs Dahua Kamera Karşılaştırma:**
• Hikvision: Dünya 1 numarası, AcuSense AI, ColorVu gece görüşü, geniş ürün yelpazesi
• Dahua: Güçlü rakip, Starlight teknolojisi, WizSense AI, uygun fiyat/performans
• Ortak: Her ikisi de 2-8MP, PoE, IP67, H.265+, mobil uygulama desteği
• Tavsiye: Premium özellikler → Hikvision, bütçe dostu → Dahua`,

  "ajax_vs_kale": `**Ajax vs Kale Alarm Karşılaştırma:**
• Ajax: Avrupa tasarımı, Jeweller kablosuz protokol, 2000m menzil, şık tasarım, mobil uygulama
• Kale: Yerli üretim, Fibra kablolu seçenek, uygun fiyat, yaygın servis ağı
• Ajax avantaj: Kablosuz kurulum kolaylığı, uzun pil ömrü (7 yıl), anlık bildirim
• Kale avantaj: Yerel destek, maliyet avantajı, entegre kilit çözümleri
• Tavsiye: Modern kablosuz → Ajax, bütçe dostu yerli → Kale`,

  "yale_vs_desi": `**Yale vs Desi Akıllı Kilit Karşılaştırma:**
• Yale: 180+ yıllık marka, global standart, premium kalite, geniş model yelpazesi
• Desi: Yerli üretim, uygun fiyat, Türkiye'ye özel kapı uyumu, kolay servis
• Yale avantaj: Marka güvenilirliği, gelişmiş biyometrik sensörler, akıllı ev entegrasyonu
• Desi avantaj: Fiyat/performans, yerel servis ağı, Türk kapılarına uyum
• Tavsiye: Premium segment → Yale, bütçe dostu → Desi`,

  "2mp_vs_4mp_vs_8mp": `**Kamera Çözünürlük Karşılaştırma (2MP vs 4MP vs 8MP):**
• 2MP (Full HD 1080p): Genel izleme, yüz tanıma orta mesafe, uygun fiyat
• 4MP (2K Super HD): Net detay, plaka okuma 15-20m, en popüler seçim
• 8MP (4K Ultra HD): Maksimum detay, dijital zoom'da bile netlik, geniş alan
• Depolama: 2MP < 4MP (%50 fazla) < 8MP (%200 fazla)
• Tavsiye: Ev → 2-4MP yeterli, iş yeri → 4MP ideal, geniş alan/plaka → 8MP`,
};

// ─── Casual Responses ───
export const CASUAL_RESPONSES: Record<string, string[]> = {
  weather: [
    "Hava durumcuya dönüşmemi isteme 😄 Ama güvenlik hep gündemde! Bir güvenlik kamerası mı arıyorsun?",
    "Havanın nasıl olduğunu bilmiyorum ama güvenliğinizin sağlam olduğundan emin olabilirim! 😊 Size nasıl yardımcı olabilirim?",
  ],
  football: [
    "Futbol muhabbetini çok severim ama benim asıl maçım güvenlik alanında! ⚽ Kamera mı bakıyorsun?",
    "Goool! 🥅 Ama benim uzmanlığım güvenlik sistemleri. Nasıl yardımcı olabilirim?",
  ],
  joke: [
    "Bir kamera diğerine demiş ki: 'Seni görmek ne güzel!' 📷😂 Peki gerçekten bir kamera lazım mı?",
    "Neden alarm sistemi stand-up komedyen olmak istemiş? Çünkü hep siren çalıyormuş! 🚨😄",
  ],
  love: [
    "Aşk güzel şey ama evinizin güvenliği de önemli! 💕 Akıllı kilit ile sevgilinize sürpriz yapabilirsiniz 🔐",
    "Ben bir chatbot'um, aşk konusunda tavsiye veremem ama güvenlik konusunda uzmanım! 😊",
  ],
  food: [
    "Yemek güzel ama güvenlik kamerası ile mutfağınızı da izleyebilirsiniz! 🍳📷 Şaka şaka, size nasıl yardımcı olabilirim?",
  ],
  default: [
    "İlginç bir konu! 😊 Ama benim uzmanlık alanım güvenlik sistemleri. Size bu konuda yardımcı olmamı ister misiniz?",
    "Hmm, bu konu hakkında pek bilgim yok 🤔 Ama güvenlik, kamera, alarm, akıllı kilit konularında sorularınız varsa burdayım!",
  ],
};

// ─── Angry Mode Challenges ───
export const CHALLENGES = [
  {
    id: "apology",
    instruction: "Bana özür dile, belki affederim 😤",
    matchPattern: /\b(ozur|pardon|affet|kusura bakma|pisman)\b/i,
    hint: "Özür dile",
    forgiveResponse: "Tamam, bu sefer affettim. Ama bir daha küfür etme! 😊 Sana nasıl yardımcı olabilirim?",
  },
  {
    id: "compliment",
    instruction: "Bana güzel bir iltifat et, küsüm sana 😒",
    matchPattern: /\b(canimsın|harikasin|guzelsin|seviyorum|harikasın|en iyisin|muhtesem|supersin|tatlısın)\b/i,
    hint: "Bana iltifat et",
    forgiveResponse: "Aww, çok tatlısın! 🥰 Barıştık. Hadi nasıl yardımcı olabilirim?",
  },
  {
    id: "flower",
    instruction: "Bana bir çiçek gönder 🌸 (çiçek emojisi yolla)",
    matchPattern: /[🌸🌹🌻🌺🌷💐🌼🏵️🌾]/,
    hint: "Çiçek emojisi gönder 🌸",
    forgiveResponse: "Ne güzel çiçek! 🌸 Teşekkür ederim, barıştık! Sana nasıl yardımcı olabilirim?",
  },
  {
    id: "poem",
    instruction: "Bana kısa bir şiir yaz! ✍️ (Gül, aşk, kalp gibi kelimeler kullan)",
    matchPattern: /\b(gul|ask|kalp|sevgi|guzel|cicek|bahar|ruzgar|yildiz)\b/i,
    hint: "Bir şiir yaz ✍️",
    forgiveResponse: "Vay, ne güzel şiir! 📝✨ Şair CimBot affediyor seni! Haydi, nasıl yardımcı olabilirim?",
  },
  {
    id: "dance",
    instruction: "Dans et! 💃 (Dans emojisi gönder)",
    matchPattern: /[💃🕺🎵🎶🎼🎹🥳🪩]/,
    hint: "Dans et! 💃🕺",
    forgiveResponse: "Harika dans! 💃🕺 Çok eğlendim, barışalım! Sana ne konuda yardımcı olabilirim?",
  },
  {
    id: "joke",
    instruction: "Beni güldür! 😂 (Bir şaka ya da komik emoji gönder)",
    matchPattern: /[😂🤣😆😹😜🤪]|(\bhaha|hehe|sjsjsj|kdkdkd|random|xd\b)/i,
    hint: "Beni güldür 😂",
    forgiveResponse: "HAHAHAHA 😂😂 Çok güldüm! Tamam barıştık! Hadi güvenlik konusunda konuşalım?",
  },
];

// ─── Get Random Challenge ───
export function getRandomChallenge() {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}

export function getChallengeById(id: string) {
  return CHALLENGES.find((c) => c.id === id) ?? CHALLENGES[0];
}

// ─── Find Knowledge ───
export function findKnowledge(query: string): KnowledgeEntry | null {
  const q = query.toLowerCase();
  const allKnowledge = [...CATEGORY_KNOWLEDGE, ...FAQ_KNOWLEDGE];

  // Score each entry
  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of allKnowledge) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += 2;
    }
    if (q.includes(entry.topic.toLowerCase())) score += 3;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore >= 2 ? bestMatch : null;
}

// ─── Find Tech Term ───
export function findTechTerm(query: string): string | null {
  const q = query.toLowerCase();
  for (const [term, explanation] of Object.entries(TECH_TERMS)) {
    if (q.includes(term.toLowerCase())) return `**${term.toUpperCase()}:** ${explanation}`;
  }
  return null;
}

// ─── Find Comparison ───
export function findComparison(query: string): string | null {
  const q = query.toLowerCase();
  if ((q.includes("ip") && q.includes("analog")) || q.includes("ip kamera") && q.includes("analog")) {
    return COMPARISONS["ip_vs_analog"];
  }
  if ((q.includes("wifi") || q.includes("kablosuz")) && q.includes("kablolu")) {
    return COMPARISONS["wifi_vs_kablolu"];
  }
  if (q.includes("dome") && q.includes("bullet")) {
    return COMPARISONS["dome_vs_bullet"];
  }
  if (q.includes("alarm") && (q.includes("kablosuz") || q.includes("kablolu"))) {
    return COMPARISONS["kablosuz_vs_kablolu_alarm"];
  }
  if ((q.includes("hikvision") && q.includes("dahua")) || (q.includes("hik") && q.includes("dahua"))) {
    return COMPARISONS["hikvision_vs_dahua"];
  }
  if ((q.includes("ajax") && q.includes("kale")) || (q.includes("kale") && q.includes("ajax"))) {
    return COMPARISONS["ajax_vs_kale"];
  }
  if ((q.includes("yale") && q.includes("desi")) || (q.includes("desi") && q.includes("yale"))) {
    return COMPARISONS["yale_vs_desi"];
  }
  if (
    (q.includes("2mp") && q.includes("4mp")) ||
    (q.includes("4mp") && q.includes("8mp")) ||
    (q.includes("2mp") && q.includes("8mp")) ||
    (q.includes("çözünürlük") && q.includes("karşılaştır")) ||
    (q.includes("cozunurluk") && q.includes("karsilastir")) ||
    (q.includes("megapiksel") && q.includes("karşılaştır")) ||
    (q.includes("mp") && q.includes("fark"))
  ) {
    return COMPARISONS["2mp_vs_4mp_vs_8mp"];
  }
  return null;
}

// ─── Cross-Sell Hints ───
export const CROSS_SELL_HINTS: Record<string, string> = {
  "guvenlik-kameralari": "💡 Kameraların kayıtlarını saklamak için bir NVR kayıt cihazı da gerekecek!",
  "alarm-sistemleri": "💡 Alarm paneliyle birlikte hareket sensörü ve kapı kontağı da ekleyebilirsiniz!",
  "yangin-algilama": "💡 Yangın paneli ile birlikte duman dedektörü ve ihbar butonu da gerekecek!",
  "akilli-ev-sistemleri": "💡 Akıllı kilitle birlikte video kapı zili de değerlendirebilirsiniz!",
};
