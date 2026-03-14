"""FiyatBot v2 — Veritabanı tarayıcı. Supabase'den sorunları bulur."""

import logging
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("fiyatbot_scanner")


class ScanResult:
    """Tek bir tarama sonucu."""
    __slots__ = ("stok_sifir", "gorsel_yok", "fiyat_sifir", "aciklama_eksik",
                 "siparis_yeni", "eski_urun", "urun_toplam", "sorun_toplam",
                 "stok_sifir_list", "gorsel_yok_list", "fiyat_sifir_list",
                 "aciklama_eksik_list", "eski_urun_list", "eski_urun_gun")

    def __init__(self):
        self.stok_sifir = 0
        self.gorsel_yok = 0
        self.fiyat_sifir = 0
        self.aciklama_eksik = 0
        self.siparis_yeni = 0
        self.eski_urun = 0
        self.urun_toplam = 0
        self.sorun_toplam = 0
        self.stok_sifir_list = []
        self.gorsel_yok_list = []
        self.fiyat_sifir_list = []
        self.aciklama_eksik_list = []
        self.eski_urun_list = []
        self.eski_urun_gun = 30

    def to_context(self) -> dict:
        """Mesaj template context'i olarak döndür."""
        return {
            "stok_sifir": self.stok_sifir,
            "gorsel_yok": self.gorsel_yok,
            "fiyat_sifir": self.fiyat_sifir,
            "aciklama_eksik": self.aciklama_eksik,
            "siparis_yeni": self.siparis_yeni,
            "eski_urun": self.eski_urun,
            "urun_toplam": self.urun_toplam,
            "sorun_toplam": self.sorun_toplam,
            "gun": self.eski_urun_gun,
        }


class FiyatBotScanner:
    """Supabase verilerini tarayıp sorunları tespit eder."""

    def __init__(self, sb_manager):
        self.sb = sb_manager
        self._last_result: ScanResult | None = None

    def scan(self) -> ScanResult:
        """Tam tarama yap. Hata olursa boş sonuç döner."""
        result = ScanResult()
        try:
            products = self._get_active_products()
            result.urun_toplam = len(products)

            for p in products:
                # Stok sıfır veya negatif
                stock = p.get("stock", 0) or 0
                if stock <= 0:
                    result.stok_sifir += 1
                    result.stok_sifir_list.append(p.get("name", "?"))

                # Görsel eksik
                images = p.get("images") or []
                cover = p.get("cover_image") or ""
                if not images and not cover:
                    result.gorsel_yok += 1
                    result.gorsel_yok_list.append(p.get("name", "?"))

                # Fiyat sıfır veya null
                price = p.get("price", 0) or 0
                if price <= 0:
                    result.fiyat_sifir += 1
                    result.fiyat_sifir_list.append(p.get("name", "?"))

                # Açıklama eksik
                desc = (p.get("description") or "").strip()
                short_desc = (p.get("short_description") or "").strip()
                if not desc and not short_desc:
                    result.aciklama_eksik += 1
                    result.aciklama_eksik_list.append(p.get("name", "?"))

                # Eski ürün (30+ gün güncellenmemiş)
                updated = p.get("updated_at") or p.get("created_at") or ""
                if updated and self._is_old(updated, days=30):
                    result.eski_urun += 1
                    result.eski_urun_list.append(p.get("name", "?"))

            # Sipariş sayısı
            try:
                result.siparis_yeni = self.sb.get_orders_today_count()
            except Exception:
                result.siparis_yeni = 0

            result.sorun_toplam = (result.stok_sifir + result.gorsel_yok +
                                   result.fiyat_sifir + result.aciklama_eksik)

        except Exception as e:
            logger.warning("FiyatBot scan hatasi: %s", e)

        self._last_result = result
        return result

    @property
    def last_result(self) -> ScanResult | None:
        return self._last_result

    def _get_active_products(self) -> list[dict]:
        """Aktif ürünleri çek."""
        try:
            res = (
                self.sb.client.table("products")
                .select("id, name, sku, stock, price, cover_image, images, "
                        "description, short_description, updated_at, created_at")
                .eq("is_active", True)
                .is_("deleted_at", "null")
                .execute()
            )
            return res.data or []
        except Exception as e:
            logger.warning("Urun cekme hatasi: %s", e)
            return []

    def _is_old(self, date_str: str, days: int = 30) -> bool:
        """Tarih, belirtilen günden eski mi?"""
        try:
            # ISO format parse
            if "T" in date_str:
                dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            else:
                dt = datetime.fromisoformat(date_str)

            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)

            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            return dt < cutoff
        except Exception:
            return False
