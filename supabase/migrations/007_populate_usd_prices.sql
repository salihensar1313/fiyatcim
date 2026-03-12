-- ============================================================
-- 007: Mevcut ürünlere USD fiyat verisi ekleme
-- Kaynak: src/data/seed.ts
-- ============================================================

-- Alarm Sistemleri
UPDATE products SET price_usd = 220, sale_price_usd = 199 WHERE slug = 'ajax-starterkit-kablosuz-alarm-seti';
UPDATE products SET price_usd = 83, sale_price_usd = NULL WHERE slug = 'paradox-sp7000-alarm-paneli';
UPDATE products SET price_usd = 38, sale_price_usd = 34 WHERE slug = 'ajax-motionprotect-hareket-sensoru';
UPDATE products SET price_usd = 47, sale_price_usd = NULL WHERE slug = 'ajax-homesiren-kablosuz-siren';
UPDATE products SET price_usd = 17, sale_price_usd = NULL WHERE slug = 'paradox-dg75-hareket-dedektoru';
UPDATE products SET price_usd = 25, sale_price_usd = 22 WHERE slug = 'ajax-doorprotect-kapi-pencere-sensoru';

-- Güvenlik Kameraları
UPDATE products SET price_usd = 325, sale_price_usd = 285 WHERE slug = 'hikvision-4-kamerali-2mp-ip-set';
UPDATE products SET price_usd = 83, sale_price_usd = 75 WHERE slug = 'dahua-4mp-dome-ip-kamera';
UPDATE products SET price_usd = 140, sale_price_usd = NULL WHERE slug = 'hikvision-8mp-bullet-kamera';
UPDATE products SET price_usd = 125, sale_price_usd = 109 WHERE slug = 'hikvision-8-kanal-nvr-kayit-cihazi';
UPDATE products SET price_usd = 377, sale_price_usd = NULL WHERE slug = 'dahua-ptz-ip-kamera-25x-zoom';
UPDATE products SET price_usd = 99, sale_price_usd = 88 WHERE slug = 'hikvision-colorvu-renkli-gece-kamera';

-- Akıllı Ev Sistemleri
UPDATE products SET price_usd = 231, sale_price_usd = 208 WHERE slug = 'samsung-shp-dp609-akilli-kilit';
UPDATE products SET price_usd = 83, sale_price_usd = NULL WHERE slug = 'ajax-motioncam-fotografli-sensor';
UPDATE products SET price_usd = 31, sale_price_usd = NULL WHERE slug = 'ajax-wallswitch-akilli-role';
UPDATE products SET price_usd = 73, sale_price_usd = 65 WHERE slug = 'ajax-streetsiren-dis-mekan-siren';
UPDATE products SET price_usd = 29, sale_price_usd = NULL WHERE slug = 'ajax-leaksprotect-su-kacak-sensoru';
UPDATE products SET price_usd = 169, sale_price_usd = 153 WHERE slug = 'ajax-hub-2-plus-merkez-unite';

-- Geçiş Kontrol Sistemleri
UPDATE products SET price_usd = 255, sale_price_usd = 231 WHERE slug = 'zkteco-speedface-v5l-yuz-tanima';
UPDATE products SET price_usd = 88, sale_price_usd = NULL WHERE slug = 'zkteco-f22-parmak-izi-terminali';
UPDATE products SET price_usd = 728, sale_price_usd = NULL WHERE slug = 'zkteco-probg3060-motorlu-turnike';
UPDATE products SET price_usd = 12, sale_price_usd = NULL WHERE slug = 'zkteco-kr600e-kart-okuyucu';
UPDATE products SET price_usd = 299, sale_price_usd = 265 WHERE slug = 'hikvision-ds-k1t671m-yuz-tanima-paneli';
UPDATE products SET price_usd = 146, sale_price_usd = 130 WHERE slug = 'dahua-asi7214y-video-interkom';
