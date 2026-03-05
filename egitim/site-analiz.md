# NETADAM.NET — Site Analiz Raporu

> **Tarih:** 2026-02-15
> **Analiz Eden:** STRATEJİ + TEKNİK + LİDER (Birleşik Analiz)
> **Kapsam:** Tasarım sistemi, mevcut içerik envanteri, sitemap yapısı, SEO durumu

---

## 1. TASARIM SİSTEMİ ANALİZİ

### 1.1 Renk Paleti

| Kullanım | Renk | Hex Kodu | Notlar |
|----------|------|----------|--------|
| Primary (Ana Mavi) | Cyan-Blue | `#6EC1E4` | Linkler, vurgular |
| Accent (CTA/Kırmızı) | Kırmızı | `#D30F15` | Butonlar, top bar |
| Accent (Yeşil) | Yeşil | `#61CE70` | Başarı/onay sinyalleri |
| Metin (Ana) | Koyu Gri | `#1F2933` | Body text |
| Metin (İkincil) | Orta Gri | `#525252` | Alt metin |
| Metin (Soluk) | Açık Gri | `#8F8F8F`, `#A3A3A3` | Caption, meta |
| Arka Plan (Açık) | Açık Gri | `#F5F5F5` | Bölüm arka planları |
| Arka Plan (Koyu) | Siyah | `#0C0C0C`, `#0F0F0F` | Footer, koyu bölümler |
| Nötr (Beyaz) | Beyaz | `#FFFFFF` | Ana zemin |

**Değerlendirme:** Renk paleti profesyonel ve B2B'ye uygun. Kırmızı CTA rengi dikkat çekici. Blog içeriklerinde `.alb-*` CSS sınıflarımız için bu paletten uyarlama yapılmalı.

### 1.2 Tipografi

| Parametre | Değer |
|-----------|-------|
| **Ana Font** | Inter |
| **Heading Ağırlığı** | 600 (Semi-bold) |
| **Body Ağırlığı** | 400 (Regular) |
| **H1 Boyutu** | 64px (desktop) |
| **H2 Boyutu** | 32px |
| **H3 Boyutu** | 24px |
| **H4 Boyutu** | 18px |
| **Body Boyutu** | 14px |
| **Küçük Metin** | 13px |
| **Line Height (H1)** | 72px |
| **Line Height (Body)** | 24px |

**Değerlendirme:** Inter fontu modern ve profesyonel, B2B için ideal. Body 14px mobilde küçük kalabilir — blog içeriklerinde 16px kullanılmalı.

### 1.3 Buton & UI Elementleri

| Element | Stil |
|---------|------|
| **Primary Button** | Arka plan: `#D30F15`, renk: beyaz, border-radius: `99px` (pill) |
| **Button Padding** | 10px dikey / 24px yatay |
| **Secondary Button** | Arka plan: `#F5F5F5`, renk: koyu |
| **Tab Navigasyon** | 80px border-radius, 16px padding |
| **Aktif Tab** | Beyaz arka plan |
| **Pasif Tab** | `#F5F5F5` arka plan |

### 1.4 Layout & Grid

| Parametre | Değer |
|-----------|-------|
| **Container Max-width** | 1150px (desktop) |
| **Tablet Breakpoint** | 1024px |
| **Mobil Breakpoint** | 767px |
| **Grid Sistemi** | CSS Grid + Flexbox |
| **Standart Gap** | 20px, 50px |
| **Border-radius (Standart)** | 6px |
| **Border-radius (Kart)** | 16px, 20px |
| **Border-radius (Buton)** | 99px (pill) |

### 1.5 Header & Footer

| Element | Detay |
|---------|-------|
| **Logo** | 130px x 42px |
| **Top Bar** | Kırmızı (`#D30F15`) arka plan, beyaz metin |
| **İkon Boyutu** | 20px |
| **CSS Framework** | Elementor tabanlı |
| **CMS** | WordPress + Yoast SEO |

### 1.6 Blog İçerik için CSS Uyarlama Önerisi

Blog içeriklerinde site temasıyla uyumlu olması için `.alb-*` sınıflarında şu uyarlamalar yapılmalı:

| Referans (alb) | Site Uyarlama |
|----------------|---------------|
| Accent: `#d4a574` (altın) | `#D30F15` (site kırmızısı) veya `#6EC1E4` (site mavisi) |
| Font: Segoe UI | Inter (site fontu) |
| Body: 16px | 16px (referanstaki gibi, site 14px'ten büyük) |
| Container: 900px | 900px (site 1150px container içinde) |
| CTA arka plan | `#D30F15` (site CTA rengi) |

---

## 2. MEVCUT BLOG ANALİZİ: "Maliyet Muhasebesi Nedir?"

### 2.1 Genel Bilgi

| Parametre | Değer | Değerlendirme |
|-----------|-------|---------------|
| **URL** | `/maliyet-muhasebesi-nedir/` | URL yapısı uygun |
| **Yayın Tarihi** | 2026-02-10 | Güncel |
| **Yazar** | Admin | KIRMIZI BAYRAK — Anonim yazar |
| **Kelime Sayısı** | ~484 kelime | KIRMIZI BAYRAK — Thin content |
| **Kategoriler** | ERP Kaynakları, Muhasebe, Ön Muhasebe | Çok fazla kategori |

### 2.2 İçerik Kalite Skorkartı

| Kriter | Puan | Max | Notlar |
|--------|------|-----|--------|
| Kelime Sayısı | 0 | 5 | 484 kelime — minimum 2000 olmalı |
| Heading Yapısı | 2 | 5 | H1 var ama H2/H3 derinliği yetersiz |
| Görsel | 1 | 5 | Tek görsel (hero), içerik boyunca sıfır |
| Tablo/Liste | 0 | 5 | Hiç tablo, info-box, feature-list yok |
| İç Link | 1 | 5 | Yetersiz iç linkleme |
| Dış Kaynak | 0 | 5 | Hiçbir dış referans/kaynak yok |
| FAQ | 0 | 5 | FAQ bölümü yok |
| CTA | 0 | 5 | Hiçbir CTA (demo, teklif) yok |
| Schema | 2 | 5 | Article + BreadcrumbList var, FAQ yok |
| E-E-A-T | 0 | 5 | Yazar "Admin", deneyim kanıtı sıfır |
| **TOPLAM** | **6** | **50** | **%12 — RED** |

### 2.3 Eksiklik Listesi

1. **484 kelime = Thin Content.** "Maliyet muhasebesi" konusu minimum 3000+ kelime gerektirir. Rakipler 2000-5000 kelime arasında.
2. **Yazar: "Admin"** — YMYL kapsamında finans/muhasebe içeriğinde anonim yazar kabul edilemez.
3. **Görsel: Sadece 1 hero.** 484 kelimelik metinde bile en az 2-3 görsel/tablo olmalı.
4. **CTA: Sıfır.** Hiçbir dönüşüm hedefi yok — iş değeri sıfır.
5. **İç Link: Yetersiz.** Muhasebe programı, genel muhasebe, ERP sayfalarına link yok.
6. **FAQ: Yok.** FAQPage schema fırsatı kaçırılmış.
7. **E-E-A-T: Sıfır.** Deneyim kanıtı, kaynak, referans — hiçbiri yok.
8. **Metin Duvarı:** Bileşen çeşitliliği sıfır — paragraf paragraf paragraf.
9. **Meta Description:** Generic, CTA yok.
10. **Mevzuat referansı yok:** TMS/TFRS standardları hiç belirtilmemiş.

### 2.4 LİDER Kararı

> **RED. Bu içerik thin content. 484 kelimeyle "Maliyet Muhasebesi Nedir?" sorusuna cevap vermek imkansız. Rakipler minimum 2000 kelime. E-E-A-T sinyali sıfır. CTA yok. Görsel yok. Temelden yeniden yazılacak.**

---

## 3. SİTEMAP & İÇERİK ENVANTERİ ANALİZİ

### 3.1 Sitemap Yapısı Özet

| Sitemap | Sayfa Sayısı | İçerik |
|---------|-------------|--------|
| **post-sitemap.xml** | 32 | Blog yazıları |
| **page-sitemap.xml** | 13 | Statik sayfalar |
| **cozumler-sitemap.xml** | 27 | Çözüm/ürün sayfaları |
| **erp-programi-sitemap.xml** | 8 | ERP paket sayfaları |
| **net-x-erp-modul-sitemap.xml** | 30 | Net-X ERP modül sayfaları |
| **netx-woven-modul-sitemap.xml** | 9 | NetX Woven modül sayfaları |
| **dokuma-programi-sitemap.xml** | 4 | Dokuma ERP paketleri |
| **egitim-videolari-sitemap.xml** | 16 | Eğitim videoları |
| **haber-sitemap.xml** | 3 | Haberler |
| **category-sitemap.xml** | 15 | Kategoriler |
| **post_tag-sitemap.xml** | 41 | Tag sayfaları |
| **author-sitemap.xml** | 1 | Yazar (sadece "admin") |
| **TOPLAM** | **199** | |

### 3.2 Blog İçerikleri Tam Envanteri (32 yazı)

| # | URL (kısaltılmış) | Son Güncelleme | Konu Kategorisi |
|---|-------------------|---------------|-----------------|
| 1 | /kurumsal-kaynak-planlamasi-nedir/ | 2025-12-13 | ERP Genel |
| 2 | /erp-seciminde-yapilan-kritik-hatalar-nelerdir/ | 2025-12-26 | ERP Seçim |
| 3 | /erp-nedir/ | 2026-01-10 | ERP Genel |
| 4 | /erp-programi-egitimi-nasil-olmalidir/ | 2026-01-10 | ERP Eğitim |
| 5 | /ucretsiz-muhasebe-programi-kullanmak-dogru-olur-mu/ | 2026-01-10 | Muhasebe |
| 6 | /en-kolay-on-muhasebe-programi-nasil-olmalidir/ | 2026-01-10 | Ön Muhasebe |
| 7 | /proje-yonetim-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | Proje Yönetim |
| 8 | /teknik-servis-programi-yerine-excel-kullanmak-dogru-mudur/ | 2026-01-10 | Teknik Servis |
| 9 | /fabrika-uretim-takip-programi-nasil-olmalidir/ | 2026-01-10 | Üretim |
| 10 | /stok-takip-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | Stok |
| 11 | /siparis-takip-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | Sipariş |
| 12 | /personel-takip-sistemi-excel-ile-yonetilebilir-mi/ | 2026-01-10 | İK/Personel |
| 13 | /tekstil-erp-yazilimlarinin-kullanimi-dijital-donusum/ | 2026-01-10 | Tekstil/Sektörel |
| 14 | /saha-satis-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | Saha Satış |
| 15 | /crm-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | CRM |
| 16 | /satin-alma-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-10 | Satın Alma |
| 17 | /cari-hesabin-excelde-tutulmasi-zor-mudur/ | 2026-01-10 | Cari Hesap |
| 18 | /erp-ve-sap-ayni-mi-aralarindaki-farklar-nelerdir/ | 2026-01-10 | ERP Karşılaştırma |
| 19 | /on-muhasebe-programlari-ucretsiz-kullanilmali-midir/ | 2026-01-10 | Ön Muhasebe |
| 20 | /stok-takip-programi-excel-ile-yapilabilir-mi/ | 2026-01-10 | Stok |
| 21 | /fabrika-uretim-takip-programi-excel-ile-yapilabilir-mi/ | 2026-01-10 | Üretim |
| 22 | /siparis-takip-programi-excel-ile-yapilabilir-mi/ | 2026-01-10 | Sipariş |
| 23 | /puantaj-nedir-puantaj-cetveli-nasil-doldurulur/ | 2026-01-10 | İK/Personel |
| 24 | /uretim-takip-programinda-bom-nedir-.../ | 2026-01-21 | Üretim |
| 25 | /stok-ve-siparis-takip-programi-ayni-sistem-icinde-mi-olmalidir/ | 2026-01-21 | Stok/Sipariş |
| 26 | /teklif-hazirlama-programini-ucretsiz-kullanmak-dogru-mudur/ | 2026-01-27 | Teklif |
| 27 | /talasli-imalat-programi-nedir/ | 2026-01-30 | Üretim/Sektörel |
| 28 | /uretim-takip-sistemi-nedir-isletmeler-icin-onemi-ve-faydalari/ | 2026-02-05 | Üretim |
| 29 | /muhasebe-nedir/ | 2026-02-05 | Muhasebe |
| 30 | /seri-ve-lot-numaralari-nedir-takibi-neden-onemlidir/ | 2026-02-07 | Stok/Üretim |
| 31 | /maliyet-muhasebesi-nedir/ | 2026-02-10 | Muhasebe |
| 32 | /enflasyon-muhasebesi-nedir-nasil-yapilir/ | 2026-02-13 | Muhasebe |

### 3.3 Çözüm Sayfaları (27 sayfa)

**Genel Yazılım Çözümleri:**
- erp-programi, muhasebe-programi, on-muhasebe-programi
- stok-takip-programi, siparis-takip-programi, uretim-takip-programi
- satin-alma-programi, cari-hesap-programi, teklif-hazirlama-programi
- crm-programi, mobil-saha-satis-programi, proje-yonetim-yazilimi
- teknik-servis-programi, barkod-programi, personel-takip-sistemi
- wms-depo-yonetim-sistemi

**E-Dönüşüm Çözümleri:**
- e-fatura-programi, e-arsiv-faturasi-programi
- e-defter-programi, e-irsaliye-programi

**E-Ticaret Entegrasyonları:**
- trendyol-api-entegrasyonu, tsoft-api-entegrasyonu

**Sektörel Çözümler:**
- tekstil-programi, corap-programi, orme-kumas-programi
- konfeksiyon-programi, fermuar-programi

### 3.4 ERP Paket Yapısı (8 paket)

| Paket | URL |
|-------|-----|
| Net-X Genel Modül | /netx-genel-modul-ve-ozellikler/ |
| E-Dönüşüm Çözümleri | /e-donusum-cozumleri/ |
| Net-X Elite | /net-x-elite/ |
| NetX Elite II | /netx-elite-ii/ |
| NetX Suite | /netx-suite/ |
| NetX ERP Suite | /netx-erp-suite/ |
| NetX ERP Suite II | /netx-erp-suite-ii/ |
| NetX Smart | /netx-smart/ |

### 3.5 Net-X ERP Modülleri (30 modül)

Ajandam, Banka Kredi Takip, Banka, Barkod, Basit Üretim Reçete, Bordro/Personel, Cari, Çek/Senet Takip, CRM, Depo Transfer, Dış Ticaret, E-Ticaret Entegrasyon, Fatura, Genel Muhasebe, İngilizce Muhasebe, Kalite Kontrol, Kasa, Mağazacılık, Masaüstü, NetX Tracker (El Terminali), Proje Takip, Rota Bazlı Üretim, Rusça Muhasebe, Sabit Kıymetler, Satın Alma, Servis Takip, Sipariş, Stok Programı, Stok Sayım, Suite Teklif Hazırlama

### 3.6 NetX Woven (Dokuma) Modülleri (9 modül + 4 paket)

**Modüller:** Banka, Cari, Çek/Senet, Üretim, Fatura, Kasa, Satın Alma, Sipariş, Stok Sayım

**Paketler:** Woven ERP Suite I, II, III + Genel Modül Özellikler

### 3.7 Kategori Sayfaları (15 adet)

cari-hesap-blog, crm-surecleri-blog, erp-blog, konfeksiyon-blog, mobil-saha-satis-blog, muhasebe-blog, on-muhasebe-blog, personel-programi-blog, proje-yonetim-blog, satin-alma-blog, siparis-programi-blog, stok-blog, teklif-hazirlama-blog, teknik-servis-blog, uretim-blog

### 3.8 Tag Sayfaları (41 adet)

41 adet tag — büyük çoğunluğu düşük değerli ve SEO açısından sorunlu.

### 3.9 Eğitim Videoları (16 adet)

Ürün demo videoları mevcut — içeriklere embed edilebilir.

---

## 4. KRİTİK BULGULAR & SORUNLAR

### 4.1 Blog İçerik Sorunları

| # | Sorun | Ciddiyet | Detay |
|---|-------|----------|-------|
| 1 | **Thin Content Riski** | KRİTİK | 32 blog yazısının büyük çoğunluğu 500-800 kelime aralığında (maliyet muhasebesi: 484 kelime). Google Helpful Content System penaltı riski. |
| 2 | **Yazar: "Admin"** | KRİTİK | Tüm içeriklerde yazar "admin". YMYL kapsamında anonim yazar güvenilirlik sinyalini sıfırlar. |
| 3 | **Tekrarlayan İçerik Kalıbı** | YÜKSEK | 32 yazının ~15'i "X'i ücretsiz kullanmak doğru mudur?" veya "X Excel ile yapılabilir mi?" kalıbında. Monoton, AI-generated hissi. |
| 4 | **CTA Eksikliği** | YÜKSEK | Blog içeriklerinde demo/teklif CTA'sı yok veya çok zayıf. |
| 5 | **Görsel Yetersizliği** | YÜKSEK | İçeriklerde bileşen çeşitliliği yok — düz metin duvarları. |
| 6 | **FAQ Eksikliği** | ORTA | Hiçbir blog yazısında FAQ bölümü + FAQPage schema yok. |
| 7 | **İç Link Yetersiz** | YÜKSEK | Blog yazıları birbirine ve çözüm sayfalarına yeterince link vermiyor. |

### 4.2 Keyword Cannibalization Riskleri

| Keyword | Çakışan Sayfalar | Risk |
|---------|-----------------|------|
| "stok takip programı" | /stok-takip-programi/ + /stok-takip-programini-ucretsiz-.../ + /stok-takip-programi-excel-.../ | YÜKSEK |
| "sipariş takip programı" | /siparis-takip-programi/ + /siparis-takip-programini-ucretsiz-.../ + /siparis-takip-programi-excel-.../ | YÜKSEK |
| "üretim takip programı" | /uretim-takip-programi/ + /fabrika-uretim-takip-programi-nasil-.../ + /fabrika-uretim-takip-programi-excel-.../ + /uretim-takip-sistemi-nedir-.../ | ÇOK YÜKSEK |
| "muhasebe programı" | /muhasebe-programi/ + /ucretsiz-muhasebe-programi-.../ + /on-muhasebe-programi/ | YÜKSEK |
| "ERP" | /erp-nedir/ + /kurumsal-kaynak-planlamasi-nedir/ + /erp-programi/ | ORTA |

### 4.3 Yapısal Sorunlar

| # | Sorun | Detay |
|---|-------|-------|
| 1 | **Tag Enflasyonu** | 41 tag sayfası — çoğu düşük değerli, thin content. noindex yapılmalı veya konsolide edilmeli. |
| 2 | **Tek Yazar** | Site genelinde tek yazar: "admin". Author entity oluşturulmalı. |
| 3 | **Silo Yapısı Eksik** | Blog içerikleri topic cluster/silo yapısına göre organize değil. |
| 4 | **Pillar Page Yok** | Hiçbir kapsamlı pillar page mevcut değil. |
| 5 | **E-Dönüşüm İçerik Boşluğu** | E-fatura, e-arşiv, e-defter, e-irsaliye için blog/rehber içerik sıfır. Sadece çözüm sayfaları var. |

### 4.4 Olumlu Bulgular

| # | Güçlü Yan |
|---|-----------|
| 1 | **Geniş ürün kataloğu:** 30 modül + 27 çözüm sayfası — iç link hedefleri çok zengin. |
| 2 | **Eğitim videoları:** 16 video mevcut — içeriklere embed edilebilir (experience sinyali). |
| 3 | **Sektörel niş:** Dokuma/tekstil çözümleri rakiplerde az — differentiator. |
| 4 | **WordPress + Yoast:** SEO altyapısı mevcut, schema desteği hazır. |
| 5 | **Çözüm sayfaları kapsamlı:** E-dönüşüm, sektörel çözümler, entegrasyonlar var. |
| 6 | **URL yapısı temiz:** Türkçe karaktersiz, keyword içeren, kısa URL'ler. |

---

## 5. MEVCUT İÇERİK HARİTASI — KONU DAĞILIMI

```
MEVCUT İÇERİK HARİTASI (32 Blog Yazısı)
=========================================

ERP Genel (4 yazı)
├── erp-nedir
├── kurumsal-kaynak-planlamasi-nedir
├── erp-seciminde-yapilan-kritik-hatalar
└── erp-ve-sap-ayni-mi

Muhasebe (5 yazı)
├── muhasebe-nedir
├── maliyet-muhasebesi-nedir
├── enflasyon-muhasebesi-nedir
├── ucretsiz-muhasebe-programi-kullanmak
└── on-muhasebe-programlari-ucretsiz

Üretim (5 yazı)
├── fabrika-uretim-takip-programi-nasil-olmalidir
├── fabrika-uretim-takip-programi-excel
├── uretim-takip-sistemi-nedir
├── uretim-takip-programinda-bom-nedir
└── talasli-imalat-programi-nedir

Stok (4 yazı)
├── stok-takip-programini-ucretsiz-kullanmak
├── stok-takip-programi-excel
├── stok-ve-siparis-takip-programi-ayni-sistem
└── seri-ve-lot-numaralari-nedir

Sipariş (2 yazı)
├── siparis-takip-programini-ucretsiz-kullanmak
└── siparis-takip-programi-excel

İK/Personel (2 yazı)
├── personel-takip-sistemi-excel
└── puantaj-nedir

Ön Muhasebe (2 yazı)
├── en-kolay-on-muhasebe-programi
└── on-muhasebe-programlari-ucretsiz

Diğer (8 yazı)
├── crm-programini-ucretsiz-kullanmak
├── satin-alma-programini-ucretsiz-kullanmak
├── saha-satis-programini-ucretsiz-kullanmak
├── proje-yonetim-programini-ucretsiz-kullanmak
├── teknik-servis-programi-yerine-excel
├── cari-hesabin-excelde-tutulmasi
├── teklif-hazirlama-programini-ucretsiz-kullanmak
└── erp-programi-egitimi-nasil-olmalidir

Sektörel (1 yazı)
└── tekstil-erp-yazilimlarinin-kullanimi

E-DÖNÜŞÜM BLOG İÇERİĞİ: 0 (SIFIR!)
```

---

## 6. CONTENT GAP ANALİZİ — EKSİK İÇERİKLER

### 6.1 Kritik Eksiklikler (Hemen Üretilmeli)

| # | Konu | Neden Kritik? |
|---|------|---------------|
| 1 | **E-Fatura Rehberi** | Çözüm sayfası var ama blog/rehber içerik yok. Search volume çok yüksek. |
| 2 | **E-Dönüşüm Kapsamlı Rehber** | Rakiplerde var, bizde sıfır. |
| 3 | **Stok Yönetimi Pillar Page** | 4 stok yazısı var ama pillar yok, cluster bağlantısız. |
| 4 | **ERP Seçim Rehberi (Kapsamlı)** | Mevcut yazılar yüzeysel. Kapsamlı karar rehberi lazım. |
| 5 | **Muhasebe Programı Karşılaştırma** | Commercial intent, yüksek değer. |

### 6.2 Mevcut İçeriklerin Durumu

| Durum | Sayı | Aksiyon |
|-------|------|---------|
| Temelden yeniden yazılacak | ~25 | Thin content, bileşen yok, E-E-A-T sıfır |
| İyileştirilebilir | ~5 | Kısmen iyi ama genişletilmeli |
| Kabul edilebilir | ~2 | Küçük düzeltmelerle yayında kalabilir |

---

## 7. İÇ LİNK FIRSAT HARİTASI

### Mevcut Bağlantı Potansiyeli

```
ÇÖZÜM SAYFALARI (27)  ←→  BLOG İÇERİKLERİ (32)  ←→  MODÜL SAYFALARI (30)
         ↕                         ↕                          ↕
   ERP PAKETLERİ (8)        EĞİTİM VİDEOLARI (16)    WOVEN MODÜLLER (9)
```

**Fırsat:** 27 çözüm sayfası + 30 modül sayfası = 57 potansiyel iç link hedefi. Her yeni blog yazısı bu sayfalara contextual link verebilir. Bu, rakiplerin çoğunda olmayan bir iç link avantajı.

---

## 8. ÖNCELİKLİ AKSİYON PLANI

### Acil (Hafta 1-2)
1. Author entity oluştur — "Admin" yerine gerçek yazar profili
2. Tag sayfalarını noindex yap veya konsolide et
3. Mevcut en iyi 5 blog yazısını belirle, genişletme planı yap

### Kısa Vade (Ay 1)
4. İlk pillar page: "ERP Yazılımı Rehberi" veya "Stok Yönetimi Rehberi"
5. E-Dönüşüm içerik serisine başla (e-fatura rehberi ilk)
6. Mevcut thin content'leri revize etmeye başla (en yüksek trafikli olanlardan)

### Orta Vade (Ay 1-3)
7. 5 silo yapısını oluştur (ERP, Finans, Stok, Üretim, Sektörel)
8. Her silo için 1 pillar + 3-5 cluster içerik üret
9. İç linkleme kampanyası — tüm mevcut sayfalar arası cross-link

---

> **LİDER notu:** "Mevcut 32 blog yazısının çoğu işe yaramaz durumda. Thin content, anonim yazar, CTA yok, bileşen yok. Temiz bir sayfa açıp kaliteli içerik üretmeye başlayacağız. Ama mevcut çözüm sayfaları ve modül sayfaları iyi bir altyapı — iç link hedefleri zengin. Bu avantajı kullanacağız."
