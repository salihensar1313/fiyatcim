"""Ana Sayfa — hosgeldin + hizli erisim kartlari."""

from datetime import datetime
import customtkinter as ctk

from app.theme import COLORS, FONTS, SPACING
from app.version import APP_VERSION


def _get_greeting() -> str:
    """Saate gore selamlama."""
    h = datetime.now().hour
    if h < 7:
        return "Iyi geceler"
    elif h < 12:
        return "Gunaydin"
    elif h < 18:
        return "Iyi gunler"
    else:
        return "Iyi aksamlar"


class HomePage(ctk.CTkScrollableFrame):
    """Ana sayfa — hosgeldin + hizli erisim."""

    def __init__(self, master, user_email: str = "", on_navigate=None, **kwargs):
        super().__init__(master, **kwargs)
        self.configure(fg_color="transparent")
        self.user_email = user_email
        self.on_navigate = on_navigate
        self._build_ui()

    def _build_ui(self):
        greeting = _get_greeting()

        # ─── Hosgeldin Kart ──────────────────────────
        welcome_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                      corner_radius=12, border_width=1,
                                      border_color=COLORS["border"])
        welcome_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))

        inner = ctk.CTkFrame(welcome_frame, fg_color="transparent")
        inner.pack(fill="x", padx=24, pady=20)

        ctk.CTkLabel(
            inner, text=f"{greeting}!",
            font=FONTS["h2"], text_color=COLORS["text_primary"],
        ).pack(anchor="w")

        if self.user_email:
            ctk.CTkLabel(
                inner, text=self.user_email,
                font=FONTS["small"], text_color=COLORS["text_muted"],
            ).pack(anchor="w", pady=(2, 0))

        ctk.CTkLabel(
            inner, text="Urun Yoneticisi'ne hos geldiniz. Asagidaki kartlardan hizlica ilerleyebilirsiniz.",
            font=FONTS["body"], text_color=COLORS["text_secondary"],
            wraplength=600, justify="left",
        ).pack(anchor="w", pady=(8, 0))

        # ─── Hizli Erisim Kartlari ──────────────────
        ctk.CTkLabel(
            self, text="Hizli Erisim",
            font=FONTS["h3"], text_color=COLORS["text_primary"],
        ).pack(anchor="w", pady=(0, 8))

        cards_frame = ctk.CTkFrame(self, fg_color="transparent")
        cards_frame.pack(fill="x")
        cards_frame.columnconfigure((0, 1, 2, 3), weight=1, uniform="card")

        quick_actions = [
            ("dashboard", "Ozet", "Istatistiklere bak", COLORS["accent"]),
            ("products", "Urunler", "Urunleri yonet", COLORS["info"]),
            ("orders", "Siparisler", "Siparislere bak", COLORS["success"]),
            ("new_product", "Yeni Urun", "Urun ekle", COLORS["purple"]),
        ]

        for i, (key, title, desc, color) in enumerate(quick_actions):
            card = ctk.CTkFrame(cards_frame, fg_color=COLORS["bg_card"],
                                 corner_radius=10, border_width=1,
                                 border_color=COLORS["border"],
                                 cursor="hand2")
            card.grid(row=0, column=i, padx=4, pady=4, sticky="nsew")

            bar = ctk.CTkFrame(card, width=4, fg_color=color, corner_radius=2)
            bar.pack(side="left", fill="y")

            text_frame = ctk.CTkFrame(card, fg_color="transparent")
            text_frame.pack(fill="both", expand=True, padx=14, pady=14)

            ctk.CTkLabel(
                text_frame, text=title,
                font=FONTS["h4"], text_color=COLORS["text_primary"],
            ).pack(anchor="w")

            ctk.CTkLabel(
                text_frame, text=desc,
                font=FONTS["tiny"], text_color=COLORS["text_muted"],
            ).pack(anchor="w", pady=(2, 0))

            card.bind("<Button-1>", lambda e, k=key: self._navigate(k))
            for child in card.winfo_children():
                child.bind("<Button-1>", lambda e, k=key: self._navigate(k))
                for gc in child.winfo_children():
                    gc.bind("<Button-1>", lambda e, k=key: self._navigate(k))

        # ─── Ikinci Satir ──────────────────────────
        cards_frame2 = ctk.CTkFrame(self, fg_color="transparent")
        cards_frame2.pack(fill="x", pady=(8, 0))
        cards_frame2.columnconfigure((0, 1, 2, 3), weight=1, uniform="card2")

        quick_actions2 = [
            ("categories", "Kategoriler", "Kategori yonet", COLORS["warning"]),
            ("brands", "Markalar", "Marka yonet", COLORS["info"]),
            ("stock", "Stok", "Stok kontrol", COLORS["danger"]),
            ("guide", "Rehber", "Nasil kullanilir", COLORS["text_muted"]),
        ]

        for i, (key, title, desc, color) in enumerate(quick_actions2):
            card = ctk.CTkFrame(cards_frame2, fg_color=COLORS["bg_card"],
                                 corner_radius=10, border_width=1,
                                 border_color=COLORS["border"],
                                 cursor="hand2")
            card.grid(row=0, column=i, padx=4, pady=4, sticky="nsew")

            bar = ctk.CTkFrame(card, width=4, fg_color=color, corner_radius=2)
            bar.pack(side="left", fill="y")

            text_frame = ctk.CTkFrame(card, fg_color="transparent")
            text_frame.pack(fill="both", expand=True, padx=14, pady=14)

            ctk.CTkLabel(
                text_frame, text=title,
                font=FONTS["h4"], text_color=COLORS["text_primary"],
            ).pack(anchor="w")

            ctk.CTkLabel(
                text_frame, text=desc,
                font=FONTS["tiny"], text_color=COLORS["text_muted"],
            ).pack(anchor="w", pady=(2, 0))

            card.bind("<Button-1>", lambda e, k=key: self._navigate(k))
            for child in card.winfo_children():
                child.bind("<Button-1>", lambda e, k=key: self._navigate(k))
                for gc in child.winfo_children():
                    gc.bind("<Button-1>", lambda e, k=key: self._navigate(k))

        # Alt bilgi
        ctk.CTkLabel(
            self,
            text=f"Fiyatcim Urun Yoneticisi v{APP_VERSION}",
            font=FONTS["tiny"], text_color=COLORS["text_muted"],
        ).pack(anchor="center", pady=(24, 4))

    def _navigate(self, page_key: str):
        if self.on_navigate:
            self.on_navigate(page_key)
