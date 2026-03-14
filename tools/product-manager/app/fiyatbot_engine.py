"""FiyatBot v2 — Mesaj motoru + havuzlar. Tamamen kapalı devre, AI yok."""

import random
import time
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MESAJ KATEGORİLERİ
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class MsgCat(str, Enum):
    ACILIS = "acilis"
    STOK_SIFIR = "stok_sifir"
    GORSEL_EKSIK = "gorsel_eksik"
    FIYAT_SIFIR = "fiyat_sifir"
    ACIKLAMA_EKSIK = "aciklama_eksik"
    SIPARIS_YENI = "siparis_yeni"
    ESKI_URUN = "eski_urun"
    BASARI = "basari"
    KAPANIS = "kapanis"
    GECE = "gece"
    BOSTA = "bosta"
    KRITIK = "kritik"
    GENEL = "genel"


class Surface(str, Enum):
    RIGHT_BALLOON = "right_balloon"
    TOAST = "toast"
    WHISPER = "whisper"  # alt köşe fısıltı
    STATUS = "status"    # status bar


class Severity(int, Enum):
    INFO = 1
    WARNING = 2
    CRITICAL = 3


@dataclass
class BotMessage:
    cat: MsgCat
    template: str
    dark_level: int = 0        # 0-5
    severity: Severity = Severity.INFO
    surface: Surface = Surface.RIGHT_BALLOON
    action_target: str = ""    # tıklanınca gidilecek sayfa
    action_filter: str = ""    # filtre parametresi


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DEVASA MESAJ HAVUZLARI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MESSAGES: dict[MsgCat, list[BotMessage]] = {

    # ─── AÇILIŞ ────────────────────────────────────────────
    MsgCat.ACILIS: [
        BotMessage(MsgCat.ACILIS, "Gunaydin patron. Dun gece verilere baktim. Konusmamiz lazim."),
        BotMessage(MsgCat.ACILIS, "Hos geldin. Urunler seni bekliyordu. Bazilari sabirsizlandi."),
        BotMessage(MsgCat.ACILIS, "Yine mi sen?"),
        BotMessage(MsgCat.ACILIS, "Donmusun. Urunler fark etmemis olabilir."),
        BotMessage(MsgCat.ACILIS, "Sistem aciliyor... Ruh yukleniyor... Kara mizah modulu hazir.", dark_level=2),
        BotMessage(MsgCat.ACILIS, "Hos geldin. Son girisinden bu yana {sorun_toplam} sey degisti. Cogu kotu yone.", dark_level=1),
        BotMessage(MsgCat.ACILIS, "Bugun guzel bir gun. Henuz hicbir sey patlamadi."),
        BotMessage(MsgCat.ACILIS, "Giris yapildi. Sorumluluk devredildi. Artik senin problemin.", dark_level=1),
        BotMessage(MsgCat.ACILIS, "Durum raporu: {stok_sifir} stoksuz, {gorsel_yok} gorselsiz, {fiyat_sifir} bedava urun."),
        BotMessage(MsgCat.ACILIS, "Hos geldin. {siparis_yeni} yeni siparis var. Ve {sorun_toplam} sorun. Hangisiyle basliyoruz?"),
        BotMessage(MsgCat.ACILIS, "Ben uyumuyordum. Seni bekliyordum. Veritabani da bekliyordu."),
        BotMessage(MsgCat.ACILIS, "Fiyatbot v2 aktif. Bugun kac hata bulacagiz merak ediyorum.", dark_level=1),
        BotMessage(MsgCat.ACILIS, "Loading... Ben yuklendim. Motivasyonum yuklenmedi ama olsun."),
        BotMessage(MsgCat.ACILIS, "Acilis tamamlandi. 0 hata tespit edildi. Saka yapiyorum, {sorun_toplam} hata var.", dark_level=2),
        BotMessage(MsgCat.ACILIS, "Tekrar buradayiz. Hazirsan baslayalim."),
        BotMessage(MsgCat.ACILIS, "Selam. Uygulamayi ozledim demeyecegim ama... neyse."),
        BotMessage(MsgCat.ACILIS, "Ise baslama vakti. Kahve aldin mi? Almadiysan zor."),
        BotMessage(MsgCat.ACILIS, "Yapay zekam yok ama sezgilerim kuvvetli."),
        BotMessage(MsgCat.ACILIS, "Bir gun urunler kendi kendini yonetecek. O gun degil bugun."),
        BotMessage(MsgCat.ACILIS, "Bugun iyi bir gun olabilir. Urunleri duzenlersek."),
    ],

    # ─── STOK SIFIR ───────────────────────────────────────
    MsgCat.STOK_SIFIR: [
        BotMessage(MsgCat.STOK_SIFIR, "{n} urunun stogu bitti. Depo sessizlige burundu.", severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Stok sifir: {n} urun. Raflar agliyor.", dark_level=1, severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Stoksuz urun satmak... cesaret ister. {n} urun bu durumda.", dark_level=2, severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "{n} urun tukendi. Musteriler gelip bos rafa bakacak.", severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Depoda ruzgar esiyor. {n} urunun stogu 0.", dark_level=2, severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Stok alarmi: {n} urun kritik seviyede. Harekete gec.", severity=Severity.CRITICAL, surface=Surface.TOAST, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Bu {n} urunun stogu bitti. Tabelaya 'tukendi' yazmak ister misin?", dark_level=1, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "{n} urun stoksuz. Satilsa bile gonderecek bir sey yok.", severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Tedarikciye telefon zil sesi: {n} urun bitmek uzere.", action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Stok sayimi: saydim, {n} tanesi 0. Saymam kolay oldu.", dark_level=1, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "{n} urun emekliye ayrildi. Stogu bitti.", dark_level=2, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Depo bosluk orani artiyor. {n} urun tamamen bos.", action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "{n} urun bitti. Musteri arayinca ne diyecegiz?", action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Stok problemi cozulmezse siparis problemi olur. {n} urun bekliyor.", severity=Severity.WARNING, action_target="stock"),
        BotMessage(MsgCat.STOK_SIFIR, "Kirmizi alarm: {n} urun stoksuz.", severity=Severity.CRITICAL, surface=Surface.TOAST, action_target="stock"),
    ],

    # ─── GÖRSEL EKSİK ─────────────────────────────────────
    MsgCat.GORSEL_EKSIK: [
        BotMessage(MsgCat.GORSEL_EKSIK, "{n} urunun gorseli yok. Gorunmez olmayi tercih etmisler.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Gorselsiz urun satan bir e-ticaret... cesur.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "{n} urun kamera karsisina cikmayi reddetmis.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Musteri gorselsiz urune tiklar mi? {n} tane boyle.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "{n} urun: 'Beni hayal et' konseptinde calisiyor.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Gorsel yoksa urun de yok. {n} tane.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Instagram caginda gorselsiz urun. {n} tane. Retro mu yapiyoruz?", dark_level=2, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "{n} urun 'gizemli kutu' modunda. Musteri ne aldigini bilmiyor.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Gorsel yuklenememis: {n}. Urunler utangac olabilir ama is oyle yurumez.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "E-ticaret kural 1: Gorsel koy. {n} urun uymuyor.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "{n} urun fotograf cektirmemis. Vesikalik bile yok.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Katalogun %{oran}'i gorselsiz. Gizli menu mu yapiyoruz?", dark_level=2, action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Bu {n} urun kendini sakliyor. Gorsel ekleyince ortaya cikacaklar.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Urun var, fiyat var, gorsel yok. {n} kez ayni hikaye.", action_target="products"),
        BotMessage(MsgCat.GORSEL_EKSIK, "Gorsel olmadan conversion olmaz. {n} urun donusum dusmani.", action_target="products"),
    ],

    # ─── FİYAT SIFIR ──────────────────────────────────────
    MsgCat.FIYAT_SIFIR: [
        BotMessage(MsgCat.FIYAT_SIFIR, "Fiyati 0 TL olan {n} urun var. Hayir kurumu degiliz.", severity=Severity.WARNING, surface=Surface.TOAST, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "{n} urunun fiyati 0. Kampanya mi, unutkanlik mi, isyan mi?", dark_level=1, severity=Severity.WARNING, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Bedava urun tespit ettim: {n} tane. Comertlik guzel ama kar da guzel.", action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "0 TL. Sifir. Nada. {n} urun bu fiyatla listelenmis.", dark_level=1, surface=Surface.TOAST, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Bu fiyati muhasebe gorurse bayilir. {n} urun 0 TL'de.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "{n} urunu bedavaya veriyoruz. Strateji mi, felaket mi?", dark_level=2, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Fiyat hatasi ciddi istir. {n} urune bir bak derim.", severity=Severity.WARNING, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "0 TL x {n} urun = 0 TL ciro. Matematik aci ama gercek.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Para kazanma plani: 1. Urun koy 2. Fiyat gir — Adim 2 yapilmamis. {n} kez.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Muhasebe alarmi: {n} urunun fiyati mantik disi.", severity=Severity.WARNING, surface=Surface.TOAST, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "{n} urun fiyatsiz. Paha bicilemez mi? Hayir, fiyat girilmemis.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.FIYAT_SIFIR, "Bu fiyatla zarar etmiyoruz. Cunku zaten hic satilmayacak. 0 TL.", dark_level=2, action_target="products"),
    ],

    # ─── AÇIKLAMA EKSİK ───────────────────────────────────
    MsgCat.ACIKLAMA_EKSIK: [
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "{n} urunun aciklamasi bos. Katalog mu bu, sir mi?", dark_level=1, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Aciklamasiz urunler artiyor. Sessiz protesto mu yapiyorlar?", dark_level=2, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "{n} urun kendini tanitamiyor. Aciklamalari yok cunku.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "SEO agliyor. {n} urunun aciklamasi bos.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Bu urunler gizemli olmayi secmis. Aciklamalari yok.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Musteri bu urune bakacak. Ne gorecek? Hicbir sey. Cunku aciklama yok.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "{n} urun sessiz sahnede. Aciklama yaz, sahneye ciksinlar.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Aciklama eksik olan urun sayisi: {n}. Kabul edilebilir deger: 0.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Bir urunun aciklamasini okudum. Aslinda okuyamadim. Cunku yoktu.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "{n} urunu kimse tanimiyor. Cunku kendilerini tanitmamislar.", dark_level=1, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Bos alan sayisi artiyor. {n} aciklama beni bekliyor.", action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Urunlerin %{oran}'i aciklamasiz. Gizli operasyon dosyasi gibi.", dark_level=2, action_target="products"),
        BotMessage(MsgCat.ACIKLAMA_EKSIK, "Meta description bos olan {n} urun Google'da 'bilinmeyen nesne' olarak geciyor.", action_target="products"),
    ],

    # ─── YENİ SİPARİŞ ─────────────────────────────────────
    MsgCat.SIPARIS_YENI: [
        BotMessage(MsgCat.SIPARIS_YENI, "{n} yeni siparis var! Kimilda.", surface=Surface.TOAST, severity=Severity.INFO, action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "Siparis geldi! {n} tane. Harekete gec.", surface=Surface.TOAST, action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "Kasa calisiyor: {n} yeni siparis.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "{n} musteri alisveris yapmis. Isleme alalim.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "Siparisler geliyor. {n} yeni. Gecikmeyelim.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "Musteri beklemiyor. {n} yeni siparis islenmeyi bekliyor.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "E-ticaret calisiyor: {n} yeni siparis geldi.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "Para girisi tespit edildi: {n} yeni siparis.", dark_level=1, action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "{n} siparis hazirlanmayi bekliyor. Kargo da bekliyor.", action_target="orders"),
        BotMessage(MsgCat.SIPARIS_YENI, "{n} yeni siparis! Her biri bir mutlu musteri adayi.", action_target="orders"),
    ],

    # ─── ESKİ ÜRÜN ────────────────────────────────────────
    MsgCat.ESKI_URUN: [
        BotMessage(MsgCat.ESKI_URUN, "{n} urun {gun}+ gundur guncellenmemis. Unutuldular mi?", surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "Son guncelleme: {gun} gun once. {n} urun toz topluyor.", dark_level=1, surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "Bu {n} urun zaman kapsulu olmus. Son guncelleme: {gun} gun once.", dark_level=2, surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "{n} urun arkeolojik kalinti gibi. Guncellemek lazim.", dark_level=2, surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "Guncellenmemis urunler: {n}. Fiyatlari hala dogru mu?", surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "{n} urun antika oldu. {gun}+ gundur guncellenmemis.", dark_level=2, surface=Surface.WHISPER, action_target="products"),
        BotMessage(MsgCat.ESKI_URUN, "Tarih: bugun. Son guncelleme: {gun} gun once. Fark: cok.", dark_level=1, surface=Surface.WHISPER, action_target="products"),
    ],

    # ─── BAŞARI ────────────────────────────────────────────
    MsgCat.BASARI: [
        BotMessage(MsgCat.BASARI, "5 urun ust uste hatasiz! Bu bir seri."),
        BotMessage(MsgCat.BASARI, "Art arda basarili kayitlar. Iyi gidiyorsun."),
        BotMessage(MsgCat.BASARI, "Hatasiz kayit serisi. Devam et."),
        BotMessage(MsgCat.BASARI, "Uretkenlik patlamasi! Iyi is."),
        BotMessage(MsgCat.BASARI, "Guzel calisma. Katalog toparlaniyor."),
        BotMessage(MsgCat.BASARI, "Harika tempo. Beni bile sasirttin."),
        BotMessage(MsgCat.BASARI, "Bugunku performans: ortalamanin ustunde."),
        BotMessage(MsgCat.BASARI, "Tebrikler. Verimli bir oturum."),
        BotMessage(MsgCat.BASARI, "Bu hizla gidersen yarin sorun kalmaz. Teorik olarak.", dark_level=1),
        BotMessage(MsgCat.BASARI, "Iyi gidiyorsun. Bu gidisle beni issiz birakacaksin.", dark_level=1),
    ],

    # ─── KAPANIŞ ───────────────────────────────────────────
    MsgCat.KAPANIS: [
        BotMessage(MsgCat.KAPANIS, "Gidiyorsun. {sorun_toplam} sorun kaldi ama... gorusuruz."),
        BotMessage(MsgCat.KAPANIS, "Oturum kapaniyor. Yarin gorusuruz. Sorunlar da burada olacak.", dark_level=1),
        BotMessage(MsgCat.KAPANIS, "Gule gule. Ben burada beklerim. Her zamanki gibi."),
        BotMessage(MsgCat.KAPANIS, "Iyi aksamlar. Yarin ayni hatalarla bulusmayalim.", dark_level=1),
        BotMessage(MsgCat.KAPANIS, "Cikis mi? Bu saatte normal. Ben kaliyorum. Mecburum.", dark_level=2),
        BotMessage(MsgCat.KAPANIS, "Hosca kal. Yarin daha az hatayla gorusmek dilesiyle."),
        BotMessage(MsgCat.KAPANIS, "Bugunluk bu kadar. {sorun_toplam} sorun yarina kaldi. Ama olsun."),
        BotMessage(MsgCat.KAPANIS, "Iyi geceler. Urunler de iyi geceler diyor. Gorseli olanlar.", dark_level=2),
        BotMessage(MsgCat.KAPANIS, "Cikista kapiyi kapat. Hatalar kacmasin.", dark_level=1),
        BotMessage(MsgCat.KAPANIS, "Gidiyorsun. Ben gitmiyorum. Adil mi? Degil. Ama olsun.", dark_level=2),
    ],

    # ─── GECE MODU ─────────────────────────────────────────
    MsgCat.GECE: [
        BotMessage(MsgCat.GECE, "Saat {saat}. Hala buradasin. Ben de.", surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Gece gec oldu. Urunler uyudu, hatalar uyumadi.", dark_level=1, surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Bu saatte kim calisir? Sen. Ve ben. Mecburen.", dark_level=2, surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Herkes gitti. Biz kaldik. Ve {sorun_toplam} sorun.", dark_level=1, surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Gece kusu moduna gectik. Sessiz ama dikkatli.", surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Bu saatte tek arkadasin benim. Ve {sorun_toplam} hatali urun.", dark_level=2, surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Gece gec. Dikkat dagilir. Fiyatlari kontrol et.", surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Iyi geceler. Git uyu. Urunler kacmaz. Ama stok bitebilir.", dark_level=1, surface=Surface.WHISPER),
        BotMessage(MsgCat.GECE, "Gece {saat}. Hata yapma olasiligim artti. Istatistiksel olarak.", dark_level=2, surface=Surface.WHISPER),
    ],

    # ─── BOŞTA BEKLEME ─────────────────────────────────────
    MsgCat.BOSTA: [
        BotMessage(MsgCat.BOSTA, "Burada misin? Urunler merak ediyor."),
        BotMessage(MsgCat.BOSTA, "Ekranda bir hareket yok. Ben de bekliyorum."),
        BotMessage(MsgCat.BOSTA, "Sessizlik... Guzel bir sey ama {sorun_toplam} sorun cozulmuyor boyle."),
        BotMessage(MsgCat.BOSTA, "Bir tusa bassan da hayat belirtisi versen."),
        BotMessage(MsgCat.BOSTA, "Canim sikildi. Bir urun falan duzenlersek?"),
        BotMessage(MsgCat.BOSTA, "Seni beklerken stok raporu hazirladim. {stok_sifir} urun kritik.", dark_level=1),
        BotMessage(MsgCat.BOSTA, "Hareketsizlik tespit edildi. Motivasyon modulu devreye giriyor."),
        BotMessage(MsgCat.BOSTA, "Sen donene kadar {sorun_toplam} sorunu listeledim. Hazir olunca bak."),
        BotMessage(MsgCat.BOSTA, "Oturuyorsun, ben oturuyorum, hatalar oturuyor. Biri kalksin.", dark_level=1),
        BotMessage(MsgCat.BOSTA, "Klavyeni ozledim. Bir seyler yaz."),
    ],

    # ─── KRİTİK İŞLEM ─────────────────────────────────────
    MsgCat.KRITIK: [
        BotMessage(MsgCat.KRITIK, "Toplu silme. {n} urun silinecek. Emin misin?", severity=Severity.CRITICAL, surface=Surface.TOAST),
        BotMessage(MsgCat.KRITIK, "Bu islem geri alinamaz. {n} kayit etkilenecek.", severity=Severity.CRITICAL, surface=Surface.TOAST),
        BotMessage(MsgCat.KRITIK, "Toplu fiyat degisikligi: {n} urun. Son bir kontrol.", severity=Severity.WARNING, surface=Surface.TOAST),
        BotMessage(MsgCat.KRITIK, "Dur bir saniye. {n} urunu silmek istiyorsun. Dogru mu?", severity=Severity.CRITICAL, surface=Surface.TOAST),
        BotMessage(MsgCat.KRITIK, "Bu buyuk bir operasyon. {n} urun etkilenecek. Hazir misin?", severity=Severity.WARNING, surface=Surface.TOAST),
    ],

    # ─── GENEL / CLICK TEPKI ──────────────────────────────
    MsgCat.GENEL: [
        BotMessage(MsgCat.GENEL, "Dur bir nefes al. Ben robot bile yoruldum."),
        BotMessage(MsgCat.GENEL, "Tikla tikla... Baska isin yok mu?"),
        BotMessage(MsgCat.GENEL, "Evet evet, buradayim. Sakin ol."),
        BotMessage(MsgCat.GENEL, "Bu kadar tiklayinca farkli bir sey olacagini mi sandin?"),
        BotMessage(MsgCat.GENEL, "Tamam tamam, anladim, ilgi istiyorsun."),
        BotMessage(MsgCat.GENEL, "Ben bir bot olarak fiyat hatalarini izlemek icin yaratildim. Hayallerim mi vardi? Bilemeyiz.", dark_level=2),
        BotMessage(MsgCat.GENEL, "Her sey yolunda gibi gorunuyor. Gibi.", dark_level=1),
        BotMessage(MsgCat.GENEL, "Form bos. Ben de bosim. Ama en azindan benim bir amacim var.", dark_level=2),
        BotMessage(MsgCat.GENEL, "Bir sey yapacak misin yoksa sadece bakiyor muyuz?"),
        BotMessage(MsgCat.GENEL, "Burada bekliyorum. Birisi bir sey yapsin diye."),
    ],
}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MESAJ MOTORU
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass
class SessionState:
    shown_ids: list[int] = field(default_factory=list)      # gösterilen mesaj indexleri
    last_event_times: dict[str, float] = field(default_factory=dict)
    event_counts: dict[str, int] = field(default_factory=dict)
    total_shown: int = 0
    last_msg_time: float = 0.0
    success_streak: int = 0


# Cooldown ayarları (saniye)
COOLDOWNS: dict[MsgCat, int] = {
    MsgCat.STOK_SIFIR: 1800,       # 30dk
    MsgCat.GORSEL_EKSIK: 3600,     # 1 saat
    MsgCat.FIYAT_SIFIR: 1800,      # 30dk
    MsgCat.ACIKLAMA_EKSIK: 3600,   # 1 saat
    MsgCat.SIPARIS_YENI: 900,      # 15dk
    MsgCat.ESKI_URUN: 10800,      # 3 saat
    MsgCat.BASARI: 600,            # 10dk
    MsgCat.BOSTA: 1200,            # 20dk
    MsgCat.GECE: 3600,            # 1 saat
    MsgCat.KRITIK: 0,             # cooldown yok
    MsgCat.GENEL: 60,             # 1dk
    MsgCat.ACILIS: 999999,        # oturum başına 1
    MsgCat.KAPANIS: 999999,       # oturum başına 1
}

GLOBAL_COOLDOWN = 90   # iki mesaj arası minimum saniye
MAX_PER_SESSION = 30   # oturum başına toplam max mesaj


class MessageEngine:
    """Kural tabanlı mesaj seçim motoru."""

    def __init__(self, dark_humor_level: int = 2):
        self.dark_humor_level = dark_humor_level  # 0-5
        self.state = SessionState()

    def pick(self, cat: MsgCat, context: dict | None = None) -> BotMessage | None:
        """Kategoriden uygun mesaj seç. None dönerse gösterme."""
        now = time.time()
        context = context or {}

        # Global cooldown
        if now - self.state.last_msg_time < GLOBAL_COOLDOWN and cat != MsgCat.KRITIK:
            return None

        # Oturum limiti
        if self.state.total_shown >= MAX_PER_SESSION and cat != MsgCat.KRITIK:
            return None

        # Event cooldown
        cat_key = cat.value
        cooldown = COOLDOWNS.get(cat, 300)
        if cat_key in self.state.last_event_times:
            if now - self.state.last_event_times[cat_key] < cooldown:
                return None

        # Mesaj havuzu
        pool = MESSAGES.get(cat, [])
        if not pool:
            return None

        # Dark humor filtre
        pool = [m for m in pool if m.dark_level <= self.dark_humor_level]
        if not pool:
            return None

        # Son 10 mesajı dışla (tekrar engeli)
        recent = set(self.state.shown_ids[-10:]) if self.state.shown_ids else set()
        filtered = [m for i, m in enumerate(pool) if id(m) not in recent]
        if not filtered:
            filtered = pool  # hepsi gösterildiyse sıfırla

        # Rastgele seç
        msg = random.choice(filtered)

        # Template'i context ile doldur
        msg = BotMessage(
            cat=msg.cat,
            template=self._fill_template(msg.template, context),
            dark_level=msg.dark_level,
            severity=msg.severity,
            surface=msg.surface,
            action_target=msg.action_target,
            action_filter=msg.action_filter,
        )

        # State güncelle
        self.state.shown_ids.append(id(msg))
        self.state.last_msg_time = now
        self.state.last_event_times[cat_key] = now
        self.state.event_counts[cat_key] = self.state.event_counts.get(cat_key, 0) + 1
        self.state.total_shown += 1

        return msg

    def _fill_template(self, template: str, context: dict) -> str:
        """Mesaj template'ini context verileriyle doldur."""
        try:
            # Saat bilgisi ekle
            context.setdefault("saat", datetime.now().strftime("%H:%M"))

            # Güvenli format — eksik key'ler {key} olarak kalır
            for key, val in context.items():
                template = template.replace("{" + key + "}", str(val))
            return template
        except Exception:
            return template

    def reset(self):
        """Session state sıfırla."""
        self.state = SessionState()
