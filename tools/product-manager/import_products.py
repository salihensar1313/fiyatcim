"""Toplu urun import scripti — Tum kategoriler ve markalar."""

import json
import re
import sys
import time
from pathlib import Path

from supabase import create_client

CONFIG_PATH = Path(__file__).parent / "config.json"

# ─── Supabase baglanti (authenticated) ──────────────────
SESSION_PATH = Path(__file__).parent / ".session.json"

def get_client():
    cfg = json.loads(CONFIG_PATH.read_text("utf-8"))
    sb = create_client(cfg["supabase_url"], cfg["supabase_anon_key"])

    # RLS politikalari icin auth gerekli
    if SESSION_PATH.exists():
        sess = json.loads(SESSION_PATH.read_text("utf-8"))
        email = sess.get("email", "")
        if email and sess.get("pwd"):
            import base64, hashlib
            if sess.get("v") == 2:
                # XOR obfuscated format
                scramble_key = hashlib.sha256(email.encode("utf-8")).digest()[:16]
                obfuscated = base64.b64decode(sess["pwd"])
                pwd = bytes(b ^ scramble_key[i % len(scramble_key)] for i, b in enumerate(obfuscated)).decode("utf-8")
            else:
                pwd = base64.b64decode(sess["pwd"]).decode("utf-8")
            sb.auth.sign_in_with_password({"email": email, "password": pwd})
            print(f"  Auth: {email}")
    return sb

def slugify(text: str) -> str:
    """Turkce karakterleri donustur ve slug olustur."""
    tr = str.maketrans("çğıöşüÇĞİÖŞÜ", "cgiosuCGIOSU")
    s = text.translate(tr).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:120]

# ─── Kategori & Marka tanimlari ─────────────────────────
CATEGORIES = [
    {"name": "Alarm Sistemleri", "slug": "alarm-sistemleri", "sort_order": 1},
    {"name": "Kamera Sistemleri", "slug": "kamera-sistemleri", "sort_order": 2},
    {"name": "Akıllı Kilit", "slug": "akilli-kilit", "sort_order": 3},
    {"name": "Yangın Algılama", "slug": "yangin-algilama", "sort_order": 4},
]

BRANDS = [
    "Ajax", "Paradox", "Kale Alarm", "Roombanker", "Hikvision",
    "Dahua", "Neutron", "Ezviz", "HiLook", "Uniwiz", "Reolink",
    "İmou", "UNV", "Desi", "Blitzlock", "Yale", "Kale Kilit",
    "GST", "Teknim", "Sens",
]

# ─── USD/TRY kuru (yaklaşık) ────────────────────────────
USD_TRY = 36.5

# ─── Ürün verileri ──────────────────────────────────────
# Format: (name, sku, brand, category, price_usd, short_desc, description, specs, images)
# Fiyatlar satış fiyatı (USD). TRY otomatik hesaplanır.

PRODUCTS = []

# ═══════════════════════════════════════════════════════════
# ALARM — AJAX
# ═══════════════════════════════════════════════════════════
_ajax_alarm = [
    ("Ajax Hub 2 Plus", "AJAX-HB2P", 350, "Wi-Fi, Ethernet, 2x SIM destekli kontrol paneli",
     "Ajax Hub 2 Plus, fotoğraf doğrulama destekli kablosuz güvenlik kontrol paneli. Wi-Fi, Ethernet ve çift SIM kart bağlantısı ile kesintisiz iletişim sağlar. 200 cihaza kadar bağlantı.",
     {"Bağlantı": "Wi-Fi, Ethernet, 2G/3G/LTE", "Max Cihaz": "200", "Pil Yedek": "15 saat", "Frekans": "Jeweller 868 MHz"},
     ["https://ajax.systems/products/hub2-plus/"]),

    ("Ajax Hub 2 (4G)", "AJAX-HB24G", 280, "Ethernet ve çift SIM (4G) kontrol paneli",
     "Ajax Hub 2 (4G), fotoğraf doğrulamalı kablosuz kontrol paneli. Ethernet ve çift SIM kart ile 4G LTE bağlantı desteği.",
     {"Bağlantı": "Ethernet, 2G/3G/LTE", "Max Cihaz": "100", "Pil Yedek": "15 saat", "Frekans": "Jeweller 868 MHz"},
     ["https://ajax.systems/products/hub-2/"]),

    ("Ajax Hub 2 (2G)", "AJAX-HB22G", 220, "Ethernet ve çift SIM (2G) kontrol paneli",
     "Ajax Hub 2 (2G), ekonomik fotoğraf doğrulamalı kontrol paneli. Ethernet ve 2G SIM kart bağlantısı.",
     {"Bağlantı": "Ethernet, 2G", "Max Cihaz": "100", "Pil Yedek": "15 saat"},
     ["https://ajax.systems/products/hub-2/"]),

    ("Ajax StarterKit Cam Plus", "AJAX-KITCP", 580, "Hub 2 Plus, MotionCam, DoorProtect, SpaceControl seti",
     "Ajax StarterKit Cam Plus, fotoğraf doğrulamalı tam güvenlik seti. Hub 2 Plus, MotionCam, DoorProtect ve SpaceControl içerir.",
     {"İçerik": "Hub 2 Plus + MotionCam + DoorProtect + SpaceControl", "Frekans": "Jeweller"},
     ["https://ajax.systems/products/starterkit-cam-plus/"]),

    ("Ajax StarterKit Cam", "AJAX-KITC", 420, "Hub 2, MotionCam, DoorProtect, SpaceControl seti",
     "Ajax StarterKit Cam, fotoğraf doğrulama özellikli başlangıç güvenlik seti.",
     {"İçerik": "Hub 2 (2G) + MotionCam + DoorProtect + SpaceControl"},
     ["https://ajax.systems/products/starterkit-cam/"]),

    ("Ajax StarterKit", "AJAX-KIT", 320, "Hub, MotionProtect, DoorProtect, SpaceControl seti",
     "Ajax StarterKit, temel kablosuz güvenlik başlangıç seti. Hub, hareket dedektörü, kapı sensörü ve uzaktan kumanda içerir.",
     {"İçerik": "Hub + MotionProtect + DoorProtect + SpaceControl"},
     ["https://ajax.systems/products/starterkit/"]),

    ("Ajax MotionProtect", "AJAX-MP", 58, "Kablosuz kızılötesi hareket dedektörü",
     "Ajax MotionProtect, kablosuz PIR hareket dedektörü. 12 metre algılama mesafesi, evcil hayvan bağışıklığı ve 5 yıl pil ömrü.",
     {"Algılama": "12m, 88.5°", "Pil Ömrü": "5 yıl", "Evcil Hayvan": "20 kg'a kadar", "Frekans": "Jeweller"},
     ["https://ajax.systems/products/motionprotect/"]),

    ("Ajax MotionProtect Plus", "AJAX-MPP", 85, "PIR + mikrodalga hareket dedektörü",
     "Ajax MotionProtect Plus, çift teknolojili (PIR + mikrodalga) hareket dedektörü. Yanlış alarm oranını minimuma indirir.",
     {"Algılama": "12m", "Teknoloji": "PIR + K-band mikrodalga", "Pil Ömrü": "5 yıl"},
     ["https://ajax.systems/products/motionprotectplus/"]),

    ("Ajax MotionCam", "AJAX-MC", 130, "Fotoğraf doğrulamalı hareket dedektörü",
     "Ajax MotionCam, alarm anında fotoğraf çeken kablosuz PIR hareket dedektörü. Olay anını görsel olarak doğrulayın.",
     {"Algılama": "12m", "Fotoğraf": "Alarm anında çekim", "Çözünürlük": "640x480", "Pil Ömrü": "4 yıl"},
     ["https://ajax.systems/products/motioncam/"]),

    ("Ajax MotionCam Outdoor", "AJAX-MCO", 195, "Dış mekan fotoğraflı hareket dedektörü",
     "Ajax MotionCam Outdoor, dış mekan kullanımına uygun fotoğraf doğrulamalı hareket dedektörü. IP55 koruma.",
     {"Algılama": "15m", "Koruma": "IP55", "Fotoğraf": "Alarm anında", "Pil Ömrü": "3 yıl"},
     ["https://ajax.systems/products/motioncam-outdoor/"]),

    ("Ajax DoorProtect", "AJAX-DP", 35, "Kablosuz kapı/pencere açılma sensörü",
     "Ajax DoorProtect, kablosuz manyetik kontak sensörü. Kapı ve pencere açılmalarını anında bildirir.",
     {"Tip": "Reed switch", "Pil Ömrü": "7 yıl", "Mesafe": "2 cm"},
     ["https://ajax.systems/products/doorprotect/"]),

    ("Ajax DoorProtect Plus", "AJAX-DPP", 65, "Açılma, darbe ve eğim sensörü",
     "Ajax DoorProtect Plus, kapı açılma, darbe ve eğim algılayan gelişmiş manyetik kontak sensörü.",
     {"Tip": "Reed switch + akselerometre", "Algılama": "Açılma, darbe, eğim", "Pil Ömrü": "5 yıl"},
     ["https://ajax.systems/products/doorprotectplus/"]),

    ("Ajax GlassProtect", "AJAX-GP", 48, "Kablosuz cam kırılma dedektörü",
     "Ajax GlassProtect, cam kırılma sesini algılayan kablosuz dedektör. 9 metre mesafeden algılama.",
     {"Algılama": "9m", "Cam Kalınlığı": "3-30mm", "Pil Ömrü": "7 yıl"},
     ["https://ajax.systems/products/glassprotect/"]),

    ("Ajax KeyPad", "AJAX-KP", 75, "Kablosuz dokunmatik tuş takımı",
     "Ajax KeyPad, kablosuz dokunmatik güvenlik tuş takımı. Şifre ile sistemi kolayca kurma/devre dışı bırakma.",
     {"Tip": "Dokunmatik", "Pil Ömrü": "4 yıl", "Kod": "4-6 haneli"},
     ["https://ajax.systems/products/keypad/"]),

    ("Ajax KeyPad Plus", "AJAX-KPP", 120, "Şifreli + kartlı tuş takımı",
     "Ajax KeyPad Plus, şifre ve temassız kart destekli kablosuz tuş takımı. Şifreli kart kimlik doğrulama.",
     {"Tip": "Dokunmatik + NFC", "Pil Ömrü": "3.5 yıl", "Kart": "DESFire EV1/EV2"},
     ["https://ajax.systems/products/keypad-plus/"]),

    ("Ajax SpaceControl", "AJAX-SC", 28, "Kablosuz uzaktan kumanda (keyfob)",
     "Ajax SpaceControl, 4 butonlu kablosuz uzaktan kumanda. Kurma, devre dışı bırakma, gece modu ve panik butonu.",
     {"Buton": "4 adet", "Pil Ömrü": "5 yıl", "Panik": "Var"},
     ["https://ajax.systems/products/ajaxspacecontrol/"]),

    ("Ajax Button", "AJAX-BTN", 30, "Kablosuz panik butonu",
     "Ajax Button, kablosuz panik/akıllı buton. Acil durum bildirimi veya otomasyon senaryoları için.",
     {"Pil Ömrü": "5 yıl", "Fonksiyon": "Panik + otomasyon"},
     ["https://ajax.systems/products/button/"]),

    ("Ajax StreetSiren", "AJAX-SS", 95, "Kablosuz iç/dış mekan siren",
     "Ajax StreetSiren, yüksek sesli kablosuz siren. 113 dB ses seviyesi ile caydırıcı alarm.",
     {"Ses": "113 dB", "Koruma": "IP54", "Pil Ömrü": "5 yıl", "LED": "Var"},
     ["https://ajax.systems/products/streetsiren/"]),

    ("Ajax HomeSiren", "AJAX-HS", 45, "Kablosuz iç mekan siren",
     "Ajax HomeSiren, kompakt kablosuz iç mekan sireni. 105 dB ses seviyesi.",
     {"Ses": "105 dB", "Pil Ömrü": "5 yıl"},
     ["https://ajax.systems/products/homesiren/"]),

    ("Ajax MotionProtect Outdoor", "AJAX-MPO", 135, "Dış mekan hareket dedektörü",
     "Ajax MotionProtect Outdoor, dış mekan kullanımına uygun kablosuz PIR hareket dedektörü. Evcil hayvan bağışıklığı.",
     {"Algılama": "15m", "Koruma": "IP55", "Evcil Hayvan": "Var", "Pil Ömrü": "5 yıl"},
     ["https://ajax.systems/products/motionprotect-outdoor/"]),

    ("Ajax ReX 2", "AJAX-RX2", 120, "Kablosuz sinyal tekrarlayıcı",
     "Ajax ReX 2, Jeweller ve Wings protokollerini destekleyen kablosuz sinyal menzil genişletici.",
     {"Protokol": "Jeweller + Wings", "Pil Yedek": "26 saat"},
     ["https://ajax.systems/products/rex-2/"]),

    ("Ajax CombiProtect", "AJAX-CP", 72, "Hareket + cam kırılma dedektörü",
     "Ajax CombiProtect, PIR hareket ve cam kırılma algılayan kombine kablosuz dedektör.",
     {"Algılama": "PIR 12m + Cam 9m", "Pil Ömrü": "5 yıl"},
     ["https://ajax.systems/products/combiprotect/"]),

    ("Ajax MotionProtect Curtain", "AJAX-MPC", 55, "Perde tipi hareket dedektörü",
     "Ajax MotionProtect Curtain, dar açılı perde tipi kablosuz hareket dedektörü. Pencere ve kapı kenarları için.",
     {"Algılama": "15m, perde tipi", "Pil Ömrü": "3 yıl"},
     ["https://ajax.systems/products/motionprotect-curtain/"]),

    ("Ajax DualCurtain Outdoor", "AJAX-DCO", 140, "Çift yönlü dış mekan perde dedektörü",
     "Ajax DualCurtain Outdoor, çift yönlü algılamalı dış mekan kablosuz perde hareket dedektörü.",
     {"Algılama": "Çift yönlü, 15m", "Koruma": "IP55", "Pil Ömrü": "4 yıl"},
     ["https://ajax.systems/products/dualcurtain-outdoor/"]),

    ("Ajax WallSwitch", "AJAX-WS", 48, "Kablosuz güç rölesi",
     "Ajax WallSwitch, 110/230V güç hattını uzaktan kontrol eden kablosuz röle. Aydınlatma ve cihaz otomasyonu.",
     {"Gerilim": "110/230V~", "Max Yük": "3 kW", "Tip": "Güç rölesi"},
     ["https://ajax.systems/products/wallswitch/"]),

    ("Ajax MultiTransmitter", "AJAX-MT", 85, "18 cihaz entegrasyon modülü",
     "Ajax MultiTransmitter, 3. parti kablolu cihazları Ajax sistemine entegre eden kablosuz modül. 18 cihaza kadar.",
     {"Giriş": "18 kablolu cihaz", "Pil Yedek": "60 saat"},
     ["https://ajax.systems/products/multitransmitter/"]),
]

for name, sku, price, short, desc, specs, imgs in _ajax_alarm:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Ajax", "category": "Alarm Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 50,
    })

# ═══════════════════════════════════════════════════════════
# ALARM — ROOMBANKER
# ═══════════════════════════════════════════════════════════
_roombanker = [
    ("Roombanker Smart Hub", "RB-HUB", 180, "Akıllı güvenlik merkez kontrol ünitesi",
     "Roombanker Smart Hub, güvenlik ve otomasyon sisteminiz için merkezi iç mekan kontrol ünitesi. Tüm sensörler ve dedektörlerle iletişim kurar.",
     {"Tip": "Merkez Kontrol Ünitesi", "Bağlantı": "Wi-Fi + GSM", "Protokol": "RBF"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/smart-hub-roombanker.jpg"]),

    ("Roombanker PIR Sensör", "RB-PIR", 45, "Evcil hayvan bağışıklıklı ayarlanabilir PIR sensör",
     "Roombanker PIR Sensör, pasif kızılötesi teknolojisi ile hareket algılama. Ayarlanabilir hassasiyet ve evcil hayvan bağışıklığı.",
     {"Teknoloji": "PIR", "Evcil Hayvan": "Var", "Hassasiyet": "Ayarlanabilir", "Montaj": "Kablosuz duvar montaj"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/pir-sensor-roombanker.jpg"]),

    ("Roombanker Kapı Sensörü", "RB-DOOR", 30, "Kablosuz manyetik kapı alarm sensörü",
     "Roombanker Manyetik Kapı Sensörü, kapı ve pencere açılma durumunu izleyen kablosuz alarm sensörü. Yapıştırma bantla kolay montaj.",
     {"Tip": "Manyetik kontak", "Montaj": "Yapışkanlı bant", "Algılama": "Açılma"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/door-magnetic-sensor-roombanker.jpg"]),

    ("Roombanker Dış Mekan Dedektör", "RB-OUTDOOR", 85, "Çift teknolojili dış mekan hareket dedektörü",
     "Roombanker Dual-Tech Dış Mekan Dedektörü, PIR ve mikrodalga sensörlü çift teknolojili hareket algılama. 5 yıl pil ömrü.",
     {"Teknoloji": "PIR + Mikrodalga", "Pil Ömrü": "5 yıl", "Evcil Hayvan": "Var", "Koruma": "Dış mekan"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/outdoor-motion-detector-roombanker.jpg"]),

    ("Roombanker İç Mekan Siren", "RB-ISIREN", 40, "85-105 dB kablosuz iç mekan sireni",
     "Roombanker İç Mekan Sireni, 85-105 dB arası ayarlanabilir ses ve yanıp sönen LED ile caydırıcı alarm.",
     {"Ses": "85-105 dB", "LED": "Yanıp sönen", "Tip": "İç mekan"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/indoor-siren-roombanker.jpg"]),

    ("Roombanker Dış Mekan Siren", "RB-OSIREN", 65, "Solar güç destekli 105 dB dış mekan sireni",
     "Roombanker Dış Mekan Sireni, güneş paneli ve lityum pil ile 105 dB ses çıkışı. Su geçirmez tasarım.",
     {"Ses": "105 dB", "Güç": "Solar + Lityum pil", "Koruma": "Su geçirmez"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/outdoor-siren-roombanker.jpg"]),

    ("Roombanker Tuş Takımı", "RB-KEYPAD", 55, "Kablosuz güvenlik alarm tuş takımı",
     "Roombanker Alarm Tuş Takımı, alfanümerik klavye ile sistemi kolayca kurma ve devre dışı bırakma. Kompakt tasarım.",
     {"Tip": "Alfanümerik", "Montaj": "Kablosuz"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/alarm-keypad-roombanker.jpg"]),

    ("Roombanker Anahtarlık", "RB-KEYFOB", 22, "Güvenlik sistemi uzaktan kumanda anahtarlık",
     "Roombanker Anahtarlık, 2 özelleştirilebilir butonlu taşınabilir güvenlik sistemi uzaktan kumanda.",
     {"Buton": "2 özelleştirilebilir", "Tip": "Taşınabilir"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/keyfob-roombanker.jpg"]),

    ("Roombanker Panik Butonu", "RB-PANIC", 20, "Kablosuz taşınabilir panik butonu",
     "Roombanker Panik Butonu, yaşlılar ve ofis güvenliği için acil durum butonu. Masa altı montaj veya taşınabilir kullanım.",
     {"Tip": "Panik", "Kullanım": "Taşınabilir + Masa montaj"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/panic-button-roombanker.jpg"]),

    ("Roombanker Ev Güvenlik Kiti", "RB-KIT", 280, "Hub, PIR, kapı sensörü, anahtarlık dahil set",
     "Roombanker Ev Güvenlik Kiti, tam bir kablosuz güvenlik sistemi seti. Hub, PIR sensör, kapı sensörü ve anahtarlık içerir. Abonelik gerektirmez.",
     {"İçerik": "Hub + PIR + Kapı Sensörü + Anahtarlık", "Abonelik": "Yok"},
     ["https://www.roombanker.com/wp-content/uploads/2023/11/home-security-kit-roombanker.jpg"]),
]

for name, sku, price, short, desc, specs, imgs in _roombanker:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Roombanker", "category": "Alarm Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 30,
    })

# ═══════════════════════════════════════════════════════════
# ALARM — NEUTRON (önemli ürünler)
# ═══════════════════════════════════════════════════════════
_neutron = [
    ("Neutron Akıllı Hırsız Alarm Seti", "NTA-GNA8545", 220, "40 zone kablolu+kablosuz alarm seti",
     "Neutron NTA-GNA8545-4G akıllı hırsız alarm seti. 40 zone, kablolu ve kablosuz cihaz desteği, NEUTRONSMART uygulaması.",
     {"Model": "NTA-GNA8545-4G", "Zone": "40", "Bağlantı": "Kablolu+Kablosuz", "Uygulama": "NEUTRONSMART"},
     ["https://www.neutron.com.tr/images/products/alarm-seti.jpg"]),

    ("Neutron Dış Ortam Siren Alarm Seti", "NTL-OD99WB", 180, "70 zone kablosuz dış siren alarm seti",
     "Neutron NTL-OD-99WB dış ortam sirenli alarm seti. 70 zone kablosuz, NEUTRONLİFE uygulaması.",
     {"Model": "NTL-OD-99WB", "Zone": "70", "Bağlantı": "Kablosuz", "Uygulama": "NEUTRONLİFE"},
     ["https://www.neutron.com.tr/images/products/dis-siren-set.jpg"]),

    ("Neutron İç Ortam Siren Alarm Seti", "NTL-HM99WB", 160, "70 zone kablosuz iç siren alarm seti",
     "Neutron NTL-HM-99WB iç ortam sirenli alarm seti. 70 zone kablosuz bağlantı.",
     {"Model": "NTL-HM-99WB", "Zone": "70", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/ic-siren-set.jpg"]),

    ("Neutron Kablosuz PIR Dedektör", "NTL-PS01RF", 28, "Kablosuz hareket algılama sensörü",
     "Neutron NTL-PS-01RF kablosuz PIR dedektör. Kolay montaj, kablosuz bağlantı.",
     {"Model": "NTL-PS-01RF", "Tip": "PIR", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/pir-dedektor.jpg"]),

    ("Neutron Kablosuz Manyetik Kontak", "NTL-MC01RF", 18, "Kablosuz kapı/pencere manyetik kontak",
     "Neutron NTL-MC-01RF kablosuz manyetik kontak sensörü. Kapı ve pencere güvenliği.",
     {"Model": "NTL-MC-01RF", "Tip": "Manyetik kontak", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/manyetik-kontak.jpg"]),

    ("Neutron Kablosuz Dış Siren", "NTA-SRW45", 55, "Kablosuz dış mekan alarm sireni",
     "Neutron NTA-SRW45 kablosuz dış mekan sireni. Yüksek ses seviyesi ile caydırıcı alarm.",
     {"Model": "NTA-SRW45", "Tip": "Dış siren", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/dis-siren.jpg"]),

    ("Neutron Uzaktan Kumanda", "NTL-RC01RF", 15, "Kablosuz alarm uzaktan kumanda",
     "Neutron NTL-RC-01RF kablosuz uzaktan kumanda. Alarm sistemi kontrolü.",
     {"Model": "NTL-RC-01RF", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/uzaktan-kumanda.jpg"]),

    ("Neutron Panik Butonu", "NTA-EBW60", 12, "Kablosuz panik butonu",
     "Neutron NTA-EBW60 kablosuz panik butonu. Acil durum bildirimi.",
     {"Model": "NTA-EBW60", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/panik-buton.jpg"]),

    ("Neutron Duman Dedektörü", "NTA-SDW300", 35, "Kablosuz duman dedektörü",
     "Neutron NTA-SDW300 kablosuz duman dedektörü. Yangın algılama ve erken uyarı.",
     {"Model": "NTA-SDW300", "Tip": "Duman", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/duman-dedektor.jpg"]),

    ("Neutron Dokunmatik Keypad", "NTA-KPW11", 40, "Kablosuz dokunmatik tuş takımı",
     "Neutron NTA-KPW11 dokunmatik kablosuz tuş takımı. Şifre ile alarm kontrolü.",
     {"Model": "NTA-KPW11", "Tip": "Dokunmatik", "Bağlantı": "Kablosuz"},
     ["https://www.neutron.com.tr/images/products/keypad.jpg"]),
]

for name, sku, price, short, desc, specs, imgs in _neutron:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Neutron", "category": "Alarm Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 40,
    })

# ═══════════════════════════════════════════════════════════
# KAMERA — EZVIZ
# ═══════════════════════════════════════════════════════════
_ezviz = [
    ("Ezviz H6c 2K+", "EZVIZ-H6C2K", 65, "Yatay/dikey hareketli 2K+ WiFi iç mekan kamera",
     "Ezviz H6c 2K+, 360° yatay ve dikey hareketli akıllı ev kamerası. 2K+ çözünürlük, gece görüşü, çift yönlü ses.",
     {"Çözünürlük": "2K+ (2560x1440)", "Hareket": "Pan & Tilt 360°", "Gece Görüş": "Var", "Ses": "Çift yönlü", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h6c-2k⁺/68655"]),

    ("Ezviz C6N", "EZVIZ-C6N", 42, "360° hareketli WiFi iç mekan kamerası",
     "Ezviz C6N, gündüz gece tam koruma sağlayan yatay/dikey hareketli iç mekan kamerası. Akıllı hareket algılama.",
     {"Çözünürlük": "1080p", "Hareket": "Pan & Tilt 360°", "Gece Görüş": "10m IR", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/c6n/47289"]),

    ("Ezviz C6N 4MP", "EZVIZ-C6N4MP", 55, "2K çözünürlüklü 360° iç mekan kamera",
     "Ezviz C6N 4MP, her köşeyi 2K çözünürlükte kapsayan gelişmiş iç mekan kamerası.",
     {"Çözünürlük": "2K (2560x1440)", "Hareket": "Pan & Tilt", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/c6n-4mp/47191"]),

    ("Ezviz H3c", "EZVIZ-H3C", 55, "Dış mekan WiFi güvenlik kamerası",
     "Ezviz H3c, kolaylaştırılmış güvenilir dış mekan koruması. AI destekli insan algılama, gece görüşü.",
     {"Çözünürlük": "1080p", "Koruma": "IP67", "AI": "İnsan algılama", "Gece Görüş": "30m IR", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h3c/47275"]),

    ("Ezviz H3c 2K+", "EZVIZ-H3C2K", 72, "2K+ dış mekan WiFi kamera",
     "Ezviz H3c 2K+, yüksek çözünürlüklü dış mekan WiFi güvenlik kamerası. Akıllı algılama ve renkli gece görüşü.",
     {"Çözünürlük": "2K+", "Koruma": "IP67", "Gece Görüş": "Renkli", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h3c-2k⁺/47269"]),

    ("Ezviz H3 3K", "EZVIZ-H33K", 90, "3K dış mekan WiFi akıllı kamera",
     "Ezviz H3 3K, 3K çözünürlüklü dış mekan WiFi kamerası. Üstün görüntü kalitesi ve akıllı algılama.",
     {"Çözünürlük": "3K (3072x1728)", "Koruma": "IP67", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h3-3k/47277"]),

    ("Ezviz H8c 2K", "EZVIZ-H8C2K", 85, "360° hareketli 2K dış mekan kamera",
     "Ezviz H8c 2K, yatay ve dikey hareketli dış mekan WiFi kamerası. 360° esneklik, çok yönlü koruma.",
     {"Çözünürlük": "2K", "Hareket": "Pan & Tilt 360°", "Koruma": "IP65", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h8c-2k/47255"]),

    ("Ezviz H8c 2K+", "EZVIZ-H8C2KP", 105, "360° hareketli 2K+ dış mekan kamera",
     "Ezviz H8c 2K+, gelişmiş performanslı dış mekan pan & tilt kamera. 2K+ çözünürlük.",
     {"Çözünürlük": "2K+", "Hareket": "Pan & Tilt 360°", "Koruma": "IP65", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/h8c-2k⁺/47253"]),

    ("Ezviz C8c 3K", "EZVIZ-C8C3K", 130, "3K 360° dış mekan akıllı kamera",
     "Ezviz C8c 3K, olağanüstü görüntü ile her yönlü akıllı koruma. 3K çözünürlük, pan & tilt.",
     {"Çözünürlük": "3K", "Hareket": "Pan & Tilt", "Koruma": "IP65", "AI": "İnsan/araç algılama"},
     ["https://www.ezviz.com/tr/product/c8c-3k/51865"]),

    ("Ezviz HB8", "EZVIZ-HB8", 150, "Pilli WiFi pan & tilt dış mekan kamera",
     "Ezviz HB8, pille çalışan yatay ve dikey hareketli WiFi kamera. Solar panel uyumlu, kablosuz kurulum.",
     {"Çözünürlük": "2K", "Güç": "Pil + Solar uyumlu", "Hareket": "Pan & Tilt", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/hb8/47305"]),

    ("Ezviz EB8 4G", "EZVIZ-EB84G", 170, "4G pilli pan & tilt kamera",
     "Ezviz EB8 4G, SIM kart ile 4G bağlantılı pille çalışan dış mekan kamerası. WiFi olmayan ortamlar için ideal.",
     {"Çözünürlük": "2K", "Bağlantı": "4G LTE", "Güç": "Pil", "Hareket": "Pan & Tilt"},
     ["https://www.ezviz.com/tr/product/eb8-4g/47201"]),

    ("Ezviz LC3", "EZVIZ-LC3", 120, "Akıllı güvenlik duvar ışığı kamerası",
     "Ezviz LC3, duvar lambası ile entegre güvenlik kamerası. Aydınlatma ve güvenlik tek cihazda.",
     {"Çözünürlük": "2K", "Özellik": "Duvar lambası + Kamera", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/lc3/47243"]),

    ("Ezviz E6", "EZVIZ-E6", 75, "Profesyonel iç mekan pan & tilt kamera",
     "Ezviz E6, profesyonel ve kusursuz görüntü kalitesi sunan iç mekan kamerası.",
     {"Çözünürlük": "2K+", "Hareket": "Pan & Tilt", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/e6/47295"]),

    ("Ezviz CB3", "EZVIZ-CB3", 95, "Bağımsız pilli akıllı ev kamerası",
     "Ezviz CB3, tamamen kablosuz pille çalışan akıllı ev kamerası. Kolay kurulum, iç ve dış mekan.",
     {"Güç": "Pil", "Bağlantı": "Wi-Fi", "Kurulum": "Tamamen kablosuz"},
     ["https://www.ezviz.com/tr/product/cb3/47309"]),

    ("Ezviz C3TN", "EZVIZ-C3TN", 38, "Ekonomik dış mekan WiFi kamera",
     "Ezviz C3TN, en basit şekilde ev koruması sağlayan ekonomik dış mekan WiFi kamerası.",
     {"Çözünürlük": "1080p", "Koruma": "IP67", "Gece Görüş": "30m IR", "Bağlantı": "Wi-Fi"},
     ["https://www.ezviz.com/tr/product/c3tn/47267"]),
]

for name, sku, price, short, desc, specs, imgs in _ezviz:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Ezviz", "category": "Kamera Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 40,
    })

# ═══════════════════════════════════════════════════════════
# KİLİT — DESİ
# ═══════════════════════════════════════════════════════════
_desi = [
    ("Desi QUiC Q030+", "DESI-Q030P", 480, "Yüz tanıma, parmak izi, şifre, kart okuyucu, görüntülü arama",
     "Desi QUiC Q030+ akıllı kilit. Yüz tanıma, avuç içi damar, parmak izi, tuş takımı, kart okuyucu ve görüntülü arama özellikleri.",
     {"Yüz Tanıma": "3D", "Parmak İzi": "Var", "Şifre": "Var", "Kart": "RFID", "Görüntülü Arama": "Var"},
     ["https://shop.desi.com.tr/images/q030plus.jpg"]),

    ("Desi QUiC Q033+", "DESI-Q033P", 665, "Sanal kapı kolu, yüz tanıma, parmak izi akıllı kilit",
     "Desi QUiC Q033+ premium akıllı kilit. Sanal kapı kolu, 3D yüz tanıma, avuç içi damar okuma, parmak izi ve görüntülü arama.",
     {"Yüz Tanıma": "3D", "Kapı Kolu": "Sanal", "Avuç İçi Damar": "Var", "Görüntülü Arama": "Var"},
     ["https://shop.desi.com.tr/images/q033plus.jpg"]),

    ("Desi Utopic RXe", "DESI-UTOPICRE", 242, "Yapay zeka destekli akıllı kilit",
     "Desi Utopic RXe, yapay zeka destekli akıllı kilit. iOS ve Android uygulama kontrolü.",
     {"AI": "Yapay zeka destekli", "Uygulama": "iOS + Android", "Montaj": "Deliksiz"},
     ["https://shop.desi.com.tr/images/utopic-rxe.jpg"]),

    ("Desi Utopic R", "DESI-UTOPICR", 232, "Deliksiz montaj akıllı kilit",
     "Desi Utopic R, deliksiz montaj akıllı kapı kilidi. Mobil uygulama ile uzaktan kontrol.",
     {"Montaj": "Deliksiz", "Uygulama": "Mobil kontrol"},
     ["https://shop.desi.com.tr/images/utopic-r.jpg"]),

    ("Desi QUiC Q015", "DESI-Q015", 177, "Parmak izi + şifre + kart okuyucu kilit",
     "Desi QUiC Q015, parmak izi, tuş takımı ve kart okuyucu ile çoklu erişim kontrolü.",
     {"Parmak İzi": "Var", "Şifre": "Var", "Kart": "RFID"},
     ["https://shop.desi.com.tr/images/q015.jpg"]),

    ("Desi QUiC Q001", "DESI-Q001", 215, "Silindir kilit parmak izi + şifre + kart",
     "Desi QUiC Q001, silindir kilidi tarzında parmak izi, tuş takımı ve kart okuyucu.",
     {"Tip": "Silindir kilit", "Parmak İzi": "Var", "Şifre": "Var", "Kart": "RFID"},
     ["https://shop.desi.com.tr/images/q001.jpg"]),

    ("Desi QUiC Vision V001", "DESI-V001", 193, "Akıllı görüntüleme sistemi (dijital dürbün)",
     "Desi QUiC Vision V001, kapı dürbünü yerine geçen akıllı görüntüleme sistemi. İç ekran ve görüntülü arama.",
     {"Tip": "Dijital dürbün", "Ekran": "İç mekan ekranı", "Görüntülü Arama": "Var"},
     ["https://shop.desi.com.tr/images/vision-v001.jpg"]),
]

for name, sku, price, short, desc, specs, imgs in _desi:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Desi", "category": "Akıllı Kilit",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 20,
    })

# ═══════════════════════════════════════════════════════════
# KİLİT — BLITZLOCK
# ═══════════════════════════════════════════════════════════
_blitzlock = [
    ("Blitzlock Ottoman", "BL-OTTOMAN", 350, "3D yüz tanıma, kamera, parmak izi akıllı kilit",
     "Blitzlock Ottoman, 3D yüz tanıma, 135° kamera, parmak izi, IC kart ve şifre ile çoklu erişim. IP65 koruma.",
     {"Yüz Tanıma": "3D", "Kamera": "135°", "Parmak İzi": "Var", "Kart": "IC 13.56MHz", "Şifre": "6-10 hane", "Pil": "7.4V 4200mAh Type-C", "Koruma": "IP65", "Uygulama": "u smart go"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_68553f58c204c.png"]),

    ("Blitzlock Journey", "BL-JOURNEY", 320, "3D yüz tanıma, çift parmak izi sensörü akıllı kilit",
     "Blitzlock Journey, çift kapasitif parmak izi sensörü, 3D yüz tanıma, 135° kamera. Tuya uygulama desteği.",
     {"Yüz Tanıma": "3D", "Kamera": "135°", "Parmak İzi": "2x kapasitif sensör", "Uygulama": "Tuya", "Pil": "7.4V 4200mAh Type-C", "Koruma": "IP65"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_685538c58e962.png"]),

    ("Blitzlock Flush", "BL-FLUSH", 380, "Cam yüzeyli 3D yüz tanıma akıllı kilit",
     "Blitzlock Flush, cam yüzeyli premium tasarım. 3D yüz tanıma, 135° kamera, IP68 su geçirmezlik.",
     {"Yüz Tanıma": "3D", "Yüzey": "Cam", "Koruma": "IP68", "Kamera": "135°", "Uygulama": "Tuya"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_68693eda812a9.png"]),

    ("Blitzlock Cat Eyes", "BL-CATEYES", 280, "Kameralı parmak izi akıllı kilit",
     "Blitzlock Cat Eyes, 135° kamera, parmak izi, IC kart ve şifre. Tuya uygulama desteği.",
     {"Kamera": "135°", "Parmak İzi": "Var", "Kart": "IC 13.56MHz", "Uygulama": "Tuya", "Koruma": "IP65"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_68553b4fbccf5.png"]),

    ("Blitzlock Taurus", "BL-TAURUS", 180, "Parmak izi + kart + şifre akıllı kilit",
     "Blitzlock Taurus, parmak izi, IC kart okuyucu ve şifre. Uygulamasız basit kullanım.",
     {"Parmak İzi": "Var", "Kart": "IC 13.56MHz", "Şifre": "6-10 hane", "Koruma": "IP65", "Pil": "7.4V 4200mAh Type-C"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_6855412c5718b.png"]),

    ("Blitzlock Beta", "BL-BETA", 140, "Parmak izi + kart + şifre kompakt kilit",
     "Blitzlock Beta, parmak izi, IC kart ve şifre. TT Lock uygulama desteği. 4xAAA pil.",
     {"Parmak İzi": "Var", "Kart": "IC 13.56MHz", "Uygulama": "TT Lock", "Pil": "4x AAA", "Koruma": "IP65"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_68553a49e6d45.png"]),

    ("Blitzlock Minium", "BL-MINIUM", 200, "Kompakt parmak izi akıllı kilit IP68",
     "Blitzlock Minium, kompakt tasarım, parmak izi, IC kart, şifre. IP68 tam su geçirmezlik. Tuya uyumlu.",
     {"Parmak İzi": "Var", "Koruma": "IP68", "Uygulama": "Tuya", "Pil": "7.4V 3500mAh Micro USB"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_68553e987019e.png"]),

    ("Blitzlock Anatolia", "BL-ANATOLIA", 300, "Kameralı parmak izi akıllı kilit",
     "Blitzlock Anatolia, 135° kamera, parmak izi, IC kart, şifre. u smart go uygulaması.",
     {"Kamera": "135°", "Parmak İzi": "Var", "Uygulama": "u smart go", "Koruma": "IP65"},
     ["https://servis.blitzlock.com.tr/uploads/umodelresim/urun_685540f85a158.png"]),
]

for name, sku, price, short, desc, specs, imgs in _blitzlock:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Blitzlock", "category": "Akıllı Kilit",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 15,
    })

# ═══════════════════════════════════════════════════════════
# YANGIN — GST (ana ürünler)
# ═══════════════════════════════════════════════════════════
_gst = [
    ("GST 200TK Adresli Yangın Paneli 1 Loop", "GST-200TK1", 863, "1 loop akıllı adresli yangın algılama paneli",
     "GST Yangın 200TK, 1 loop akıllı adresli yangın alarm paneli. Otomatik cihaz algılama ve kolay programlama.",
     {"Model": "GST-200TK", "Loop": "1", "Tip": "Adresli", "Algılama": "Otomatik"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/gst200tk.jpg"]),

    ("GST 200TK-2 Adresli Yangın Paneli 2 Loop", "GST-200TK2", 1189, "2 loop akıllı adresli yangın algılama paneli",
     "GST Yangın 200TK-2, 2 loop adresli yangın alarm paneli. Büyük binalar için genişletilebilir sistem.",
     {"Model": "GST-200TK-2", "Loop": "2", "Tip": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/gst200tk2.jpg"]),

    ("GST IFP8 8 Loop Panel", "GST-IFP8", 2275, "8 loop adresli yangın alarm paneli",
     "GST IFP8, 8 loop destekli büyük ölçekli adresli yangın alarm paneli. Endüstriyel ve ticari kullanım.",
     {"Model": "IFP8", "Loop": "8", "Tip": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/ifp8.jpg"]),

    ("GST I-9102 Optik Duman Dedektörü", "GST-I9102", 21, "Adresli optik duman dedektörü",
     "GST I-9102, adresli optik duman dedektörü. Erken duman algılama ile yangın güvenliği.",
     {"Model": "I-9102", "Tip": "Optik duman", "Sistem": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/i9102.jpg"]),

    ("GST I-9103 Isı Dedektörü", "GST-I9103", 22, "Adresli dual ısı dedektörü",
     "GST I-9103, adresli dual ısı dedektörü. Sıcaklık artışı ve sabit sıcaklık algılama.",
     {"Model": "I-9103", "Tip": "Dual ısı", "Sistem": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/i9103.jpg"]),

    ("GST I-9101 Kombine Duman+Isı Dedektörü", "GST-I9101", 33, "Adresli multi sensör dedektör",
     "GST I-9101, optik duman ve ısı algılama birleşik adresli multi sensör dedektör.",
     {"Model": "I-9101", "Tip": "Multi (Duman+Isı)", "Sistem": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/i9101.jpg"]),

    ("GST DI-9204E Yangın İhbar Butonu", "GST-DI9204E", 36, "Adresli yangın ihbar butonu",
     "GST DI-9204E, LED göstergeli akıllı adresli yangın ihbar butonu.",
     {"Model": "DI-9204E", "Tip": "İhbar butonu", "Sistem": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/DI-9204E.jpg"]),

    ("GST I-9300 Tekli Giriş Modülü", "GST-I9300", 32, "Adresli tekli giriş modülü (loop beslemeli)",
     "GST I-9300, loop beslemeli adresli tekli giriş modülü. Kablolu cihaz entegrasyonu.",
     {"Model": "I-9300", "Tip": "Giriş modülü", "Besleme": "Loop"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/i9300.jpg"]),

    ("GST I-9403 Siren + Flaşör", "GST-I9403", 90, "Adresli yangın alarm sireni ve flaşörü",
     "GST I-9403, adresli yangın alarm sireni ve flaşörü. Sesli ve görsel uyarı.",
     {"Model": "I-9403", "Tip": "Siren + Flaşör", "Sistem": "Adresli"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/i9403.jpg"]),

    ("GST C-9503 Hat Kısa Devre İzolatörü", "GST-C9503", 18, "Adresli hat kısa devre izolatörü",
     "GST C-9503, yangın alarm hattında kısa devre izolasyonu sağlayan modül.",
     {"Model": "C-9503", "Tip": "İzolatör"},
     ["https://www.gstyanginalarmi.com/wp-content/uploads/2018/01/c9503.jpg"]),
]

for name, sku, price, short, desc, specs, imgs in _gst:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "GST", "category": "Yangın Algılama",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 25,
    })

# ═══════════════════════════════════════════════════════════
# YANGIN — TEKNİM
# ═══════════════════════════════════════════════════════════
_teknim = [
    ("Teknim TFP-2211 Akıllı Adresli Panel", "TKN-TFP2211", 450, "1 loop akıllı adresli yangın alarm paneli",
     "Teknim TFP-2211, yeni nesil akıllı adresli yangın alarm kontrol paneli. 1 loop, kolay programlama.",
     {"Model": "TFP-2211", "Loop": "1", "Tip": "Akıllı Adresli"},
     ["https://www.teknim.com/storage/media/media_item/default/1151/1418/conversions/tfp-22xx-tr-webp.webp"]),

    ("Teknim TFP-2212 Akıllı Adresli Panel 2 Loop", "TKN-TFP2212", 600, "2 loop akıllı adresli yangın alarm paneli",
     "Teknim TFP-2212, 2 loop akıllı adresli yangın alarm paneli.",
     {"Model": "TFP-2212", "Loop": "2", "Tip": "Akıllı Adresli"},
     ["https://www.teknim.com/storage/media/media_item/default/1151/1418/conversions/tfp-22xx-tr-webp.webp"]),

    ("Teknim TFP-3122 Konvansiyonel Panel 2 Zone", "TKN-TFP3122", 120, "2 bölgeli konvansiyonel yangın alarm paneli",
     "Teknim TFP-3122, 2 bölgeli konvansiyonel yangın alarm paneli. Küçük binalar için ekonomik çözüm.",
     {"Model": "TFP-3122", "Zone": "2", "Tip": "Konvansiyonel"},
     ["https://www.teknim.com/storage/media/media_item/default/170/170/TFP-3122.png"]),

    ("Teknim TFP-4408 Konvansiyonel Panel 8 Zone", "TKN-TFP4408", 250, "8 bölgeli konvansiyonel yangın alarm paneli (metal kasa)",
     "Teknim TFP-4408, 8 bölgeli konvansiyonel yangın alarm paneli. Metal kasa, orta ölçekli binalar.",
     {"Model": "TFP-4408", "Zone": "8", "Tip": "Konvansiyonel", "Kasa": "Metal"},
     ["https://www.teknim.com/storage/media/media_item/default/1186/1485/conversions/TFP-4408-TR-webp.webp"]),

    ("Teknim TFD-4230 Optik Duman Dedektörü", "TKN-TFD4230", 15, "Konvansiyonel optik duman dedektörü",
     "Teknim TFD-4230, konvansiyonel optik duman dedektörü. Erken duman algılama.",
     {"Model": "TFD-4230", "Tip": "Optik duman", "Sistem": "Konvansiyonel"},
     ["https://www.teknim.com/storage/media/media_item/default/145/145/TFD-4230.png"]),

    ("Teknim TFD-4245 Isı Artış Dedektörü", "TKN-TFD4245", 14, "Konvansiyonel ısı artış dedektörü",
     "Teknim TFD-4245, ısı artışı algılayan konvansiyonel dedektör.",
     {"Model": "TFD-4245", "Tip": "Isı artış", "Sistem": "Konvansiyonel"},
     ["https://www.teknim.com/storage/media/media_item/default/146/146/TFD-4245.png"]),

    ("Teknim TFD-4250 Multi Dedektör", "TKN-TFD4250", 20, "Konvansiyonel multi dedektör (duman+ısı)",
     "Teknim TFD-4250, optik duman ve ısı algılamayı birleştiren konvansiyonel multi dedektör.",
     {"Model": "TFD-4250", "Tip": "Multi (Duman+Isı)", "Sistem": "Konvansiyonel"},
     ["https://www.teknim.com/storage/media/media_item/default/147/147/TFD-4250.png"]),

    ("Teknim TWM-1885 Kablosuz Koordinatör", "TKN-TWM1885", 180, "Kablosuz akıllı adresli koordinatör",
     "Teknim TWM-1885, kablosuz yangın alarm sistemi koordinatör ünitesi. Adresli sistem.",
     {"Model": "TWM-1885", "Tip": "Kablosuz Koordinatör", "Sistem": "Akıllı Adresli"},
     ["https://www.teknim.com/storage/media/media_item/default/223/223/TWM-1885.png"]),

    ("Teknim TWD-1850 Kablosuz Multi Dedektör", "TKN-TWD1850", 45, "Kablosuz multi dedektör",
     "Teknim TWD-1850, kablosuz çok fonksiyonlu yangın dedektörü.",
     {"Model": "TWD-1850", "Tip": "Multi dedektör", "Bağlantı": "Kablosuz"},
     ["https://www.teknim.com/storage/media/media_item/default/222/222/TWD-1850.png"]),

    ("Teknim TWB-1866 Kablosuz Yangın Butonu", "TKN-TWB1866", 35, "Kablosuz yangın alarm butonu",
     "Teknim TWB-1866, kablosuz yangın alarm ihbar butonu.",
     {"Model": "TWB-1866", "Tip": "İhbar butonu", "Bağlantı": "Kablosuz"},
     ["https://www.teknim.com/storage/media/media_item/default/221/221/TWB-1866.png"]),
]

for name, sku, price, short, desc, specs, imgs in _teknim:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Teknim", "category": "Yangın Algılama",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 30,
    })

# ═══════════════════════════════════════════════════════════
# YANGIN — AJAX FIRE
# ═══════════════════════════════════════════════════════════
_ajax_fire = [
    ("Ajax FireProtect 2 (Duman/Isı/CO)", "AJAX-FP2HSC", 110, "Kablosuz duman, ısı ve CO dedektörü",
     "Ajax FireProtect 2, duman, ısı ve karbon monoksit algılayan kablosuz yangın dedektörü. Değiştirilebilir pil.",
     {"Algılama": "Duman + Isı + CO", "Pil": "Değiştirilebilir", "Ömür": "7 yıl"},
     ["https://ajax.systems/products/fireprotect-2-smoke-heat-co/"]),

    ("Ajax FireProtect 2 (Duman/Isı)", "AJAX-FP2HS", 85, "Kablosuz duman ve ısı dedektörü",
     "Ajax FireProtect 2, duman ve ısı algılayan kablosuz yangın dedektörü.",
     {"Algılama": "Duman + Isı", "Pil": "Değiştirilebilir"},
     ["https://ajax.systems/products/fireprotect-2-smoke-heat/"]),

    ("Ajax FireProtect 2 (CO)", "AJAX-FP2CO", 75, "Kablosuz karbon monoksit dedektörü",
     "Ajax FireProtect 2, karbon monoksit algılayan kablosuz dedektör.",
     {"Algılama": "CO", "Pil": "Değiştirilebilir"},
     ["https://ajax.systems/products/fireprotect-2-co/"]),

    ("Ajax FireProtect Plus", "AJAX-FPP", 90, "Duman, ısı ve CO dedektörü (orijinal)",
     "Ajax FireProtect Plus, duman, ısı ve CO algılayan kablosuz yangın dedektörü. 4 yıl pil ömrü.",
     {"Algılama": "Duman + Isı + CO", "Pil Ömrü": "4 yıl"},
     ["https://ajax.systems/products/fireprotectplus/"]),

    ("Ajax ManualCallPoint (Kırmızı)", "AJAX-MCP", 65, "Kablosuz yangın alarm butonu",
     "Ajax ManualCallPoint, kablosuz adresli sıfırlanabilir yangın alarm butonu. Kırmızı renk, programlanabilir senaryolar.",
     {"Tip": "Manuel çağrı noktası", "Renk": "Kırmızı", "Sıfırlanabilir": "Evet"},
     ["https://ajax.systems/products/manualcallpoint-red-jeweller/"]),
]

for name, sku, price, short, desc, specs, imgs in _ajax_fire:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Ajax", "category": "Yangın Algılama",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 35,
    })

# ═══════════════════════════════════════════════════════════
# KAMERA — AJAX
# ═══════════════════════════════════════════════════════════
_ajax_cam = [
    ("Ajax TurretCam 5MP/2.8mm", "AJAX-TC528", 120, "5MP AI destekli kablolu IP güvenlik kamerası",
     "Ajax TurretCam 5MP, 110° görüş açılı AI destekli kablolu IP kamera. IR aydınlatma ve True WDR.",
     {"Çözünürlük": "5 MP", "Lens": "2.8mm (110°)", "IR": "Var", "WDR": "True WDR", "AI": "Var"},
     ["https://ajax.systems/products/turretcam/"]),

    ("Ajax TurretCam 8MP/2.8mm", "AJAX-TC828", 160, "8MP AI destekli kablolu IP güvenlik kamerası",
     "Ajax TurretCam 8MP (4K), 110° görüş açılı AI destekli kablolu IP kamera.",
     {"Çözünürlük": "8 MP (4K)", "Lens": "2.8mm (110°)", "IR": "Var", "WDR": "True WDR"},
     ["https://ajax.systems/products/turretcam/"]),

    ("Ajax BulletCam 5MP/2.8mm", "AJAX-BC528", 120, "5MP AI destekli bullet IP kamera",
     "Ajax BulletCam 5MP, 110° görüş açılı bullet tipi kablolu IP güvenlik kamerası.",
     {"Çözünürlük": "5 MP", "Lens": "2.8mm (110°)", "Tip": "Bullet", "IR": "Var"},
     ["https://ajax.systems/products/bulletcam/"]),

    ("Ajax BulletCam 8MP/2.8mm", "AJAX-BC828", 160, "8MP AI destekli bullet IP kamera",
     "Ajax BulletCam 8MP (4K), yüksek çözünürlüklü bullet tipi kablolu IP güvenlik kamerası.",
     {"Çözünürlük": "8 MP (4K)", "Lens": "2.8mm (110°)", "Tip": "Bullet"},
     ["https://ajax.systems/products/bulletcam/"]),

    ("Ajax DomeCam Mini 5MP/2.8mm", "AJAX-DC528", 110, "5MP kompakt dome IP kamera",
     "Ajax DomeCam Mini 5MP, kompakt dome tipi kablolu IP güvenlik kamerası. İç mekan için ideal.",
     {"Çözünürlük": "5 MP", "Lens": "2.8mm (110°)", "Tip": "Dome Mini"},
     ["https://ajax.systems/products/domecam-mini/"]),

    ("Ajax NVR 8-ch", "AJAX-NVR8", 200, "8 kanal ağ video kaydedici",
     "Ajax NVR, 8 kanallı ağ video kaydedici. HDMI çıkışı.",
     {"Kanal": "8", "Çıkış": "HDMI", "Tip": "NVR"},
     ["https://ajax.systems/products/nvr/"]),

    ("Ajax NVR 16-ch", "AJAX-NVR16", 280, "16 kanal ağ video kaydedici",
     "Ajax NVR, 16 kanallı ağ video kaydedici.",
     {"Kanal": "16", "Çıkış": "HDMI"},
     ["https://ajax.systems/products/nvr/"]),

    ("Ajax IndoorCam", "AJAX-INDOOR", 85, "WiFi iç mekan güvenlik kamerası",
     "Ajax IndoorCam, PIR hareket sensörü ve dahili AI özellikli iç mekan WiFi güvenlik kamerası.",
     {"Bağlantı": "Wi-Fi", "PIR": "Var", "AI": "Dahili", "Tip": "İç mekan"},
     ["https://ajax.systems/products/indoorcam/"]),

    ("Ajax DoorBell", "AJAX-DOORBELL", 150, "AI destekli video kapı zili",
     "Ajax DoorBell, dahili AI, PIR sensör ve uygulama kontrolü ile akıllı video kapı zili.",
     {"AI": "Dahili", "PIR": "Var", "Tip": "Video kapı zili"},
     ["https://ajax.systems/products/doorbell/"]),
]

for name, sku, price, short, desc, specs, imgs in _ajax_cam:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "Ajax", "category": "Kamera Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 35,
    })

# ═══════════════════════════════════════════════════════════
# KAMERA — HILOOK
# ═══════════════════════════════════════════════════════════
_hilook = [
    ("HiLook IPC-D120HA-LU IP Dome Kamera", "HL-IPCD120", 55, "2MP IP dome kamera, WDR, gece görüşü",
     "HiLook IPC-D120HA-LU, 2MP yüksek çözünürlüklü IP dome kamera. WDR ve gelişmiş gece görüşü.",
     {"Çözünürlük": "2 MP", "Tip": "IP Dome", "WDR": "Var", "Gece Görüş": "Var", "Koruma": "IP67"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/IPC-D120HA-LU-550x550-1-1.jpg"]),

    ("HiLook IPC-D120HA-LU IP Bullet Kamera", "HL-IPCB120", 55, "2MP IP bullet kamera, IP67",
     "HiLook IPC-D120HA-LU, 2MP IP bullet kamera. IP67 su/toz geçirmez, gece görüşü ve WDR.",
     {"Çözünürlük": "2 MP", "Tip": "IP Bullet", "Koruma": "IP67", "Gece Görüş": "Var"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/IPC-D120HA-LU-550x550-1.jpg"]),

    ("HiLook PTZ-N2C400M-DE IP PTZ Kamera", "HL-PTZN2C", 180, "4MP IP PTZ kamera, optik zoom",
     "HiLook PTZ-N2C400M-DE, uzaktan pan, tilt ve optik zoom özellikli 4MP IP PTZ kamera.",
     {"Çözünürlük": "4 MP", "Tip": "IP PTZ", "Zoom": "Optik", "Hareket": "Pan/Tilt/Zoom"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/PTZ-N2C400M-DE-550x550-1.jpg"]),

    ("HiLook THC-D320-VF AHD Dome Kamera", "HL-THCD320", 42, "2MP AHD dome kamera, varifocal",
     "HiLook THC-D320-VF, 2MP analog HD dome kamera. Varifocal lens, güvenilir ve ekonomik.",
     {"Çözünürlük": "2 MP", "Tip": "AHD Dome", "Lens": "Varifocal"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/THC-D320-VF-550x550-1.jpg"]),

    ("HiLook THC-B120-MPIRL AHD Bullet Kamera", "HL-THCB120", 38, "2MP AHD bullet kamera, uzun menzil IR",
     "HiLook THC-B120-MPIRL, uzun menzilli IR aydınlatmalı 2MP AHD bullet kamera. IP66 dış mekan uyumlu.",
     {"Çözünürlük": "2 MP", "Tip": "AHD Bullet", "Koruma": "IP66", "IR": "Uzun menzil"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/THC-B120-MPIRL-550x550-1.jpg"]),

    ("HiLook THC-B120-PC Analog HD Kamera", "HL-THCB120PC", 30, "2MP ekonomik analog HD bullet kamera",
     "HiLook THC-B120-PC, mevcut koaksiyel altyapıyı kullanan ekonomik 2MP analog HD bullet kamera.",
     {"Çözünürlük": "2 MP", "Tip": "Analog HD Bullet", "Altyapı": "Koaksiyel"},
     ["https://hilookkamera.com/wp-content/uploads/2025/01/0000014_hilook-thc-b120-pc-2mp-analog-hd-ir-bullet-kamera_550.jpeg"]),
]

for name, sku, price, short, desc, specs, imgs in _hilook:
    PRODUCTS.append({
        "name": name, "sku": sku, "brand": "HiLook", "category": "Kamera Sistemleri",
        "price_usd": price, "short_desc": short, "description": desc,
        "specs": specs, "images": imgs, "shipping_type": "kargo",
        "warranty_months": 24, "tax_rate": 20, "stock": 50,
    })


# ═══════════════════════════════════════════════════════════
# IMPORT FONKSİYONU
# ═══════════════════════════════════════════════════════════
def main():
    print(f"\n{'='*60}")
    print(f"  Fiyatcim Toplu Urun Import — {len(PRODUCTS)} urun")
    print(f"{'='*60}\n")

    sb = get_client()

    # 1) Kategorileri olustur veya getir
    print("[1/4] Kategoriler hazirlaniyor...")
    existing_cats = sb.table("categories").select("*").execute().data or []
    cat_map = {c["slug"]: c["id"] for c in existing_cats}

    for cat in CATEGORIES:
        if cat["slug"] not in cat_map:
            res = sb.table("categories").insert(cat).execute()
            if res.data:
                cat_map[cat["slug"]] = res.data[0]["id"]
                print(f"  + Kategori olusturuldu: {cat['name']}")
        else:
            print(f"  - Kategori mevcut: {cat['name']}")

    # Kategori adi -> id esleme
    cat_name_map = {}
    for cat in CATEGORIES:
        cat_name_map[cat["name"]] = cat_map.get(cat["slug"])

    # 2) Markalari olustur veya getir
    print("\n[2/4] Markalar hazirlaniyor...")
    existing_brands = sb.table("brands").select("*").execute().data or []
    brand_map = {b["name"]: b["id"] for b in existing_brands}

    for brand_name in BRANDS:
        if brand_name not in brand_map:
            brand_slug = slugify(brand_name)
            res = sb.table("brands").insert({"name": brand_name, "slug": brand_slug}).execute()
            if res.data:
                brand_map[brand_name] = res.data[0]["id"]
                print(f"  + Marka olusturuldu: {brand_name}")
        else:
            print(f"  - Marka mevcut: {brand_name}")

    # 3) Mevcut SKU'lari kontrol et
    print("\n[3/4] Mevcut urunler kontrol ediliyor...")
    existing_products = sb.table("products").select("sku").is_("deleted_at", "null").execute().data or []
    existing_skus = {p["sku"] for p in existing_products}
    print(f"  Mevcut urun sayisi: {len(existing_skus)}")

    # 4) Urunleri ekle
    print(f"\n[4/4] Urunler ekleniyor...")
    added = 0
    skipped = 0
    errors = 0

    for p in PRODUCTS:
        if p["sku"] in existing_skus:
            skipped += 1
            continue

        cat_id = cat_name_map.get(p["category"])
        brand_id = brand_map.get(p["brand"])

        if not cat_id or not brand_id:
            print(f"  ! HATA: Kategori/marka bulunamadi: {p['name']} ({p['category']}/{p['brand']})")
            errors += 1
            continue

        price_try = round(p["price_usd"] * USD_TRY, 2)

        product_data = {
            "name": p["name"],
            "slug": slugify(p["name"]),
            "sku": p["sku"],
            "category_id": cat_id,
            "brand_id": brand_id,
            "price": price_try,
            "sale_price": None,
            "price_usd": p["price_usd"],
            "sale_price_usd": None,
            "stock": p.get("stock", 50),
            "critical_stock": 5,
            "tax_rate": p.get("tax_rate", 20),
            "warranty_months": p.get("warranty_months", 24),
            "shipping_type": p.get("shipping_type", "kargo"),
            "is_active": True,
            "is_featured": False,
            "is_trending": False,
            "short_desc": p["short_desc"],
            "description": p["description"],
            "specs": p.get("specs", {}),
            "images": p.get("images", []),
            "seo_title": p["name"][:60],
            "seo_desc": p["short_desc"][:160],
        }

        try:
            sb.table("products").insert(product_data).execute()
            added += 1
            if added % 10 == 0:
                print(f"  ... {added} urun eklendi")
            # Rate limiting icin kisa bekleme
            time.sleep(0.1)
        except Exception as e:
            print(f"  ! HATA: {p['name']}: {e}")
            errors += 1

    print(f"\n{'='*60}")
    print(f"  TAMAMLANDI!")
    print(f"  Eklenen: {added}")
    print(f"  Atlanan (mevcut): {skipped}")
    print(f"  Hata: {errors}")
    print(f"  Toplam: {len(PRODUCTS)}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
