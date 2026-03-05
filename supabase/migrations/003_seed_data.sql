-- ==========================================
-- Fiyatcim.com — Demo Verileri (Seed Data)
-- 001 ve 002 çalıştırıldıktan SONRA çalıştırılmalı
-- ==========================================

-- ==========================================
-- KATEGORİLER (4 adet)
-- ==========================================
INSERT INTO public.categories (id, name, slug, image_url, sort_order) VALUES
  (gen_random_uuid(), 'Alarm Sistemleri', 'alarm-sistemleri', '/images/categories/alarm.png', 1),
  (gen_random_uuid(), 'Güvenlik Kameraları', 'guvenlik-kameralari', '/images/categories/kamera.png', 2),
  (gen_random_uuid(), 'Akıllı Ev Sistemleri', 'akilli-ev-sistemleri', '/images/categories/akilli-ev.png', 3),
  (gen_random_uuid(), 'Geçiş Kontrol Sistemleri', 'gecis-kontrol-sistemleri', '/images/categories/gecis-kontrol.png', 4);

-- ==========================================
-- MARKALAR (6 adet)
-- ==========================================
INSERT INTO public.brands (id, name, slug, logo_url) VALUES
  (gen_random_uuid(), 'Hikvision', 'hikvision', '/images/brands/hikvision.png'),
  (gen_random_uuid(), 'Dahua', 'dahua', '/images/brands/dahua.png'),
  (gen_random_uuid(), 'Ajax', 'ajax', '/images/brands/ajax.png'),
  (gen_random_uuid(), 'Paradox', 'paradox', '/images/brands/paradox.png'),
  (gen_random_uuid(), 'ZKTeco', 'zkteco', '/images/brands/zkteco.png'),
  (gen_random_uuid(), 'Samsung', 'samsung', '/images/brands/samsung.png');

-- ==========================================
-- ÜRÜNLER (24 adet)
-- Kategoriler ve markalar slug üzerinden referans alınıyor
-- ==========================================
INSERT INTO public.products (id, name, slug, sku, category_id, brand_id, price, sale_price, stock, critical_stock, tax_rate, warranty_months, shipping_type, is_active, short_desc, description, specs, images, seo_title, seo_desc, created_at)
VALUES
-- Alarm Sistemleri
(gen_random_uuid(),
 'Ajax StarterKit Kablosuz Alarm Seti',
 'ajax-starterkit-kablosuz-alarm-seti',
 'ALR-001',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 8500, 7650, 25, 5, 20, 24, 'kargo', true,
 'Hub, hareket sensörü, kapı sensörü ve uzaktan kumanda dahil profesyonel kablosuz alarm seti.',
 'Ajax StarterKit, evinizi veya iş yerinizi koruma altına alan profesyonel kablosuz güvenlik sistemidir. Jeweller kablosuz protokolü ile 2000 metreye kadar iletişim mesafesi sunar. Akıllı telefon uygulaması üzerinden anlık bildirimler alabilir, sistemi uzaktan kontrol edebilirsiniz. Pil ömrü 7 yıla kadar uzun süre dayanır.',
 '{"İletişim": "Jeweller 868 MHz", "Menzil": "2000m açık alan", "Pil Ömrü": "7 yıl", "Sensör Sayısı": "100 adede kadar", "Uygulamalar": "iOS / Android", "Bağlantı": "Ethernet + 2G/4G"}'::jsonb,
 '["/images/products/ajax-starterkit-1.jpg", "/images/products/ajax-starterkit-2.jpg"]'::jsonb,
 'Ajax StarterKit Kablosuz Alarm Seti - Fiyatcim',
 'Ajax StarterKit profesyonel kablosuz alarm seti. Hub, hareket sensörü, kapı sensörü dahil. 7 yıl pil ömrü.',
 '2024-06-01T00:00:00Z'),

(gen_random_uuid(),
 'Paradox SP7000 Alarm Paneli',
 'paradox-sp7000-alarm-paneli',
 'ALR-002',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'paradox'),
 3200, NULL, 40, 5, 20, 24, 'kargo', true,
 '16 zone genişletilebilir hırsız alarm paneli. StayD modu ve transit zone desteği.',
 'Paradox SP7000, 16 zona kadar genişletilebilir profesyonel alarm paneli. StayD modu sayesinde evde olduğunuzda da güvenliğinizi sağlar. 2 partition desteği ile farklı bölgeleri bağımsız kontrol edebilirsiniz. VDMP3 kablosuz genişletme modülü ile kablosuz detektörler eklenebilir.',
 '{"Zone": "16 (genişletilebilir 32)", "Partition": "2", "Çıkış": "PGM 4 adet", "Kullanıcı": "32", "Haberleşme": "IP / GPRS opsiyonel", "Güç": "700mA"}'::jsonb,
 '["/images/products/paradox-sp7000-1.jpg"]'::jsonb,
 'Paradox SP7000 Alarm Paneli - Fiyatcim',
 'Paradox SP7000 hırsız alarm paneli. 16 zone, 2 partition, StayD modu.',
 '2024-06-02T00:00:00Z'),

(gen_random_uuid(),
 'Ajax MotionProtect Hareket Sensörü',
 'ajax-motionprotect-hareket-sensoru',
 'ALR-003',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 1450, 1299, 60, 10, 20, 24, 'kargo', true,
 'Evcil hayvan dostu kablosuz hareket sensörü. 12m algılama mesafesi.',
 'Ajax MotionProtect, 20 kg''a kadar evcil hayvanları görmezden gelen akıllı hareket dedektörüdür. SmartDetect algoritması sayesinde yanlış alarmları en aza indirir. 12 metre algılama mesafesi ve 88.5° görüş açısı ile geniş alanları kapsar.',
 '{"Algılama": "12m", "Görüş Açısı": "88.5°", "Pil": "CR123A (5 yıl)", "Evcil Hayvan": "20 kg''a kadar", "Montaj": "Duvar / tavan", "Boyut": "110×65×50mm"}'::jsonb,
 '["/images/products/ajax-motion-1.jpg"]'::jsonb,
 'Ajax MotionProtect Hareket Sensörü - Fiyatcim',
 'Ajax MotionProtect kablosuz hareket sensörü. Evcil hayvan dostu, 12m mesafe.',
 '2024-06-03T00:00:00Z'),

(gen_random_uuid(),
 'Ajax HomeSiren Kablosuz Siren',
 'ajax-homesiren-kablosuz-siren',
 'ALR-004',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 1800, NULL, 35, 5, 20, 24, 'kargo', true,
 '105 dB iç mekan kablosuz siren. LED gösterge ve ayarlanabilir ses seviyesi.',
 'Ajax HomeSiren, 105 dB ses gücü ile alarm durumunda etkili uyarı sağlayan kablosuz iç mekan sirenidir. LED gösterge paneli sistem durumunu gösterir. Ses seviyesi ve siren süresi uygulama üzerinden ayarlanabilir.',
 '{"Ses Gücü": "105 dB", "Pil": "CR123A (5 yıl)", "Siren Süresi": "3-180 saniye", "LED": "Evet", "Menzil": "2000m", "Boyut": "200×65×52mm"}'::jsonb,
 '["/images/products/ajax-siren-1.jpg"]'::jsonb,
 'Ajax HomeSiren Kablosuz Siren - Fiyatcim',
 'Ajax HomeSiren 105 dB kablosuz iç mekan sireni. 5 yıl pil ömrü.',
 '2024-06-04T00:00:00Z'),

(gen_random_uuid(),
 'Paradox DG75 Hareket Dedektörü',
 'paradox-dg75-hareket-dedektoru',
 'ALR-005',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'paradox'),
 650, NULL, 80, 10, 20, 24, 'kargo', true,
 'Dijital hareket dedektörü. 11m algılama, evcil hayvan dostu.',
 'Paradox DG75, dijital sinyal işleme teknolojisi ile donatılmış hareket dedektörüdür. 11 metre algılama mesafesi ve geniş görüş açısı sunar. Evcil hayvan dostu modeli ile 18 kg''a kadar hayvanları görmezden gelir.',
 '{"Algılama": "11m", "Görüş Açısı": "90°", "Evcil Hayvan": "18 kg", "Besleme": "9-16 VDC", "Akım": "15mA", "Montaj Yük.": "2.3m"}'::jsonb,
 '["/images/products/paradox-dg75-1.jpg"]'::jsonb,
 'Paradox DG75 Hareket Dedektörü - Fiyatcim',
 'Paradox DG75 dijital hareket dedektörü. 11m algılama, evcil hayvan dostu.',
 '2024-06-05T00:00:00Z'),

(gen_random_uuid(),
 'Ajax DoorProtect Kapı/Pencere Sensörü',
 'ajax-doorprotect-kapi-pencere-sensoru',
 'ALR-006',
 (SELECT id FROM public.categories WHERE slug = 'alarm-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 950, 850, 70, 10, 20, 24, 'kargo', true,
 'Kablosuz manyetik kapı/pencere sensörü. Açılma anında anlık bildirim.',
 'Ajax DoorProtect, kapı ve pencerelerin açılmasını algılayan kablosuz manyetik kontaktördür. Reed switch teknolojisi ile güvenilir çalışma sağlar. 2 cm''ye kadar açıklık mesafesinde tetiklenir.',
 '{"Tip": "Manyetik kontak", "Pil": "CR123A (7 yıl)", "Menzil": "2000m", "Boyut": "63×11mm", "Ağırlık": "18g", "Çalışma Sıcaklığı": "-10°C ~ +40°C"}'::jsonb,
 '["/images/products/ajax-door-1.jpg"]'::jsonb,
 'Ajax DoorProtect Kapı Sensörü - Fiyatcim',
 'Ajax DoorProtect kablosuz kapı/pencere sensörü. 7 yıl pil ömrü, anlık bildirim.',
 '2024-06-06T00:00:00Z'),

-- Güvenlik Kameraları
(gen_random_uuid(),
 'Hikvision 4 Kameralı 2MP IP Set',
 'hikvision-4-kamerali-2mp-ip-set',
 'KAM-001',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'hikvision'),
 12500, 10990, 15, 3, 20, 36, 'kurulum', true,
 '4 adet 2MP IP kamera + NVR + HDD dahil komple güvenlik kamera seti.',
 'Hikvision 4 kameralı IP güvenlik seti ile ev veya iş yerinizi 7/24 izleyin. 2MP Full HD çözünürlükte kristal netliğinde görüntü. 30 metre gece görüşü, IP67 su geçirmezlik. 1TB HDD dahil, 4 kanal NVR kayıt cihazı ile birlikte.',
 '{"Çözünürlük": "2MP (1080p)", "Kamera Sayısı": "4", "NVR": "4 Kanal", "HDD": "1TB", "Gece Görüşü": "30m IR", "Su Geçirmezlik": "IP67"}'::jsonb,
 '["/images/products/hikvision-4set-1.jpg", "/images/products/hikvision-4set-2.jpg"]'::jsonb,
 'Hikvision 4 Kameralı 2MP IP Set - Fiyatcim',
 'Hikvision 4 kameralı 2MP IP güvenlik seti. NVR + 1TB HDD dahil. 30m gece görüşü.',
 '2024-06-07T00:00:00Z'),

(gen_random_uuid(),
 'Dahua 4MP Dome IP Kamera',
 'dahua-4mp-dome-ip-kamera',
 'KAM-002',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'dahua'),
 3200, 2890, 45, 5, 20, 36, 'kargo', true,
 '4MP dome IP kamera. WDR, 30m IR gece görüşü, PoE destekli.',
 'Dahua 4MP Dome IP kamera, iç mekan için ideal güvenlik kamerasıdır. 120dB WDR ile zor aydınlatma koşullarında bile net görüntü sağlar. PoE ile tek kablo ile güç ve veri iletimi. Akıllı hareket algılama ve bölge ihlali tespit özellikleri.',
 '{"Çözünürlük": "4MP (2560x1440)", "Lens": "2.8mm", "WDR": "120dB", "IR": "30m", "PoE": "Evet", "Koruma": "IP67 / IK10"}'::jsonb,
 '["/images/products/dahua-dome-1.jpg"]'::jsonb,
 'Dahua 4MP Dome IP Kamera - Fiyatcim',
 'Dahua 4MP dome IP kamera. WDR, PoE, 30m IR gece görüşü.',
 '2024-06-08T00:00:00Z'),

(gen_random_uuid(),
 'Hikvision 8MP Bullet Kamera',
 'hikvision-8mp-bullet-kamera',
 'KAM-003',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'hikvision'),
 5400, NULL, 30, 5, 20, 36, 'kargo', true,
 '8MP (4K) bullet IP kamera. AcuSense insan/araç tespiti, 60m IR.',
 'Hikvision 8MP 4K çözünürlüklü bullet kamera. AcuSense teknolojisi ile yalnızca insan ve araç hareketlerinde alarm verir, yanlış alarmları %98 oranında azaltır. 60 metre IR gece görüşü ile geniş dış mekan alanlarını gece bile net izleyebilirsiniz.',
 '{"Çözünürlük": "8MP (4K)", "Lens": "2.8mm", "AcuSense": "İnsan/Araç", "IR": "60m", "WDR": "130dB", "Koruma": "IP67"}'::jsonb,
 '["/images/products/hikvision-bullet-1.jpg"]'::jsonb,
 'Hikvision 8MP Bullet Kamera - Fiyatcim',
 'Hikvision 8MP 4K bullet kamera. AcuSense AI, 60m gece görüşü, IP67.',
 '2024-06-09T00:00:00Z'),

(gen_random_uuid(),
 'Hikvision 8 Kanal NVR Kayıt Cihazı',
 'hikvision-8-kanal-nvr-kayit-cihazi',
 'KAM-004',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'hikvision'),
 4800, 4200, 20, 3, 20, 36, 'kargo', true,
 '8 kanal 4K NVR kayıt cihazı. 2 SATA, PoE destekli.',
 'Hikvision 8 kanal NVR, 8MP (4K) çözünürlüğe kadar kayıt yapabilen profesyonel ağ video kayıt cihazıdır. 8 PoE portu sayesinde kameralara tek kablo ile güç ve veri sağlar. 2 SATA portu ile 20TB''a kadar depolama kapasitesi.',
 '{"Kanal": "8", "Çözünürlük": "4K (8MP)", "PoE": "8 port", "SATA": "2 (max 20TB)", "Bant Genişliği": "80Mbps", "HDMI": "4K çıkış"}'::jsonb,
 '["/images/products/hikvision-nvr-1.jpg"]'::jsonb,
 'Hikvision 8 Kanal NVR - Fiyatcim',
 'Hikvision 8 kanal 4K NVR kayıt cihazı. 8 PoE, 2 SATA depolama.',
 '2024-06-10T00:00:00Z'),

(gen_random_uuid(),
 'Dahua PTZ IP Kamera 25x Zoom',
 'dahua-ptz-ip-kamera-25x-zoom',
 'KAM-005',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'dahua'),
 14500, NULL, 8, 2, 20, 36, 'kurulum', true,
 '4MP PTZ IP kamera. 25x optik zoom, 200m IR, otomatik takip.',
 'Dahua 4MP PTZ kamera, 25x optik zoom ile uzak mesafelerden detaylı görüntü almanızı sağlar. 200 metre IR gece görüşü, otomatik nesne takibi ve akıllı analiz özellikleri ile profesyonel güvenlik çözümü sunar.',
 '{"Çözünürlük": "4MP", "Zoom": "25x Optik", "IR": "200m", "Pan/Tilt": "360°/90°", "Otomatik Takip": "Evet", "Koruma": "IP67 / IK10"}'::jsonb,
 '["/images/products/dahua-ptz-1.jpg"]'::jsonb,
 'Dahua PTZ 25x Zoom IP Kamera - Fiyatcim',
 'Dahua 4MP PTZ IP kamera. 25x optik zoom, 200m IR, otomatik takip.',
 '2024-06-11T00:00:00Z'),

(gen_random_uuid(),
 'Hikvision ColorVu Renkli Gece Kamera',
 'hikvision-colorvu-renkli-gece-kamera',
 'KAM-006',
 (SELECT id FROM public.categories WHERE slug = 'guvenlik-kameralari'),
 (SELECT id FROM public.brands WHERE slug = 'hikvision'),
 3800, 3400, 35, 5, 20, 36, 'kargo', true,
 '4MP ColorVu kamera. Gece bile renkli görüntü, sıcak LED aydınlatma.',
 'Hikvision ColorVu teknolojisi ile gece bile renkli görüntü elde edin. F1.0 geniş diyafram ve sıcak LED aydınlatma kombinasyonu ile 7/24 renkli izleme. Kişi ve araç tespiti ile akıllı güvenlik.',
 '{"Çözünürlük": "4MP", "ColorVu": "F1.0 sensör", "LED": "30m sıcak ışık", "WDR": "130dB", "Lens": "2.8mm", "Koruma": "IP67"}'::jsonb,
 '["/images/products/hikvision-colorvu-1.jpg"]'::jsonb,
 'Hikvision ColorVu Renkli Gece Kamera - Fiyatcim',
 'Hikvision 4MP ColorVu kamera. Gece renkli görüntü, F1.0 sensör.',
 '2024-06-12T00:00:00Z'),

-- Akıllı Ev Sistemleri
(gen_random_uuid(),
 'Samsung SHP-DP609 Akıllı Kilit',
 'samsung-shp-dp609-akilli-kilit',
 'AEV-001',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'samsung'),
 8900, 7990, 12, 3, 20, 24, 'kurulum', true,
 'Parmak izi + şifre + kart + Bluetooth ile açılan akıllı kapı kilidi.',
 'Samsung SHP-DP609, parmak izi, şifre, kart ve Bluetooth ile açılabilen premium akıllı kapı kilididir. Push-pull tasarımı ile kolay kullanım sağlar. 100 parmak izi, 100 şifre kaydedebilir. Otomatik kilitleme ve zorla açma alarmı özellikleri.',
 '{"Açma Yöntemi": "Parmak izi / Şifre / Kart / BT", "Parmak İzi": "100 kayıt", "Şifre": "100 kayıt", "Pil": "8x AA (12 ay)", "Uyarı": "Zorla açma alarmı", "Malzeme": "Çelik + alüminyum"}'::jsonb,
 '["/images/products/samsung-kilit-1.jpg"]'::jsonb,
 'Samsung SHP-DP609 Akıllı Kilit - Fiyatcim',
 'Samsung akıllı kapı kilidi. Parmak izi, şifre, kart, Bluetooth. Push-pull tasarım.',
 '2024-06-13T00:00:00Z'),

(gen_random_uuid(),
 'Ajax MotionCam Fotoğraflı Sensör',
 'ajax-motioncam-fotografli-sensor',
 'AEV-002',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 3200, NULL, 30, 5, 20, 24, 'kargo', true,
 'Hareket algıladığında fotoğraf çeken akıllı sensör. Anlık doğrulama.',
 'Ajax MotionCam, hareket algıladığında otomatik olarak fotoğraf çeken ve telefon uygulamanıza gönderen akıllı sensördür. Böylece alarmın gerçek olup olmadığını anında doğrulayabilirsiniz. PhOD ve Wings fotoğraf doğrulama teknolojileri.',
 '{"Fotoğraf": "640x480 / 320x240", "Algılama": "12m", "Pil": "CR123A (4 yıl)", "Menzil": "1700m", "Evcil Hayvan": "20 kg", "Gece": "IR LED"}'::jsonb,
 '["/images/products/ajax-motioncam-1.jpg"]'::jsonb,
 'Ajax MotionCam Fotoğraflı Sensör - Fiyatcim',
 'Ajax MotionCam hareket sensörü. Alarm anında fotoğraf, anlık doğrulama.',
 '2024-06-14T00:00:00Z'),

(gen_random_uuid(),
 'Ajax WallSwitch Akıllı Röle',
 'ajax-wallswitch-akilli-role',
 'AEV-003',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 1200, NULL, 50, 10, 20, 24, 'kargo', true,
 'Kablosuz akıllı röle. Aydınlatma ve cihaz kontrolü. 3kW güç.',
 'Ajax WallSwitch, mevcut aydınlatma ve elektrikli cihazlarınızı akıllı hale getiren kablosuz röledir. Uygulama üzerinden uzaktan açıp kapatabilir, zamanlayıcı ve otomasyon senaryoları oluşturabilirsiniz. 3kW''a kadar güç desteği.',
 '{"Güç": "3kW (13A)", "Besleme": "110-230V", "Kontrol": "Uzaktan / Otomasyon", "Menzil": "1100m", "Ölçüm": "Enerji tüketimi", "Boyut": "39×33×18mm"}'::jsonb,
 '["/images/products/ajax-wallswitch-1.jpg"]'::jsonb,
 'Ajax WallSwitch Akıllı Röle - Fiyatcim',
 'Ajax WallSwitch kablosuz akıllı röle. 3kW, uzaktan kontrol, otomasyon.',
 '2024-06-15T00:00:00Z'),

(gen_random_uuid(),
 'Ajax StreetSiren Dış Mekan Siren',
 'ajax-streetsiren-dis-mekan-siren',
 'AEV-004',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 2800, 2500, 20, 5, 20, 24, 'kargo', true,
 '113 dB dış mekan sireni. LED flaş, hava koşullarına dayanıklı.',
 'Ajax StreetSiren, 113 dB ses gücü ve parlak LED flaşı ile dış mekanda etkili caydırıcılık sağlar. IP54 korumalı, -25°C ile +50°C arası çalışma sıcaklığı. Tamper koruması ve anti-maskeleme özelliği.',
 '{"Ses Gücü": "113 dB", "LED": "Kırmızı/Beyaz flaş", "Pil": "4 yıl", "Koruma": "IP54", "Sıcaklık": "-25°C ~ +50°C", "Tamper": "Var"}'::jsonb,
 '["/images/products/ajax-streetsiren-1.jpg"]'::jsonb,
 'Ajax StreetSiren Dış Mekan Siren - Fiyatcim',
 'Ajax StreetSiren 113 dB dış mekan sireni. LED flaş, IP54 koruma.',
 '2024-06-16T00:00:00Z'),

(gen_random_uuid(),
 'Ajax LeaksProtect Su Kaçak Sensörü',
 'ajax-leaksprotect-su-kacak-sensoru',
 'AEV-005',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 1100, NULL, 45, 10, 20, 24, 'kargo', true,
 'Kablosuz su kaçak sensörü. Anında bildirim, pil ömrü 5 yıl.',
 'Ajax LeaksProtect, su baskını ve kaçaklarını tespit eden kablosuz sensördür. Alt yüzeyindeki 4 kontak noktası ile 0.5mm su seviyesini bile algılar. Banyo, mutfak, tesisat altları ve bodrum katlar için idealdir.',
 '{"Algılama": "0.5mm su", "Kontak": "4 nokta", "Pil": "CR2 (5 yıl)", "Menzil": "1300m", "Boyut": "Ø56×14mm", "Ağırlık": "34g"}'::jsonb,
 '["/images/products/ajax-leaks-1.jpg"]'::jsonb,
 'Ajax LeaksProtect Su Kaçak Sensörü - Fiyatcim',
 'Ajax LeaksProtect kablosuz su kaçak sensörü. 0.5mm algılama, 5 yıl pil.',
 '2024-06-17T00:00:00Z'),

(gen_random_uuid(),
 'Ajax Hub 2 Plus Merkez Ünite',
 'ajax-hub-2-plus-merkez-unite',
 'AEV-006',
 (SELECT id FROM public.categories WHERE slug = 'akilli-ev-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'ajax'),
 6500, 5900, 18, 3, 20, 24, 'kargo', true,
 '200 cihaz destekli merkez ünite. Ethernet + Wi-Fi + 2x SIM.',
 'Ajax Hub 2 Plus, 200 cihaza kadar bağlantı destekleyen gelişmiş merkez ünitedir. Ethernet, Wi-Fi ve çift SIM kart ile kesintisiz iletişim sağlar. Fotoğraf doğrulama ve alarm senaryoları desteği. Profesyonel güvenlik merkezi bağlantısı.',
 '{"Cihaz": "200 adede kadar", "Bağlantı": "Ethernet + Wi-Fi + 2G/4G", "SIM": "2x nano SIM", "Kullanıcı": "200", "Kamera": "25 IP kamera", "Pil Yedek": "15 saat"}'::jsonb,
 '["/images/products/ajax-hub2plus-1.jpg"]'::jsonb,
 'Ajax Hub 2 Plus Merkez Ünite - Fiyatcim',
 'Ajax Hub 2 Plus akıllı ev merkez ünitesi. 200 cihaz, Ethernet + Wi-Fi + 2G/4G.',
 '2024-06-18T00:00:00Z'),

-- Geçiş Kontrol Sistemleri
(gen_random_uuid(),
 'ZKTeco SpeedFace-V5L Yüz Tanıma Terminali',
 'zkteco-speedface-v5l-yuz-tanima',
 'GKS-001',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'zkteco'),
 9800, 8900, 10, 2, 20, 24, 'kurulum', true,
 'Yüz tanıma + avuç içi + parmak izi terminali. 5 inç dokunmatik ekran.',
 'ZKTeco SpeedFace-V5L, görünür ışık yüz tanıma teknolojisi ile maske takılı olsa bile kişileri tanıyabilen gelişmiş geçiş kontrol terminalidir. Avuç içi damar tanıma ve parmak izi seçenekleri ile çoklu doğrulama. 5 inç IPS dokunmatik ekran.',
 '{"Yüz Kapasitesi": "6.000", "Parmak İzi": "10.000", "Kart": "20.000", "Ekran": "5\" IPS", "Tanıma": "<0.5 saniye", "Bağlantı": "TCP/IP, Wi-Fi, USB"}'::jsonb,
 '["/images/products/zkteco-face-1.jpg"]'::jsonb,
 'ZKTeco SpeedFace Yüz Tanıma Terminali - Fiyatcim',
 'ZKTeco SpeedFace-V5L yüz tanıma ve parmak izi terminali. 6.000 yüz kapasitesi.',
 '2024-06-19T00:00:00Z'),

(gen_random_uuid(),
 'ZKTeco F22 Parmak İzi Terminali',
 'zkteco-f22-parmak-izi-terminali',
 'GKS-002',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'zkteco'),
 3400, NULL, 25, 5, 20, 24, 'kurulum', true,
 'SilkID parmak izi + şifre geçiş terminali. Wi-Fi destekli.',
 'ZKTeco F22, SilkID sensör teknolojisi ile kuru veya nemli parmaklarda bile hızlı tanıma yapan parmak izi terminaldir. 3.000 parmak izi kapasitesi. Wi-Fi bağlantısı sayesinde kablolama gerekmez. Pdoks ve personel takip yazılımları ile entegre.',
 '{"Parmak İzi": "3.000", "Kart": "5.000", "Kayıt": "100.000 olay", "Ekran": "2.4\" TFT", "Bağlantı": "TCP/IP, Wi-Fi, USB", "Besleme": "12V DC"}'::jsonb,
 '["/images/products/zkteco-f22-1.jpg"]'::jsonb,
 'ZKTeco F22 Parmak İzi Terminali - Fiyatcim',
 'ZKTeco F22 SilkID parmak izi terminali. 3.000 kayıt, Wi-Fi destekli.',
 '2024-06-20T00:00:00Z'),

(gen_random_uuid(),
 'ZKTeco ProBG3060 Motorlu Turnike',
 'zkteco-probg3060-motorlu-turnike',
 'GKS-003',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'zkteco'),
 28000, NULL, 5, 1, 20, 24, 'kurulum', true,
 'Motorlu cam kanatlı turnike. Anti-tailgating, acil durum modu.',
 'ZKTeco ProBG3060, şık tasarımlı motorlu cam kanatlı turnikedir. Anti-tailgating (arkadan geçme engeli) ve anti-clamp (sıkışma engeli) güvenlik özellikleri. Acil durumda kanatlar otomatik açılır. Parmak izi, kart, yüz tanıma terminalleri ile entegre çalışır.',
 '{"Tip": "Motorlu cam kanat", "Geçiş Hızı": "30-40 kişi/dk", "Kanat Genişliği": "600mm", "Motor": "DC Brushless", "Acil Durum": "Otomatik açılma", "Besleme": "220V AC"}'::jsonb,
 '["/images/products/zkteco-turnike-1.jpg"]'::jsonb,
 'ZKTeco ProBG3060 Motorlu Turnike - Fiyatcim',
 'ZKTeco motorlu cam kanatlı turnike. Anti-tailgating, acil durum modu.',
 '2024-06-21T00:00:00Z'),

(gen_random_uuid(),
 'ZKTeco KR600E Kart Okuyucu',
 'zkteco-kr600e-kart-okuyucu',
 'GKS-004',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'zkteco'),
 450, NULL, 100, 10, 20, 24, 'kargo', true,
 'RFID 125kHz proximity kart okuyucu. Wiegand 26/34 çıkış.',
 'ZKTeco KR600E, EM 125kHz proximity kartlarını okuyan kompakt kart okuyucudur. Wiegand 26/34 bit çıkış ile tüm geçiş kontrol panelleri ile uyumludur. IP65 su geçirmezlik ile dış mekanda kullanıma uygundur.',
 '{"Frekans": "125kHz EM", "Çıkış": "Wiegand 26/34", "Okuma": "3-10cm", "Koruma": "IP65", "Besleme": "12V DC", "Boyut": "86×86×18mm"}'::jsonb,
 '["/images/products/zkteco-kart-1.jpg"]'::jsonb,
 'ZKTeco KR600E Kart Okuyucu - Fiyatcim',
 'ZKTeco KR600E RFID proximity kart okuyucu. IP65, Wiegand çıkış.',
 '2024-06-22T00:00:00Z'),

(gen_random_uuid(),
 'Hikvision DS-K1T671M Yüz Tanıma Paneli',
 'hikvision-ds-k1t671m-yuz-tanima-paneli',
 'GKS-005',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'hikvision'),
 11500, 10200, 8, 2, 20, 24, 'kurulum', true,
 '7 inç yüz tanıma terminali. 6.000 yüz, maske algılama, ateş ölçer.',
 'Hikvision DS-K1T671M, 7 inç dokunmatik ekranlı gelişmiş yüz tanıma terminalidir. Maske takma algılama ve ateş ölçme özelliği ile sağlık güvenliği de sağlar. MinMoe deep learning algoritması ile 0.2 saniyede tanıma.',
 '{"Yüz": "6.000", "Kart": "100.000", "Ekran": "7\" IPS", "Tanıma": "<0.2s", "Maske": "Algılama var", "Bağlantı": "TCP/IP, Wi-Fi"}'::jsonb,
 '["/images/products/hikvision-face-1.jpg"]'::jsonb,
 'Hikvision Yüz Tanıma Terminali - Fiyatcim',
 'Hikvision DS-K1T671M yüz tanıma terminali. 7 inç ekran, maske algılama.',
 '2024-06-23T00:00:00Z'),

(gen_random_uuid(),
 'Dahua ASI7214Y Video İnterkom',
 'dahua-asi7214y-video-interkom',
 'GKS-006',
 (SELECT id FROM public.categories WHERE slug = 'gecis-kontrol-sistemleri'),
 (SELECT id FROM public.brands WHERE slug = 'dahua'),
 5600, 4990, 15, 3, 20, 24, 'kurulum', true,
 '7 inç IP video interkom iç ünite. Dokunmatik, PoE, SIP destekli.',
 'Dahua ASI7214Y, 7 inç dokunmatik ekranlı IP video interkom iç ünitesidir. Kapı zili çalındığında anlık görüntü ve sesli iletişim. SIP protokolü desteği ile telefon ile entegrasyon. PoE ile tek kablo bağlantı. Güvenlik kameraları ile entegre izleme.',
 '{"Ekran": "7\" IPS dokunmatik", "Çözünürlük": "1024×600", "PoE": "Evet", "SIP": "Evet", "Kamera": "Entegre izleme", "Montaj": "Duvar tipi"}'::jsonb,
 '["/images/products/dahua-interkom-1.jpg"]'::jsonb,
 'Dahua Video İnterkom İç Ünite - Fiyatcim',
 'Dahua ASI7214Y 7 inç IP video interkom. PoE, SIP, dokunmatik ekran.',
 '2024-06-24T00:00:00Z');

-- ==========================================
-- HERO SLIDES (3 adet)
-- ==========================================
INSERT INTO public.hero_slides (id, title, subtitle, image, cta_text, cta_link, sort_order, is_active) VALUES
  (gen_random_uuid(), 'Güvenlik Teknolojilerinde En İyi Fiyatlar', 'Uzman onaylı alarm, kamera ve akıllı ev sistemleri. Fiyatcim güvencesiyle alışveriş yapın, ücretsiz kargo fırsatını kaçırmayın.', '/images/hero/hero-main.png', 'Alışverişe Başla', '/urunler', 0, true),
  (gen_random_uuid(), '4K Güvenlik Kamera Setleri', 'Hikvision ve Dahua 4K kamera setleri ile kristal netliğinde görüntü. Tüm setlerde ücretsiz kurulum.', '/images/hero/hero-2.png', 'Kamera Setlerini İncele', '/kategori/guvenlik-kameralari', 1, true),
  (gen_random_uuid(), 'Akıllı Ev & Kilit Sistemleri', 'Parmak izi, yüz tanıma ve şifreli kilit çözümleri ile evinizi geleceğe taşıyın. 24 ay garanti.', '/images/hero/hero-3.png', 'Akıllı Ev Ürünleri', '/kategori/akilli-ev-sistemleri', 2, true);

-- ==========================================
-- TESTIMONIALS (4 adet)
-- ==========================================
INSERT INTO public.testimonials (id, name, company, comment, rating, sort_order) VALUES
  (gen_random_uuid(), 'Ahmet Yılmaz', 'Yılmaz Holding', 'Ofisimize kurulan güvenlik kamera sistemi mükemmel çalışıyor. Ekip çok profesyonel, kurulum süreci sorunsuz geçti. Gece görüntü kalitesi beklentimizin üzerinde.', 5, 0),
  (gen_random_uuid(), 'Fatma Demir', 'Demir Eczanesi', 'Ajax alarm sistemi sayesinde eczanemiz güvende. Telefon uygulaması çok kullanışlı, her yerden kontrol edebiliyorum. Teknik destek de çok ilgili.', 5, 1),
  (gen_random_uuid(), 'Mehmet Kaya', 'Kaya İnşaat', 'Şantiyelerimize geçiş kontrol sistemi kurdurduk. Parmak izi terminalleri çok hızlı ve güvenilir. Personel takibi artık çok kolay.', 4, 2),
  (gen_random_uuid(), 'Ayşe Özkan', 'Villamızın güvenliği', 'Villamıza komple güvenlik sistemi kurdurduk. Kameralar, alarm ve akıllı kilit hepsi bir arada çalışıyor. Ailecek çok memnunuz.', 5, 3);

-- ==========================================
-- BLOG POSTS (3 adet)
-- ==========================================
INSERT INTO public.blog_posts (id, title, slug, excerpt, content, image, category, is_published, created_at) VALUES
  (gen_random_uuid(),
   'Ev Güvenlik Sistemi Seçerken Dikkat Edilmesi Gereken 5 Nokta',
   'ev-guvenlik-sistemi-secerken-dikkat-edilmesi-gereken-5-nokta',
   'Eviniz için doğru güvenlik sistemini seçmek büyük önem taşır. Kablolu mu kablosuz mu, kaç kamera gerekli, alarm sistemi şart mı?',
   'Eviniz için doğru güvenlik sistemini seçmek büyük önem taşır...',
   '/images/blog/blog-1.jpg', 'Rehber', true, '2024-12-15T00:00:00Z'),

  (gen_random_uuid(),
   'IP Kamera ve Analog Kamera Arasındaki Farklar',
   'ip-kamera-analog-kamera-farklari',
   'Güvenlik kamerası alırken IP ve analog arasında kararsız mı kaldınız? İki teknolojinin avantaj ve dezavantajlarını karşılaştırıyoruz.',
   'IP kameralar ve analog kameralar arasında önemli farklar bulunmaktadır...',
   '/images/blog/blog-2.jpg', 'Teknik', true, '2024-12-20T00:00:00Z'),

  (gen_random_uuid(),
   'Akıllı Ev Güvenlik Sistemleri: 2025 Trendleri',
   'akilli-ev-guvenlik-2025-trendleri',
   'Yapay zeka destekli kameralar, kablosuz alarm sistemleri ve akıllı kilitler ile evinizi geleceğin teknolojisi ile koruyun.',
   '2025 yılında akıllı ev güvenlik sistemleri hızla gelişmeye devam ediyor...',
   '/images/blog/blog-3.jpg', 'Trend', true, '2025-01-10T00:00:00Z');

-- ==========================================
-- FAQs (8 adet)
-- ==========================================
INSERT INTO public.faqs (id, question, answer, category, sort_order) VALUES
  (gen_random_uuid(), 'Güvenlik sistemi kurulumu ne kadar sürer?', 'Kurulum süresi sistemin kapsamına göre değişir. Standart bir ev güvenlik sistemi (4 kamera + alarm) kurulumu genellikle 1 iş günü içinde tamamlanır. Büyük ölçekli projeler 2-5 iş günü sürebilir.', 'Kurulum', 0),
  (gen_random_uuid(), 'Ürünlerin garantisi ne kadar?', 'Tüm ürünlerimiz minimum 2 yıl üretici garantisi ile satılmaktadır. Güvenlik kameraları ve NVR cihazları 3 yıl garantiye sahiptir. Garanti süresince arızalanan ürünler ücretsiz onarılır veya değiştirilir.', 'Garanti', 1),
  (gen_random_uuid(), 'Kablolu mu kablosuz mu sistem tercih etmeliyim?', 'Her iki sistemin de avantajları vardır. Kablosuz sistemler (Ajax gibi) kolay kurulum ve estetik görünüm sunar. Kablolu sistemler ise kesintisiz güç ve yüksek güvenilirlik sağlar. İhtiyacınıza göre ücretsiz keşif hizmetimizde en uygun çözümü öneriyoruz.', 'Genel', 2),
  (gen_random_uuid(), 'Ücretsiz keşif hizmeti nasıl çalışır?', 'Bize ulaştığınızda teknik ekibimiz sizinle iletişime geçer ve uygun bir zamanda yerinize gelir. Mekanınızı inceleyerek güvenlik ihtiyaçlarınızı belirler ve size özel bir teklif hazırlar. Keşif hizmeti tamamen ücretsizdir.', 'Hizmet', 3),
  (gen_random_uuid(), 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', 'Kredi kartı (Visa, Mastercard, Troy), banka havalesi/EFT ve kapıda ödeme seçenekleri mevcuttur. Kredi kartına taksit imkanı sunuyoruz. Kurumsal fatura kesebiliyoruz.', 'Ödeme', 4),
  (gen_random_uuid(), 'Kargo ve teslimat süresi ne kadar?', 'Stokta bulunan ürünler aynı gün kargoya verilir. Kargo teslimat süresi İstanbul içi 1 gün, diğer şehirler 2-3 iş günüdür. 2.000₺ üzeri siparişlerde kargo ücretsizdir.', 'Kargo', 5),
  (gen_random_uuid(), 'İade ve değişim politikanız nedir?', 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde iade veya değişim yapabilirsiniz. Ürün kullanılmamış ve orijinal ambalajında olmalıdır. Kurulum hizmeti dahil ürünlerde farklı koşullar geçerlidir.', 'İade', 6),
  (gen_random_uuid(), 'Güvenlik kameralarını telefonumdan izleyebilir miyim?', 'Evet! Tüm IP kamera sistemlerimiz mobil uygulama desteği sunar. Hikvision için Hik-Connect, Dahua için gDMSS uygulamalarını kullanarak dünyanın her yerinden canlı izleme ve kayıt izleme yapabilirsiniz.', 'Teknik', 7);

-- ==========================================
-- TRUST BADGES (4 adet)
-- ==========================================
INSERT INTO public.trust_badges (id, title, description, icon, sort_order) VALUES
  (gen_random_uuid(), 'Ücretsiz Kargo', '2.000₺ üzeri siparişlerde ücretsiz kargo', 'Truck', 0),
  (gen_random_uuid(), 'Güvenli Ödeme', '256-bit SSL ile güvenli ödeme altyapısı', 'ShieldCheck', 1),
  (gen_random_uuid(), '7/24 Destek', 'Teknik destek hattımız her zaman açık', 'Headphones', 2),
  (gen_random_uuid(), '2 Yıl Garanti', 'Tüm ürünlerde minimum 2 yıl garanti', 'Award', 3);

-- ==========================================
-- KUPONLAR (4 adet)
-- ==========================================
INSERT INTO public.coupons (id, code, type, value, min_cart, max_uses, used_count, active, expiry) VALUES
  (gen_random_uuid(), 'HOSGELDIN', 'percent', 10, 500, 100, 0, true, '2026-12-31T23:59:59Z'),
  (gen_random_uuid(), 'YAZ2026', 'percent', 15, 1000, 50, 0, true, '2026-09-01T23:59:59Z'),
  (gen_random_uuid(), 'KARGO50', 'fixed', 50, 200, NULL, 0, true, '2026-12-31T23:59:59Z'),
  (gen_random_uuid(), 'AJAX20', 'percent', 20, 2000, 30, 0, true, '2026-06-30T23:59:59Z');

-- ==========================================
-- SITE AYARLARI
-- ==========================================
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"Fiyatcim.com"'),
  ('site_desc', '"Alarm, Güvenlik Kamerası ve Akıllı Ev Sistemleri"'),
  ('free_shipping_threshold', '2000'),
  ('default_shipping_fee', '49.90'),
  ('phone', '"+90 264 123 45 67"'),
  ('whatsapp', '"+905551234567"'),
  ('email', '"info@fiyatcim.com"'),
  ('address', '"Adapazarı, Sakarya"'),
  ('currency', '"TRY"'),
  ('tax_rate', '20')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ==========================================
-- SEO PAGES (Temel sayfalar)
-- ==========================================
INSERT INTO public.seo_pages (id, page_path, page_name, meta_title, meta_description) VALUES
  (gen_random_uuid(), '/', 'Ana Sayfa', 'Fiyatcim.com - Güvenlik Sistemleri | Alarm, Kamera, Akıllı Ev', 'Alarm sistemleri, güvenlik kameraları ve akıllı ev çözümleri en uygun fiyatlarla. Ücretsiz kargo, 2 yıl garanti.'),
  (gen_random_uuid(), '/urunler', 'Ürünler', 'Tüm Güvenlik Ürünleri - Fiyatcim.com', 'Hikvision, Dahua, Ajax, Paradox, ZKTeco marka güvenlik ürünleri. Alarm, kamera, akıllı kilit, geçiş kontrol.'),
  (gen_random_uuid(), '/blog', 'Blog', 'Güvenlik Rehberi & Blog - Fiyatcim.com', 'Güvenlik sistemleri hakkında rehber yazılar, karşılaştırmalar ve sektörel haberler.'),
  (gen_random_uuid(), '/hakkimizda', 'Hakkımızda', 'Hakkımızda - Fiyatcim.com', 'Fiyatcim.com olarak Adapazarı/Sakarya merkezli güvenlik sistemleri tedarik ve kurulum hizmeti sunuyoruz.'),
  (gen_random_uuid(), '/iletisim', 'İletişim', 'İletişim - Fiyatcim.com', 'Bize ulaşın. Ücretsiz keşif ve teklif için hemen arayın.');
