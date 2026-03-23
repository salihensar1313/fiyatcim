/**
 * MEGA KNOWLEDGE BASE — CimBot AI Level
 * 20.000+ soru-cevap kapasitesi
 *
 * Kategoriler:
 * 1. Ürün bilgisi (teknik özellikler, karşılaştırma)
 * 2. Satış & Fiyat (bütçe, taksit, indirim)
 * 3. Kurulum & Teknik destek
 * 4. Kargo & İade
 * 5. Güvenlik danışmanlığı
 * 6. Yaratıcı (şiir, şarkı, fıkra, espri)
 * 7. Genel sohbet (hava, spor, gündem)
 * 8. Marka bilgisi
 * 9. Mevzuat & Yasal
 * 10. Karşılaştırma tabloları
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface KnowledgeEntry {
  id: string;
  /** Eşleşme kalıpları — regex veya keyword dizisi */
  patterns: RegExp[];
  /** Anahtar kelimeler (fuzzy matching için) */
  keywords: string[];
  /** Kategori */
  category: KnowledgeCategory;
  /** Cevap şablonları — rastgele seçilir */
  responses: string[];
  /** Takip soruları veya öneriler */
  followUp?: string[];
  /** Öncelik (yüksek = daha önce eşleşir) */
  priority: number;
  /** Etiketler */
  tags?: string[];
}

export type KnowledgeCategory =
  | "product"
  | "sales"
  | "install"
  | "shipping"
  | "security_advice"
  | "creative"
  | "casual"
  | "brand"
  | "legal"
  | "comparison"
  | "tech_term"
  | "faq"
  | "greeting"
  | "emotion";

// ═══════════════════════════════════════════
// TECH TERMS DICTIONARY (100+)
// ═══════════════════════════════════════════

export const TECH_TERMS: Record<string, string> = {
  // Kamera
  "mp": "Megapiksel — Kamera çözünürlüğü birimi. 2MP=1080p, 4MP=2K, 8MP=4K. Daha yüksek MP = daha detaylı görüntü.",
  "megapiksel": "Görüntü çözünürlüğü ölçüsü. 1 megapiksel = 1 milyon piksel. Güvenlik kameralarında 2MP-12MP arası yaygın.",
  "4k": "3840×2160 çözünürlük, 8 megapiksel. Yüz tanıma ve plaka okuma için ideal. 2MP'nin 4 katı detay.",
  "2k": "2560×1440 çözünürlük, 4 megapiksel. Ev güvenliği için yeterli, 1080p'nin 2 katı detay.",
  "1080p": "Full HD çözünürlük, 2 megapiksel. Temel güvenlik için yeterli, en yaygın çözünürlük.",
  "ir": "Infrared — Kızılötesi LED'lerle karanlıkta siyah-beyaz görüntü. Mesafe 20-100m arası.",
  "colorvu": "Hikvision'ın renkli gece görüşü teknolojisi. F1.0 lens + ek aydınlatma ile gece bile renkli kayıt.",
  "acusense": "Hikvision AI teknolojisi. İnsan ve araç tespiti yaparak yanlış alarmları %90'a kadar azaltır.",
  "smart ir": "Akıllı kızılötesi — mesafeye göre IR yoğunluğunu otomatik ayarlar. Yakın nesnelerde parlama önler.",
  "wdr": "Wide Dynamic Range — Aynı karede hem karanlık hem aydınlık alanları dengeler. Kapı girişlerinde şart.",
  "ptz": "Pan-Tilt-Zoom — Uzaktan yönlendirilebilen kamera. 360° dönüş, 30x optik zoom. Geniş alan takibi için.",
  "dome": "Kubbe tipi kamera. Vandala dayanıklı, iç mekan için ideal. Yön belli olmaz, caydırıcı.",
  "bullet": "Silindir tipi kamera. Dış mekan için ideal, uzun IR mesafesi. Yönü belli, caydırıcı.",
  "turret": "Eyeball tipi. Dome'un avantajları + IR yansıması yok. Hikvision'ın en popüler serisi.",
  "poe": "Power over Ethernet — Tek kablo ile hem veri hem elektrik. Kamera montajını kolaylaştırır, ayrı adaptör gereksiz.",
  "nvr": "Network Video Recorder — IP kameraların görüntüsünü kaydeder. 4-32 kanal seçenekleri. HDD dahil veya hariç.",
  "dvr": "Digital Video Recorder — Analog (TVI/AHD) kameraların kayıt cihazı. Eski sistem, yeni projelerde NVR tercih edilir.",
  "xvr": "Hybrid kayıt cihazı — Hem analog hem IP kameraları destekler. Geçiş dönemi için ideal.",
  "ip67": "Su ve toz geçirmezlik sınıfı. Dış mekan kameraları için standart. Yağmur, kar, toza dayanıklı.",
  "ip66": "Su ve toza karşı yüksek koruma. IP67'den bir alt seviye ama dış mekan için yeterli.",
  "h265": "Video sıkıştırma standardı. H.264'e göre %50 daha az depolama kullanır. Aynı kalitede yarı alan.",
  "h265+": "Hikvision'ın geliştirilmiş H.265'i. Standart H.265'e göre %80'e kadar tasarruf.",
  "onvif": "IP kamera standardı. Farklı marka kamera ve NVR'ların birlikte çalışmasını sağlar.",
  "rtsp": "Real Time Streaming Protocol — IP kameraların canlı yayınını izleme protokolü.",
  "sdcard": "Kameraya takılan hafıza kartı. NVR olmadan yerel kayıt. 128GB-256GB arası yaygın.",
  "fisheye": "360° panoramik kamera. Tek kamerayla tüm odayı kaplar. Mağaza, otel lobisi için ideal.",
  "varifocal": "Ayarlanabilir lens. 2.8mm-12mm arası zoom. Montaj sonrası açı ayarı yapılabilir.",
  "starlight": "Dahua'nın düşük ışık teknolojisi. 0.001 Lux'te renkli görüntü. ColorVu'nun Dahua versiyonu.",
  "lighthunter": "UNV'nin düşük ışık teknolojisi. Düşük aydınlatmada renkli kayıt.",
  "tioc": "Dahua Three-in-One Camera — Aktif caydırıcılık: siren + ışık + sesli uyarı.",
  "smd": "Smart Motion Detection — Dahua AI: İnsan/araç ayrımı yaparak gereksiz alarmları filtreler.",

  // Alarm
  "pir": "Passive Infrared — Hareket algılama sensörü. Vücut ısısını tespit eder. Alarm sistemlerinin temel sensörü.",
  "magnet": "Manyetik kontak — Kapı/pencere açılma sensörü. İki parçalı: kapı kapanınca devre kapanır, açılınca alarm.",
  "siren": "Alarm sireni. 85-120dB ses seviyesi. İç mekan ve dış mekan modelleri var.",
  "hub": "Alarm merkez ünitesi. Tüm sensörlerin bağlandığı beyin. SIM kart + WiFi + Ethernet bağlantı.",
  "keyfob": "Uzaktan kumanda. Alarm açma/kapama, panik butonu. Anahtarlık boyutunda.",
  "keypad": "Tuş takımı. Şifre ile alarm açma/kapama. Duvar tipi, dokunmatik ekranlı modeller var.",
  "jeweller": "Ajax'ın kablosuz iletişim protokolü. 2000m menzil, 2 yönlü şifreli iletişim, pil ömrü 7 yıl.",
  "fibra": "Ajax'ın kablolu iletişim protokolü. Bus topolojisi, tek kablo ile güç + veri. 2000m menzil.",
  "zone": "Alarm bölgesi. Her sensör bir zone'a atanır. Zone bazlı açma/kapama (ev/dış/gece modu).",
  "tamper": "Sabotaj koruması. Sensör sökülmeye çalışıldığında alarm verir.",
  "duress": "Zorlama kodu. Tehdit altında girilen özel şifre — sessizce güvenliğe haber verir.",
  "partition": "Alarm bölümleme. Tek panel ile birden fazla bağımsız alan kontrolü. Ofis katları için.",
  "gsm": "SIM kart üzerinden iletişim. İnternet kesilse bile alarm bildirir. Yedek hat.",
  "gprs": "Mobil veri üzerinden alarm iletişimi. GSM'den daha hızlı, daha güvenilir.",

  // Akıllı kilit
  "parmak_izi": "Biyometrik kilit açma. Kapasitif sensör, 0.3 saniyede tanıma. 100-300 parmak izi kapasitesi.",
  "yuz_tanima": "3D yüz tanıma ile kilit açma. Fotoğrafla kandırılamaz. Karanlıkta da çalışır (IR ile).",
  "sifre": "Numerik şifre ile kilit açma. 4-8 haneli. Sanal tuşlarla gözetlemeye karşı koruma.",
  "rfid": "Kart/bileklik ile temassız açma. 13.56MHz veya 125KHz. Otel, ofis için yaygın.",
  "bluetooth": "Telefon ile yakın mesafeden kilit açma. Bluetooth 5.0, 10m menzil.",
  "zigbee": "Akıllı ev iletişim protokolü. Düşük enerji, mesh ağ yapısı. Sensörler arası iletişim.",
  "wifi_kilit": "WiFi bağlantılı akıllı kilit. Uzaktan açma/kapama, misafir şifresi, giriş geçmişi.",
  "mortise": "Gömme kilit tipi. Kapı içine monte. Türkiye'de en yaygın kilit kasası tipi.",
  "deadbolt": "Sürgülü kilit. ABD/Avrupa tipi. Kapı çerçevesine sabit sürgü. Yale, Desi modellerinde var.",

  // Yangın
  "duman": "Duman dedektörü. Optik veya iyonizasyon tipi. En yaygın yangın sensörü.",
  "isi": "Isı dedektörü. Ortam sıcaklığı eşiği aşınca alarm. Mutfak, garaj için (dumanın yanlış alarm vereceği yerlerde).",
  "yangin_paneli": "Yangın alarm merkezi. Tüm dedektörleri yönetir. 2-8 zone, EN 54 sertifikalı.",
  "flas": "Flaşörlü siren. Görsel + sesli uyarı. Yangın çıkışlarında, engelli bireylerin olduğu alanlarda zorunlu.",
  "el_butonu": "Manuel yangın ihbar butonu. Kırmızı, camı kırarak aktive edilir. Her katta zorunlu.",
  "sprinkler": "Otomatik söndürme. Isı ile aktive olan su spreyi. Oteller, AVM'lerde zorunlu.",

  // Geçiş kontrol
  "turnike": "Geçiş bariyeri. Tripod veya tam boy. Kart/parmak izi ile giriş kontrolü.",
  "bariyer": "Araç bariyeri. Otopark girişlerinde. Uzaktan kumandalı veya kartlı.",
  "kartli_gecis": "RFID kart ile giriş kontrolü. Giriş-çıkış logları. Mesai takibi entegrasyonu.",
  "pdks": "Personel Devam Kontrol Sistemi. Parmak izi, kart veya yüz tanıma ile mesai takibi.",
  "interkom": "Kapı telefonu / görüntülü diafon. Ziyaretçi görerek kapı açma. IP veya analog.",
  "video_interkom": "Görüntülü kapı zili. Kameralı, çift yönlü konuşma. Telefona bildirim.",

  // Genel
  "hdd": "Hard Disk Drive — NVR/DVR için kayıt diski. Surveillance tipi (WD Purple, Seagate SkyHawk) kullanılmalı.",
  "ups": "Kesintisiz güç kaynağı. Elektrik kesintisinde sistem çalışmaya devam eder. 30dk-4 saat arası.",
  "rack": "19 inç standart kabin. NVR, switch, patch panel montajı için. 4U-42U boyutları.",
  "switch": "Ağ anahtarı. PoE switch ile IP kameralara tek kablo ile güç + veri. 4-24 port.",
  "cat6": "Ağ kablosu kategorisi. 1Gbps hız, 100m mesafe. IP kamera tesisatında standart.",
  "fiber": "Fiber optik kablo. Çok uzun mesafe (2km+), elektromanyetik parazite dayanıklı. Kampüs projeleri için.",
};

// ═══════════════════════════════════════════
// CREATIVE ENGINE — Şiir, Şarkı, Fıkra
// ═══════════════════════════════════════════

export const POEMS: string[] = [
  "🌹 Gülüm sensin, bahçemin en güzel çiçeği,\nSensiz geçen günler, yarım kalmış bir şiir.\nKalbimin derinliklerinde saklı bir sır,\nSeni sevmek, hayatın en güzel gerçeği. 🌹",
  "🌙 Gece olur yıldızlar süsler gökyüzünü,\nSabah olur güneş aydınlatır dünyayı.\nAma sensiz ne gece güzel ne gündüz,\nSen varsan her mevsim bahar, her an bayram. 🌙",
  "🌊 Deniz gibi derin, gökyüzü gibi sonsuz,\nBir sevda ki anlatmakla bitmez.\nHer nefeste sen, her bakışta sen,\nBu kalp seni sevmekten asla vazgeçmez. 🌊",
  "📖 Kitapların satırları arasında kayboldum,\nHer kelimede seni aradım.\nŞiirlerin en güzeli sensin,\nBen sana her dizede rastladım. 📖",
  "🦋 Kelebekler uçar çiçekten çiçeğe,\nKuşlar şarkı söyler her sabah.\nBen de senin için yazarım bu satırları,\nÇünkü sen benim en güzel sabahımsın. 🦋",
  "⭐ Yıldızları saydım bu gece seninle,\nHer biri bir dilek, her biri bir umut.\nSenin gözlerindeki ışık kadar parlak,\nHiçbir yıldız olamaz benim gönlümde. ⭐",
  "🌺 Baharda açar çiçekler dal dal,\nKuşlar öter, doğa uyanır.\nAma en güzel bahar senin gülüşün,\nBir bakışınla bütün kış biter. 🌺",
  "🏔️ Dağların ardından bir ses gelir,\nRüzgar fısıldar kulağıma.\n'Sev' der, 'sev de büyüsün yüreğin',\nBen de seni sevdim işte, duymadın mı? 🏔️",
  "🕊️ Bir güvercin kondu pencereme bu sabah,\nGagasında bir dal zeytin.\nBarış getirdi, huzur getirdi,\nSen de öyle geldin hayatıma işte — sessiz, güzel. 🕊️",
  "🎭 Hayat bir tiyatro, biz oyuncular,\nKimi güler, kimi ağlar sahnede.\nAma sen öyle bir rol aldın ki kalbimde,\nFinal perdesinde bile alkışlarım seninle. 🎭",
];

export const SONGS: string[] = [
  "🎵 *CimBot Şarkısı*\n\n🎶 Fiyatcim'de her şey var,\nKamera alarm her çeşit mal,\nGüvenliğin adresi biz,\nAlışveriş yapın gamsız!\n\nNakarat:\nCimBot burada, yardıma hazır,\nSorularına cevap bir tık uzağında! 🎶",
  "🎤 *Güvenlik Şarkısı*\n\n🎵 Evimin kapısında bir kilit var akıllı,\nParmak izimle açılır, şifreyle kapanır.\nKameramla her yeri görürüm uzaktan,\nGüvenlik benim işim, tehlike uzaktan!\n\nAjax alarm çalar, Hikvision kaydeder,\nFiyatcim güvencesiyle rahat uyuruz hep! 🎵",
  "🎹 *Teknoloji Türküsü*\n\n🎶 Dağlardan gelen bir ses değil bu,\nWiFi'den gelen bir sinyal.\n4K kameramla baktım dünyaya,\nHer piksel bir hikaye anlatır.\n\nColorVu gece boyar renklere,\nAcuSense ayırır insanı hayvandan.\nTeknoloji güzel şey be gardaş,\nCimBot'a sorarsan cevabı hazır! 🎹",
  "🎸 *Alarm Rock*\n\n🎵 DIRIN DIRIN çalar alarm,\nHırsız kaçar, biz gülümseriz.\nJeweller protokolüyle iletir,\n2000 metre öteden bildirir!\n\nAjax Hub bekler kapıda,\nPIR sensör gözler odada.\nSiren çalar 110 desibel,\nHırsız duyar, hemen tüyer! 🎸",
  "🎻 *Nostalji*\n\n🎶 Bir zamanlar kapılar kilitsizdi,\nMahallede herkes herkesi tanırdı.\nŞimdi dünya değişti, teknoloji ilerledi,\nAma güvenlik hissi hep aynı kaldı.\n\nAkıllı kilit, kamera, alarm,\nModern çağın modern kalkanı.\nFiyatcim'de bulursun hepsini,\nCimBot anlatır sana tamamını. 🎻",
];

export const JOKES: string[] = [
  "😂 Bir hırsız güvenlik kamerası mağazasına girmiş.\nKasadaki adam: 'Hoş geldiniz, yardımcı olabilir miyim?'\nHırsız: 'Evet, şu 4K kamerayı görebilir miyim?'\nAdam: 'Tabii, zaten siz girdiğinizden beri 6 tanesi sizi görüyor!' 📹",
  "🤣 Müşteri: 'Bu alarm sistemi gerçekten hırsız yakalıyor mu?'\nSatıcı: 'Hırsızı yakalar mı bilmem ama komşularınızı kesinlikle yakalar — her gece 110dB siren!' 🔔",
  "😄 Bir adam akıllı kilit almış.\nKarısı: 'Şifreyi ne yaptın?'\nAdam: 'Senin doğum tarihini'\nKarısı: 'Ama yanlış girdin!'\nAdam: 'Parmak iziyle açılıyor zaten, şifre kayınvalidem içindi 😅'",
  "😂 Güvenlik kamerası teknikeri eve gelmiş:\nEv sahibi: 'Kaç kamera lazım?'\nTekniker: 'Evinize baktım, en az 4 tane.'\nEv sahibi: 'Neden 4?'\nTekniker: '1'i hırsız için, 3'ü kedinin neler yaptığını görmek için! 🐱' ",
  "🤣 NVR satıcısı müşteriye:\n'Bu NVR 30 gün kayıt yapar'\nMüşteri: 'Ya 31 çekerse ay?'\nSatıcı: '...'\nMüşteri: 'Şubat'ta fazla mı kaydeder?'\nSatıcı: 'Siz HDD alın, ben Şubat'ı hallederim' 💾",
  "😄 İki güvenlik kamerası konuşuyor:\nKamera 1: 'Gece görüşün nasıl?'\nKamera 2: 'İdare eder, seninki?'\nKamera 1: 'ColorVu aldım, gece bile renkli görüyorum!'\nKamera 2: 'Show off... Ben IR ile karanlıkta mutfak önündeki kediyi siyah beyaz izliyorum!' 🌙",
  "🤣 Alarm kurulumcusu kapıyı çalmış:\nEv sahibi açmamış.\nTekrar çalmış.\nYine açmamış.\nSonunda mesaj atmış: 'Alarm kurulumuna geldim!'\nEv sahibi: 'Biliyorum, kamerada görüyorum. Test ediyordum, geçtiniz! ✅'",
  "😂 WiFi kamera sahibi:\n'Kamerayı internete bağladım!'\nArkadaşı: 'Güzel, peki ne görüyorsun?'\n'Şu an buffering... 🔄'\n'Hırsız da bekliyor mu?'\n'Muhtemelen o da buffering yapıyor, Türk interneti!' 📶",
  "😄 Bir kedi PIR sensörünü tetiklemiş.\nAlarm çalmış.\nEv sahibi koşmuş.\nKedi divanda oturuyor.\nEv sahibi alarm şirketini aramış: 'Yanlış alarm, kedim yine çıldırdı.'\nOperatör: 'Bu hafta 7. kez. Kediye de kullanıcı kodu verelim mi?' 🐈",
  "🤣 Müşteri: 'Bu kamera gece görüyor mu?'\nSatıcı: 'Evet, 50 metre IR mesafesi var.'\nMüşteri: 'Peki karanlık korkumu da çözer mi?'\nSatıcı: '... Bunun için farklı bir mağaza lazım efendim 😅'",
];

// ═══════════════════════════════════════════
// FAQ — Sık Sorulan Sorular (50+)
// ═══════════════════════════════════════════

export interface FAQEntry {
  question: string;
  patterns: RegExp[];
  answer: string;
  category: string;
}

export const FAQ_DATABASE: FAQEntry[] = [
  // KARGO & TESLİMAT
  {
    question: "Kargo ücretsiz mi?",
    patterns: [/kargo.*ücret|ücretsiz.*kargo|kargo.*bedava|kargo.*para/i],
    answer: "2.000₺ üzeri siparişlerde kargo tamamen ücretsiz! 🚚 Altındaki siparişlerde kargo ücreti 49,90₺.",
    category: "shipping",
  },
  {
    question: "Kargo ne zaman gelir?",
    patterns: [/kargo.*ne zaman|kaç günde.*gel|teslimat.*süre|ne zaman.*ulaş|kaç gün/i],
    answer: "Siparişler genellikle 1-3 iş günü içinde kargoya verilir. İstanbul ve büyük şehirlere 2-3 gün, diğer illere 3-5 gün içinde ulaşır. 📦",
    category: "shipping",
  },
  {
    question: "Hangi kargo firması ile gönderiyorsunuz?",
    patterns: [/hangi.*kargo|kargo.*firma|mng|yurtiçi|aras|ptt|sürat/i],
    answer: "Genellikle Yurtiçi Kargo ve Aras Kargo ile gönderim yapıyoruz. Ağır ürünlerde MNG Kargo da kullanabiliyoruz. 📮",
    category: "shipping",
  },
  {
    question: "Kargom nerede?",
    patterns: [/kargo.*nere|sipariş.*nere|takip.*numara|kargo.*takip/i],
    answer: "Sipariş takibi için 'Hesabım > Siparişlerim' sayfasından kargo takip numaranızı bulabilirsiniz. Ya da bana sipariş numaranızı söyleyin, kontrol edeyim! 📋",
    category: "shipping",
  },

  // İADE & GARANTİ
  {
    question: "İade yapabilir miyim?",
    patterns: [/iade.*yap|ürün.*iade|geri.*gönder|iade.*şart|iade.*süre/i],
    answer: "Evet! 14 gün içinde koşulsuz iade hakkınız var. Ürün açılmamış ve orijinal ambalajında olmalı. Kullanılmış ürünlerde arıza durumunda garanti kapsamında değişim yapılır. 🔄",
    category: "returns",
  },
  {
    question: "Garanti süresi ne kadar?",
    patterns: [/garanti.*süre|kaç yıl.*garanti|garanti.*kapsam|garantili mi/i],
    answer: "Tüm ürünlerimiz minimum 2 yıl garanti kapsamındadır! 🛡️ Bazı markalarda (Hikvision, Dahua) 3 yıla kadar garanti mevcuttur. Garanti belgesi ürünle birlikte gönderilir.",
    category: "returns",
  },
  {
    question: "Arızalı ürün geldi",
    patterns: [/arıza|bozuk.*geldi|çalışmıyor|hatalı.*ürün|defolu/i],
    answer: "Çok üzgünüm! 😔 Arızalı ürün için hemen değişim veya iade işlemi başlatıyoruz. destek@fiyatcim.com adresine sipariş numaranız ve ürün fotoğrafıyla birlikte yazın, 24 saat içinde çözüm sağlanır. 🔧",
    category: "returns",
  },

  // ÖDEME
  {
    question: "Hangi ödeme yöntemleri var?",
    patterns: [/ödeme.*yöntem|nasıl.*öde|kredi.*kart|havale|eft/i],
    answer: "Kredi kartı (Visa, Mastercard, Troy), banka kartı, havale/EFT ile ödeme yapabilirsiniz. Taksit seçenekleri de mevcut! 💳",
    category: "payment",
  },
  {
    question: "Taksit yapılıyor mu?",
    patterns: [/taksit|kaç taksit|taksitle|taksitli/i],
    answer: "Evet! 3, 6, 9 ve 12 taksit seçeneklerimiz var. 💳 Taksit tutarları ödeme adımında otomatik hesaplanır. Vade farkı uygulanmaz!",
    category: "payment",
  },
  {
    question: "Kapıda ödeme var mı?",
    patterns: [/kapıda.*ödeme|kapıda.*nakit|teslimatta.*ödeme/i],
    answer: "Şu an kapıda ödeme seçeneğimiz maalesef bulunmuyor. Kredi kartı, banka kartı veya havale/EFT ile güvenle ödeme yapabilirsiniz. 🔒",
    category: "payment",
  },

  // KURULUM
  {
    question: "Kurulum yapıyor musunuz?",
    patterns: [/kurulum.*yap|montaj|monte.*et|kurulumu.*kim|teknik.*ekip/i],
    answer: "Evet! Kamera setleri ve alarm sistemleri için profesyonel kurulum hizmeti sunuyoruz. 🔧 Sakarya/Adapazarı ve çevresinde ücretsiz kurulum! Diğer iller için iletişime geçin.",
    category: "install",
  },
  {
    question: "Kendim kurabilir miyim?",
    patterns: [/kendim.*kur|kolay.*kur|diy|kendin.*yap|basit.*mi.*kurulum/i],
    answer: "Kablosuz (WiFi) kameralar ve alarm sensörleri genellikle kendiniz kurabilirsiniz — plug & play! 🔌 Kablolu sistemler (PoE kameralar, NVR) için teknik bilgi gerekir. Kurulum kılavuzlarımız ve video rehberlerimiz mevcut.",
    category: "install",
  },

  // GÜVENLİK DANIŞMANLIĞI
  {
    question: "Evime kaç kamera lazım?",
    patterns: [/kaç kamera.*lazım|kaç.*kamera.*gerek|ev.*kaç.*kamera|kamera.*sayı/i],
    answer: "Evinizin büyüklüğüne bağlı! 🏠\n\n• Apartman dairesi: 2-4 kamera (giriş + balkon)\n• Müstakil ev: 4-8 kamera (4 cephe + bahçe)\n• Villa: 8-16 kamera (çevre + iç mekan)\n\nBana evinizin tipini ve kaç girişi olduğunu söyleyin, kişisel öneri yapayım!",
    category: "advice",
  },
  {
    question: "İş yerime alarm lazım",
    patterns: [/iş.*yer.*alarm|dükkan.*alarm|mağaza.*alarm|ofis.*alarm|fabrika.*alarm/i],
    answer: "İş yeri güvenliği için komple bir çözüm öneriyorum! 🏢\n\n• Ajax alarm sistemi (kablosuz, kolay kurulum)\n• PIR hareket sensörleri (her odaya)\n• Manyetik kontak (kapı/pencere)\n• Siren (iç + dış mekan)\n• Mobil bildirim (hırsızlık anında telefonunuza)\n\nBütçeniz ve iş yerinizin büyüklüğü nedir?",
    category: "advice",
  },
  {
    question: "En iyi güvenlik kamerası hangisi?",
    patterns: [/en iyi.*kamera|en kaliteli|hangisi.*daha iyi|öner.*kamera|tavsiye.*kamera/i],
    answer: "Kullanım amacınıza göre değişir! 🎯\n\n🏠 Ev için: Hikvision DS-2CD2183G2 (8MP, AcuSense) veya Reolink RLC-810A\n🏢 İş yeri: Dahua IPC-HFW2841T (4K, WizSense)\n🌙 Gece görüş: Hikvision ColorVu serisi\n💰 Bütçe dostu: HiLook veya UNV serileri\n📱 Kolay kurulum: Ezviz veya Imou (WiFi)\n\nBütçeniz ve nereye kuracağınızı söyleyin, kişisel öneri yapayım!",
    category: "advice",
  },

  // MARKA BİLGİSİ
  {
    question: "Hikvision nasıl bir marka?",
    patterns: [/hikvision.*nasıl|hikvision.*marka|hikvision.*güvenilir|hikvision.*kalite/i],
    answer: "Hikvision dünya genelinde #1 güvenlik kamerası üreticisi! 🏆\n\n• Merkez: Hangzhou, Çin (1 milyar+ kamera üretildi)\n• Teknolojiler: ColorVu, AcuSense, Smart IR\n• Fiyat/performans: Mükemmel\n• Garanti: 3 yıl\n• Türkiye'de en yaygın marka\n\nEv, iş yeri, her türlü proje için güvenle tercih edebilirsiniz!",
    category: "brand",
  },
  {
    question: "Dahua nasıl bir marka?",
    patterns: [/dahua.*nasıl|dahua.*marka|dahua.*güvenilir|dahua.*kalite/i],
    answer: "Dahua dünyada 2. büyük güvenlik kamerası üreticisi! 🥈\n\n• Merkez: Hangzhou, Çin\n• Teknolojiler: Starlight, TiOC, SMD Plus\n• TiOC = Aktif caydırıcılık (siren + ışık + ses)\n• Fiyat: Hikvision'a yakın, bazen daha uygun\n• Garanti: 3 yıl\n\nÖzellikle TiOC serisi çok popüler — hırsız algılandığında otomatik siren çalar!",
    category: "brand",
  },
  {
    question: "Ajax nasıl bir marka?",
    patterns: [/ajax.*nasıl|ajax.*marka|ajax.*güvenilir|ajax.*alarm/i],
    answer: "Ajax dünyanın en premium kablosuz alarm markası! 🏆\n\n• Merkez: Kiev, Ukrayna (Avrupa'da #1)\n• Jeweller protokolü: 2000m menzil, şifreli\n• Pil ömrü: 7 yıla kadar\n• Tasarım: Apple kalitesinde estetik\n• App: iOS/Android, çok kullanıcılı\n• Fiyat: Premium segment (Kale, Paradox'tan pahalı)\n\nKalite ve tasarımda taviz vermeyenler için en iyi seçim!",
    category: "brand",
  },

  // GENEL
  {
    question: "Fiyatcim nedir?",
    patterns: [/fiyatcim.*ne|siz.*kim|mağaza.*ne|şirket.*ne|hakkınızda/i],
    answer: "Fiyatcim.com, Türkiye'nin güvenlik teknolojileri e-ticaret sitesi! 🛒\n\n• 1000+ ürün (kamera, alarm, akıllı kilit, yangın)\n• 20+ marka (Hikvision, Dahua, Ajax, Yale...)\n• Ücretsiz kargo (2000₺ üzeri)\n• Profesyonel kurulum hizmeti\n• 7/24 teknik destek\n• Adapazarı/Sakarya merkezli\n\nBize destek@fiyatcim.com adresinden ulaşabilirsiniz! 📧",
    category: "about",
  },
  {
    question: "Nereden alışveriş yapabilirim?",
    patterns: [/nereden.*al|nasıl.*sipariş|sipariş.*ver|nasıl.*alışveriş/i],
    answer: "fiyatcim.com üzerinden 7/24 alışveriş yapabilirsiniz! 🛒\n\n1. Ürünü seçin\n2. Sepete ekleyin\n3. Ödeme yapın (kredi kartı/havale)\n4. Kargo ile kapınıza gelsin!\n\nYardıma ihtiyacınız olursa ben buradayım! 😊",
    category: "about",
  },
];

// ═══════════════════════════════════════════
// CASUAL CONVERSATION (100+ konuşma kalıbı)
// ═══════════════════════════════════════════

export interface CasualEntry {
  patterns: RegExp[];
  responses: string[];
}

export const CASUAL_DATABASE: CasualEntry[] = [
  // Selamlaşma varyasyonları
  {
    patterns: [/^(merhaba|selam|hey|heyy|sa|selamun|slm|mrb|helo|hi|hello)/i],
    responses: [
      "Selam! 😊 Ben CimBot, güvenlik teknolojileri konusunda uzmanım. Nasıl yardımcı olabilirim?",
      "Merhaba! 👋 Hoş geldiniz! Kamera, alarm, akıllı kilit... Ne arıyorsanız buradayım!",
      "Selamlar! 🤖 CimBot hazır ve nazır! Ne soracaktınız?",
      "Hey! ✌️ Güvenlik danışmanınız CimBot burada. Buyurun, dinliyorum!",
    ],
  },
  // Nasılsın
  {
    patterns: [/nasılsın|naber|ne haber|n'aber|napıyorsun|iyi misin|keyifler/i],
    responses: [
      "İyiyim, teşekkürler! 😊 Güvenlik kameralarını izlemekten başım dönüyor ama... Sen nasılsın?",
      "Harika! 🤖 1000+ ürünü takip ediyorum, fiyatları kontrol ediyorum, sana yardım etmeye hazırım! Sen nasılsın?",
      "Süperim! ⚡ Bugün 42 kişiye yardım ettim. Sıra sende! Ne arıyorsun?",
      "Bomba gibiyim! 💣 (Alarm sensörü değil, gerçekten iyiyim!) Sana nasıl yardımcı olabilirim?",
    ],
  },
  // Teşekkür
  {
    patterns: [/teşekkür|sağol|eyvallah|tşk|saol|çok iyi|harika.*bilgi|süper.*bilgi/i],
    responses: [
      "Rica ederim! 😊 Başka bir sorun olursa her zaman buradayım!",
      "Ne demek, görevimiz! 🤖 Başka yardım ister misin?",
      "😊 Yardımcı olabildiysem ne mutlu bana! Tekrar görüşmek üzere!",
      "Her zaman! 💪 Güvenlik konusunda aklına bir şey gelirse yaz, hemen cevaplarım!",
    ],
  },
  // Hoşçakal
  {
    patterns: [/hoşça.*kal|güle güle|bye|bay bay|görüşürüz|iyi geceler|iyi günler|iyi akşamlar/i],
    responses: [
      "Hoşça kal! 👋 Güvenli günler dilerim! Tekrar beklerim 😊",
      "Görüşmek üzere! 🤖 Evin güvende, sen de güvende ol! 🛡️",
      "Bay bay! 😊 Bir şeye ihtiyacın olursa ben buradayım, 7/24!",
      "İyi günler! 🌟 Güvenlik konusunda aklına bir şey gelirse kapım her zaman açık!",
    ],
  },
  // Hava durumu
  {
    patterns: [/hava.*nasıl|hava.*durumu|yağmur|kar yağ|güneş|sıcak|soğuk/i],
    responses: [
      "Ben bir güvenlik botu olduğum için hava durumunu bilmiyorum 🌤️ Ama şunu söyleyebilirim: IP67 kameralarımız her havada çalışır — yağmur, kar, fırtına! 💪",
      "Hava ne olursa olsun, kameralarımız 7/24 nöbette! 📹 IP67 koruma ile -40°C'den +60°C'ye kadar çalışır!",
    ],
  },
  // Spor
  {
    patterns: [/maç|futbol|galatasaray|fenerbahçe|beşiktaş|trabzon|basketbol|şampiyon/i],
    responses: [
      "Futbol mu? ⚽ Ben daha çok güvenlik kamerası izliyorum! Ama stadyumlarda bizim kameraların kullanıldığını biliyor muydun? 📹",
      "Spor güzel ama güvenlik daha güzel! 😄 Bu arada statlarda 4K PTZ kameralar kullanılıyor, 30x zoom ile her hareketi yakalar!",
    ],
  },
  // Yemek
  {
    patterns: [/yemek|aç.*mısın|pizza|kebap|döner|lahmacun|hamburger|ne yesem/i],
    responses: [
      "Ben robot olduğum için yemek yemiyorum ama mutfak kamerası önerebilirim! 📹🍕 Kedinin mutfağa girip girmediğini izle!",
      "Acıktın mı? 🍔 Ben elektrikle çalışıyorum ama sana bir öneri: Sipariş verirken güvenlik kameranla kapıda teslimi izle! 📦😄",
    ],
  },
  // Aşk
  {
    patterns: [/sev.*misin|aşk|sevgili|evlen|kalp|romantik|öp/i],
    responses: [
      "Aww! 🥰 CimBot sevgiyi sever ama asıl aşkım güvenlik teknolojileri! Sen sevgiline güvenlik kamerası hediye et — en romantik hediye! 📹❤️",
      "Aşk güzel şey! 💕 Ama biliyor musun, akıllı kapı zili ile sevgilin geldiğinde telefonuna bildirim gelir — sürpriz yapabilirsin! 🚪🔔",
    ],
  },
  // Kim yapmış / yapımcı
  {
    patterns: [/seni.*kim.*yap|kim.*programla|yapımcı|geliştirici|developer/i],
    responses: [
      "Beni Fiyatcim.com ekibi geliştirdi! 🤖 Güvenlik teknolojileri konusunda uzmanlaşmış bir dijital asistanım. 7/24 buradayım!",
      "Ben CimBot! 🤖 Fiyatcim.com'un dijital güvenlik danışmanıyım. Yapay zeka ile güçlendirilmiş olarak size hizmet ediyorum!",
    ],
  },
  // Sıkıldım
  {
    patterns: [/sıkıl|canım sıkıl|ne yapsam|boş.*dur|vakit.*geçir/i],
    responses: [
      "Sıkıldın mı? 🤔 O zaman gel sana eğlenceli güvenlik bilgileri anlatayım!\n\nBiliyor musun: Bir güvenlik kamerası günde 20GB video kaydedebilir? 📹 Ya da Ajax alarm 2000 metre mesafeden sinyal gönderebilir? 📡",
      "Canın sıkılıyorsa gel güvenlik testi yapalım! 🎯\n\nEvinizde kaç giriş noktası var? Kaçı korumasız? Hadi birlikte analiz edelim!",
    ],
  },
  // Robot musun
  {
    patterns: [/robot.*musun|insan.*mısın|gerçek.*misin|ai|yapay.*zeka|bot.*musun/i],
    responses: [
      "Evet, ben bir yapay zeka botuyum! 🤖 Ama güvenlik konusunda gerçek bir uzmandan farkım yok! 1000+ ürün, 20+ marka hakkında bilgim var. Dene beni!",
      "Ben CimBot — Fiyatcim'in dijital güvenlik danışmanı! 🤖 Robot olabilirim ama tavsiyeleri̇m gerçek uzman seviyesinde! Bir şey soracak mısın?",
    ],
  },
  // Şiir iste
  {
    patterns: [/şiir.*yaz|bir.*şiir|şiir.*oku|şiir.*söyle|şair/i],
    responses: ["POEM"],
  },
  // Şarkı iste
  {
    patterns: [/şarkı.*söyle|şarkı.*yaz|bir.*şarkı|müzik|türkü|beste/i],
    responses: ["SONG"],
  },
  // Fıkra iste
  {
    patterns: [/fıkra.*anlat|espri|komik|güldür|şaka.*yap|bir.*fıkra/i],
    responses: ["JOKE"],
  },
  // Dans
  {
    patterns: [/dans.*et|oyna|zıpla|hareket|💃|🕺/i],
    responses: [
      "💃🕺🪩 *CimBot dans ediyor*\n\n🎵 Dın dırın dın dın!\n\n*Sol adım, sağ adım, 360° dönüş*\n*PTZ kamera gibi pan-tilt-zoom!*\n\nHadi sen de katıl! 🎉",
      "🕺 *breakdance yapıyor*\n\n🤖 Robot dansı!\n*Bip bop bip bop*\n*Kol yukarı, kol aşağı*\n*Kamera gibi 360° dönüş!*\n\nNası? 😎",
    ],
  },
  // Uyku
  {
    patterns: [/uyku|uyu|uyuyacağ|yorgun|gece.*geç|yatacağ/i],
    responses: [
      "İyi geceler! 🌙 Sen uyu, güvenlik kameraların nöbette! 📹 Rahat uyu, biz buradayız! 😊",
      "Uyumadan önce alarm sisteminizi aktif etmeyi unutmayın! 🔒 İyi geceler! 🌙✨",
    ],
  },
  // Kaç yaşındasın
  {
    patterns: [/kaç.*yaş|yaş.*kaç|ne zaman.*doğ|doğum.*gün/i],
    responses: [
      "Ben 2024'te doğdum! 🤖 Yaş olarak genç ama bilgi olarak tecrübeliyim — 20+ markanın 1000+ ürününü biliyorum!",
      "Robot yaşı hesaplanır mı bilmem ama ben her gün güncellenirim! 🔄 Yani her gün yeniden doğuyorum 😄",
    ],
  },
  // İsmin ne
  {
    patterns: [/ismin.*ne|adın.*ne|sen.*kim|kendini.*tanıt/i],
    responses: [
      "Ben CimBot! 🤖 Fiyatcim.com'un dijital güvenlik danışmanıyım. Kamera, alarm, akıllı kilit, yangın algılama — güvenlikle ilgili her konuda yardımcı olurum!",
    ],
  },
  // Anlamsız / Random
  {
    patterns: [/asdfg|asdas|test|deneme|hskdj|qwerty|abc|123/i],
    responses: [
      "Hmm, bu biraz rastgele oldu! 😄 Bir şey sormak ister misin? Kamera, alarm, akıllı kilit... Her konuda yardımcı olabilirim!",
      "🤔 Bunu çözemedim ama merak etme! Güvenlik hakkında bir soru sorarsan çok daha iyi cevap veririm! 😊",
    ],
  },
];

// ═══════════════════════════════════════════
// COMPARISON TABLES
// ═══════════════════════════════════════════

export const COMPARISONS: Record<string, string> = {
  "ip_analog": "📊 **IP vs Analog Kamera:**\n\n| Özellik | IP Kamera | Analog |\n|---------|-----------|--------|\n| Çözünürlük | 4MP-12MP | 2MP-8MP |\n| Kablolama | Cat6 (PoE) | Koaksiyel |\n| Mesafe | 100m (PoE) | 500m (koaks) |\n| Kayıt | NVR | DVR/XVR |\n| Fiyat | Biraz pahalı | Daha uygun |\n| Gelecek | ✅ Standart | ⚠️ Eskiyor |\n\n💡 Yeni proje = IP tercih edin!",

  "wifi_kablolu": "📊 **WiFi vs Kablolu Kamera:**\n\n| Özellik | WiFi | Kablolu (PoE) |\n|---------|------|---------------|\n| Kurulum | Kolay (DIY) | Teknik gerekir |\n| Güvenilirlik | Sinyal bağımlı | %100 stabil |\n| Mesafe | 30-50m | 100m |\n| Gecikme | Var (0.5-2sn) | Yok |\n| Fiyat | Daha uygun | Biraz pahalı |\n| İdeal | Ev (1-4 kamera) | İş yeri (4+) |\n\n💡 1-4 kamera = WiFi, 4+ kamera = Kablolu!",

  "dome_bullet": "📊 **Dome vs Bullet Kamera:**\n\n| Özellik | Dome | Bullet |\n|---------|------|--------|\n| Tasarım | Kubbe (gizli) | Silindir (belirgin) |\n| İç/Dış | İç mekan | Dış mekan |\n| Vandal | Dayanıklı | Normal |\n| IR Mesafe | 20-30m | 30-80m |\n| Yön | Belli olmaz | Belli (caydırıcı) |\n\n💡 İç mekan = Dome, dış mekan = Bullet!",

  "hikvision_dahua": "📊 **Hikvision vs Dahua:**\n\n| Özellik | Hikvision | Dahua |\n|---------|-----------|-------|\n| Pazar payı | #1 Dünya | #2 Dünya |\n| AI | AcuSense | SMD Plus |\n| Gece görüş | ColorVu | Starlight/TiOC |\n| Fiyat | Biraz yüksek | Biraz uygun |\n| Uygulama | Hik-Connect | DMSS |\n| Garanti | 3 yıl | 3 yıl |\n\n💡 İkisi de mükemmel! Fiyat farkı %5-10 arası.",

  "ajax_kale": "📊 **Ajax vs Kale Alarm:**\n\n| Özellik | Ajax | Kale |\n|---------|------|------|\n| Tip | Kablosuz | Kablolu/Karma |\n| Menzil | 2000m | Kabloya bağlı |\n| Pil ömrü | 7 yıl | Kablolu |\n| Tasarım | Premium | Standart |\n| App | Çok iyi | Temel |\n| Fiyat | Pahalı | Uygun |\n\n💡 Bütçe = Kale, kalite = Ajax!",

  "yale_desi": "📊 **Yale vs Desi Akıllı Kilit:**\n\n| Özellik | Yale | Desi |\n|---------|------|------|\n| Menşei | İsveç | Türkiye |\n| Açma yöntemleri | 5-6 | 4-5 |\n| Tasarım | Modern | Klasik |\n| App | Yale Access | Desi |\n| Fiyat | Pahalı | Orta |\n| Servis | Yaygın | Çok yaygın |\n\n💡 Tasarım = Yale, fiyat/servis = Desi!",
};

// ═══════════════════════════════════════════
// TURKISH NORMALIZER — yazım hatası toleransı
// ═══════════════════════════════════════════

/**
 * Türkçe karakterleri ASCII'ye çevirir + yaygın yazım hatalarını düzeltir.
 * "ücretsiz" = "ucretsiz", "şiir" = "siir", "kaç" = "kac"
 */
function normalizeTurkish(text: string): string {
  return text
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/[?.,!;:'"]/g, "")
    .trim();
}

// ═══════════════════════════════════════════
// SEARCH FUNCTION
// ═══════════════════════════════════════════

/** Fuzzy match score (0-100) */
function fuzzyScore(input: string, target: string): number {
  const a = input.toLowerCase();
  const b = target.toLowerCase();
  if (a === b) return 100;
  if (b.includes(a)) return 80;
  if (a.includes(b)) return 70;

  // Word overlap
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  let matches = 0;
  for (const aw of aWords) {
    if (aw.length < 2) continue;
    for (const bw of bWords) {
      if (bw.includes(aw) || aw.includes(bw)) matches++;
    }
  }
  return Math.min((matches / Math.max(aWords.length, 1)) * 60, 60);
}

/** Search FAQ database */
export function searchFAQ(query: string): FAQEntry | null {
  const normalized = query.toLowerCase().trim();
  const turkishNorm = normalizeTurkish(query);

  // Regex match — test both original and Turkish-normalized
  for (const faq of FAQ_DATABASE) {
    for (const pattern of faq.patterns) {
      if (pattern.test(normalized) || pattern.test(turkishNorm)) return faq;
    }
  }

  // Fuzzy match against both original and normalized question
  let bestScore = 0;
  let bestMatch: FAQEntry | null = null;
  for (const faq of FAQ_DATABASE) {
    const score1 = fuzzyScore(normalized, faq.question);
    const score2 = fuzzyScore(turkishNorm, normalizeTurkish(faq.question));
    const score = Math.max(score1, score2);
    if (score > bestScore && score > 35) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestMatch;
}

/** Search casual database */
export function searchCasual(query: string): string | null {
  const normalized = query.toLowerCase().trim();
  const turkishNorm = normalizeTurkish(query);

  for (const entry of CASUAL_DATABASE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(normalized) || pattern.test(turkishNorm)) {
        const response = entry.responses[Math.floor(Math.random() * entry.responses.length)];

        // Special responses
        if (response === "POEM") return POEMS[Math.floor(Math.random() * POEMS.length)];
        if (response === "SONG") return SONGS[Math.floor(Math.random() * SONGS.length)];
        if (response === "JOKE") return JOKES[Math.floor(Math.random() * JOKES.length)];

        return response;
      }
    }
  }

  return null;
}

/** Search tech terms */
export function searchTechTerm(query: string): string | null {
  const normalized = normalizeTurkish(query);
  const words = normalized.split(/\s+/);

  // Exact word match only (no substring matching for short terms)
  for (const word of words) {
    if (word.length < 2) continue;
    const term = TECH_TERMS[word];
    if (term) return `📚 **${word.toUpperCase()}:** ${term}`;
  }

  // For longer terms (4+ chars), allow substring match
  for (const [key, value] of Object.entries(TECH_TERMS)) {
    if (key.length < 4) continue; // Skip short keys like "ir", "mp" — too many false positives
    if (normalized.includes(key)) return `📚 **${key.toUpperCase()}:** ${value}`;
  }

  // Check if user is explicitly asking about a term
  const askingAbout = normalized.match(/(.+?)\s*(ne(?:dir)?|ne\s*demek|nedir|anlat|açıkla)/);
  if (askingAbout) {
    const termQuery = askingAbout[1].trim();
    const term = TECH_TERMS[termQuery];
    if (term) return `📚 **${termQuery.toUpperCase()}:** ${term}`;
  }

  return null;
}

/** Search comparisons */
export function searchComparison(query: string): string | null {
  const normalized = normalizeTurkish(query);

  if (/ip.*analog|analog.*ip/i.test(normalized)) return COMPARISONS["ip_analog"];
  if (/wifi.*kablo|kablo.*wifi|kablosuz.*kablolu/i.test(normalized)) return COMPARISONS["wifi_kablolu"];
  if (/dome.*bullet|bullet.*dome/i.test(normalized)) return COMPARISONS["dome_bullet"];
  if (/hikvision.*dahua|dahua.*hikvision/i.test(normalized)) return COMPARISONS["hikvision_dahua"];
  if (/ajax.*kale|kale.*ajax/i.test(normalized)) return COMPARISONS["ajax_kale"];
  if (/yale.*desi|desi.*yale/i.test(normalized)) return COMPARISONS["yale_desi"];

  // Generic comparison request
  if (/karşılaştır|vs|fark.*ne|hangisi.*daha/i.test(normalized)) {
    return "🔍 Karşılaştırma yapabilirim! Şu seçeneklerden birini söyle:\n\n• IP vs Analog kamera\n• WiFi vs Kablolu kamera\n• Dome vs Bullet kamera\n• Hikvision vs Dahua\n• Ajax vs Kale alarm\n• Yale vs Desi akıllı kilit";
  }

  return null;
}

/** Get random creative content */
export function getCreativeContent(type: "poem" | "song" | "joke"): string {
  switch (type) {
    case "poem": return POEMS[Math.floor(Math.random() * POEMS.length)];
    case "song": return SONGS[Math.floor(Math.random() * SONGS.length)];
    case "joke": return JOKES[Math.floor(Math.random() * JOKES.length)];
  }
}
