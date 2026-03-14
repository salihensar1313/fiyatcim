"""Yardımcı fonksiyonlar: slug üretme, doğrulama, format helpers, döviz kuru."""

import re
import time
import threading
import unicodedata
import urllib.request
import json

# Türkçe karakter dönüşüm tablosu
TR_CHAR_MAP = {
    "ç": "c", "Ç": "C",
    "ğ": "g", "Ğ": "G",
    "ı": "i", "I": "I",
    "İ": "I", "i": "i",
    "ö": "o", "Ö": "O",
    "ş": "s", "Ş": "S",
    "ü": "u", "Ü": "U",
}


def slugify(text: str) -> str:
    """Türkçe uyumlu slug üretir."""
    text = text.strip().lower()
    for tr_char, ascii_char in TR_CHAR_MAP.items():
        text = text.replace(tr_char, ascii_char.lower())
    text = unicodedata.normalize("NFKD", text)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text


def validate_required(fields: dict[str, str]) -> list[str]:
    """Boş zorunlu alanları döner."""
    errors = []
    for name, value in fields.items():
        if not value or not str(value).strip():
            errors.append(name)
    return errors


def validate_tax_number(vkn: str) -> bool:
    """10 haneli vergi kimlik numarası doğrulama."""
    return bool(re.match(r"^\d{10}$", vkn.strip()))


def validate_tc_kimlik(tc: str) -> bool:
    """11 haneli TC kimlik no doğrulama."""
    return bool(re.match(r"^\d{11}$", tc.strip()))


def format_price(amount: float, currency: str = "₺") -> str:
    """Fiyat formatı: 1.234,56 ₺"""
    if amount is None:
        return "-"
    formatted = f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{formatted} {currency}"


def format_price_usd(amount: float) -> str:
    return format_price(amount, "$")


def format_date(iso_str: str | None, include_time: bool = True) -> str:
    """ISO tarih string'ini okunabilir formata cevirir."""
    if not iso_str:
        return "-"
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        if include_time:
            return dt.strftime("%d.%m.%Y %H:%M")
        return dt.strftime("%d.%m.%Y")
    except Exception:
        return str(iso_str)[:16]


def parse_turkish_number(value) -> str | None:
    """Türkçe sayı formatını (1.500,50) Python float-uyumlu string'e çevirir.
    Döner: '1500.50' veya None (parse edilemezse).
    """
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    # Zaten standart float ise dokunma
    if re.match(r'^-?\d+\.?\d*$', s):
        return s
    # Türkçe format: nokta binlik ayracı, virgül ondalık
    if ',' in s:
        s = s.replace('.', '').replace(',', '.')
    return s


def safe_int(value, default: int = 0) -> int:
    """Güvenli int dönüşümü — Türkçe format destekli."""
    try:
        parsed = parse_turkish_number(value)
        if parsed is None:
            return default
        return int(float(parsed))
    except (ValueError, TypeError):
        return default


def safe_float(value, default: float = 0.0) -> float:
    """Güvenli float dönüşümü — Türkçe format destekli."""
    try:
        parsed = parse_turkish_number(value)
        if parsed is None:
            return default
        return float(parsed)
    except (ValueError, TypeError):
        return default


# ==========================================
# DOLAR KURU
# ==========================================

FALLBACK_RATE = 38.5
_exchange_cache = {"rate": FALLBACK_RATE, "timestamp": 0}
_exchange_lock = threading.Lock()
CACHE_TTL = 600  # 10 dakika


def get_exchange_rate() -> float:
    """USD/TRY kurunu ceker. 10dk cache, thread-safe, hata durumunda fallback."""
    now = time.time()
    if now - _exchange_cache["timestamp"] < CACHE_TTL:
        return _exchange_cache["rate"]

    if not _exchange_lock.acquire(blocking=False):
        return _exchange_cache["rate"]
    try:
        if now - _exchange_cache["timestamp"] < CACHE_TTL:
            return _exchange_cache["rate"]
        url = "https://open.er-api.com/v6/latest/USD"
        req = urllib.request.Request(url, headers={"User-Agent": "FiyatcimApp/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            rate = data.get("rates", {}).get("TRY", FALLBACK_RATE)
            _exchange_cache["rate"] = float(rate)
            _exchange_cache["timestamp"] = now
            return _exchange_cache["rate"]
    except Exception:
        return _exchange_cache["rate"]
    finally:
        _exchange_lock.release()
