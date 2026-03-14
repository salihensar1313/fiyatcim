"""Gorsel rehber — site ekran goruntuleri ile hangi bolumu duzenledigini gor — premium tema."""

import os
import customtkinter as ctk
from PIL import Image, ImageTk

from app.theme import COLORS, FONTS


GUIDE_SECTIONS = [
    {
        "title": "1. Kategori Kartlari",
        "image": "kategori-kartlari.png",
        "desc": "Bu bolumu degistirmek icin:\n→ Kategoriler sayfasindan gorsel + isim duzenle\n→ Gorsel Sec butonu ile kategori resmi yukle",
    },
    {
        "title": "2. One Cikan Urunler",
        "image": "one-cikan-urunler.png",
        "desc": "Bu bolumu degistirmek icin:\n→ Urunler > urun sec > 'One Cikan' toggle ac\n→ is_featured = True olan urunler burada gosterilir",
    },
    {
        "title": "3. One Cikan Indirimler",
        "image": "one-cikan-indirimler.png",
        "desc": "Bu bolumu degistirmek icin:\n→ Urunler > urun sec > Indirimli fiyat gir\n→ sale_price < price olan urunler otomatik gosterilir\n→ Indirim orani: (price - sale_price) / price * 100",
    },
    {
        "title": "4. Trend Urunler",
        "image": "trend-urunler.png",
        "desc": "Bu bolumu degistirmek icin:\n→ Urunler > urun sec > 'Trend' toggle ac\n→ is_trending = True olan urunler burada gosterilir",
    },
    {
        "title": "5. Kampanya Radar",
        "image": "kampanya-radar.png",
        "desc": "Bu bolum otomatik calisir:\n→ Indirimli fiyati (sale_price) olan urunler gosterilir\n→ En yuksek indirim oranina gore siralanir\n→ Ek ayar gerekmez",
    },
]


class SiteGuide(ctk.CTkScrollableFrame):
    """Site görsel rehber sayfası."""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        self.configure(fg_color="transparent")
        self._photo_refs = []
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="Site Gorsel Rehber", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 4))

        ctk.CTkLabel(
            self,
            text="Asagidaki ekran goruntuleri sitedeki her bolumu gosterir.\n"
                 "Hangi bolumu nasil degistirebileceginizi aciklamalardan ogrenin.",
            font=FONTS["body"], text_color=COLORS["text_secondary"],
            justify="left",
        ).pack(anchor="w", pady=(0, 16))

        guides_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "guides")

        for section in GUIDE_SECTIONS:
            card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                 border_width=1, border_color=COLORS["border"])
            card.pack(fill="x", pady=(0, 16))

            # Accent bar
            bar = ctk.CTkFrame(card, width=4, fg_color=COLORS["warning"], corner_radius=2)
            bar.pack(side="left", fill="y")

            inner = ctk.CTkFrame(card, fg_color="transparent")
            inner.pack(fill="x", padx=16, pady=12)

            ctk.CTkLabel(inner, text=section["title"], font=FONTS["h3"],
                         text_color=COLORS["warning"]).pack(anchor="w", pady=(0, 8))

            img_path = os.path.join(guides_dir, section["image"])
            if os.path.exists(img_path):
                try:
                    img = Image.open(img_path)
                    max_w = 700
                    if img.width > max_w:
                        ratio = max_w / img.width
                        img = img.resize((max_w, int(img.height * ratio)), Image.LANCZOS)
                    photo = ImageTk.PhotoImage(img)
                    self._photo_refs.append(photo)
                    ctk.CTkLabel(inner, text="", image=photo).pack(anchor="w", pady=(0, 8))
                except Exception:
                    ctk.CTkLabel(inner, text="[Gorsel yuklenemedi]", font=FONTS["small"],
                                 text_color=COLORS["danger"]).pack(anchor="w", pady=(0, 8))
            else:
                ctk.CTkLabel(
                    inner,
                    text=f"[Gorsel bulunamadi: {section['image']}]\n"
                         f"guides/ klasorune ekran goruntusu kaydedin.",
                    font=FONTS["small"], text_color=COLORS["text_muted"],
                ).pack(anchor="w", pady=(0, 8))

            ctk.CTkLabel(inner, text=section["desc"], font=FONTS["body"],
                         text_color=COLORS["text_primary"], justify="left").pack(anchor="w")

        ctk.CTkLabel(
            self,
            text="Not: Gorsel eklemek icin fiyatcim.com sitesinden ekran goruntusu alin\n"
                 "ve guides/ klasorune kaydedin.",
            font=FONTS["small"], text_color=COLORS["text_muted"], justify="left",
        ).pack(anchor="w", pady=(8, 0))
