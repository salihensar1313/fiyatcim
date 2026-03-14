"""Ana Sayfa — FiyatBot v2 canlı maskot + veri raporu."""

import random
import time
from datetime import datetime
import customtkinter as ctk

from app.theme import COLORS, FONTS, SPACING
from app.version import APP_VERSION
from app.fiyatbot_engine import MESSAGES, MsgCat, MessageEngine


# ─── Bot ASCII Artları (ruh haline göre) ──────────────────
BOT_FACES = {
    "normal": r"""   ( ◉  ◉ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "side_eye": r"""   ( ◉    ◉)
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "unimpressed": r"""   ( ━  ━ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "surprised": r"""   ( ◎  ◎ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "wink": r"""   ( ━  ◉ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "sleepy": r"""   ( -  - )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃ zZz  ┃
   ╰━━━━━╯""",

    "angry": r"""   ( ▼  ▼ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",

    "happy": r"""   ( ◠  ◠ )
    ╰━┳━╯
   ╭━━┻━━╮
   ┃  FB  ┃
   ╰━━━━━╯""",
}


def _get_mood():
    """Saate göre ruh hali belirle."""
    h = datetime.now().hour
    if h < 7:
        return "sleepy", "gece"
    elif h < 12:
        return "normal", "sabah"
    elif h < 14:
        return "wink", "ogle"
    elif h < 18:
        return "side_eye", "mesai"
    elif h < 21:
        return "unimpressed", "aksam"
    else:
        return "sleepy", "gece"


class HomePage(ctk.CTkScrollableFrame):
    """Ana sayfa — FiyatBot v2 canlı maskot + veri raporu."""

    def __init__(self, master, user_email: str = "", on_navigate=None,
                 scan_result=None, **kwargs):
        super().__init__(master, **kwargs)
        self.configure(fg_color="transparent")
        self.user_email = user_email
        self.on_navigate = on_navigate
        self._scan_result = scan_result
        self._msg_timer_id = None
        self._click_count = 0
        self._last_click_time = 0
        self._engine = MessageEngine(dark_humor_level=2)
        self._build_ui()
        self._schedule_next_message()

    def update_scan_result(self, scan_result):
        """Tarama sonucu güncelle — veri kartlarını yenile."""
        self._scan_result = scan_result
        self._update_data_cards()

    def _get_context(self) -> dict:
        """Mesaj template context."""
        if self._scan_result:
            return self._scan_result.to_context()
        return {"stok_sifir": "?", "gorsel_yok": "?", "fiyat_sifir": "?",
                "aciklama_eksik": "?", "siparis_yeni": "?", "sorun_toplam": "?",
                "eski_urun": "?", "urun_toplam": "?", "gun": 30}

    def _build_ui(self):
        mood, period = _get_mood()
        ctx = self._get_context()

        # ─── FiyatBot Kart ───────────────────────────
        bot_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                  corner_radius=12, border_width=1,
                                  border_color=COLORS["accent_muted"])
        bot_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))

        bot_inner = ctk.CTkFrame(bot_frame, fg_color="transparent")
        bot_inner.pack(fill="x", padx=24, pady=20)

        # Bot header row
        header_row = ctk.CTkFrame(bot_inner, fg_color="transparent")
        header_row.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            header_row, text="FiyatBot",
            font=("Segoe UI", 24, "bold"), text_color=COLORS["accent_light"],
        ).pack(side="left")

        ctk.CTkLabel(
            header_row, text="  v2.0  ",
            font=FONTS["tiny"], text_color=COLORS["text_muted"],
        ).pack(side="left", padx=(8, 0))

        self._status_badge = ctk.CTkLabel(
            header_row, text="  Cevrimici  ",
            font=FONTS["badge"], text_color="#ffffff",
            fg_color=COLORS["success"], corner_radius=8,
        )
        self._status_badge.pack(side="left", padx=(8, 0))

        self._mood_label = ctk.CTkLabel(
            header_row, text=self._mood_text(period),
            font=FONTS["tiny"], text_color=COLORS["text_muted"],
        )
        self._mood_label.pack(side="right")

        # Bot ASCII art — tıklanabilir
        self._face_label = ctk.CTkLabel(
            bot_inner, text=BOT_FACES.get(mood, BOT_FACES["normal"]),
            font=("Consolas", 16), text_color=COLORS["accent"],
            justify="center", cursor="hand2",
        )
        self._face_label.pack(pady=(4, 8))
        self._face_label.bind("<Button-1>", self._on_bot_click)

        # Mesaj balonu
        self._msg_frame = ctk.CTkFrame(bot_inner, fg_color=COLORS["accent_muted"],
                                        corner_radius=10, cursor="hand2")
        self._msg_frame.pack(fill="x", pady=(0, 10))

        # Açılış mesajı — motordan çek
        opening = self._engine.pick(MsgCat.ACILIS, ctx)
        greeting_text = opening.template if opening else "Hos geldin. Sistem hazir."

        self._msg_label = ctk.CTkLabel(
            self._msg_frame, text=f'"{greeting_text}"',
            font=("Segoe UI", 13), text_color=COLORS["text_primary"],
            wraplength=600, justify="left",
        )
        self._msg_label.pack(padx=16, pady=12)
        self._msg_frame.bind("<Button-1>", self._on_bot_click)
        self._msg_label.bind("<Button-1>", self._on_bot_click)

        # "tıkla = yeni mesaj" notu
        ctk.CTkLabel(
            bot_inner, text="bota tikla → yeni laf",
            font=("Segoe UI", 9), text_color=COLORS["text_muted"],
        ).pack(pady=(2, 0))

        # ─── Canlı Veri Kartları (sorun raporu) ────────
        self._data_frame = ctk.CTkFrame(self, fg_color="transparent")
        self._data_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))
        self._build_data_cards()

        # ─── Hoşgeldin Kart ──────────────────────────
        welcome_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                      corner_radius=12, border_width=1,
                                      border_color=COLORS["border"])
        welcome_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))

        inner = ctk.CTkFrame(welcome_frame, fg_color="transparent")
        inner.pack(fill="x", padx=24, pady=16)

        ctk.CTkLabel(
            inner, text="Hos Geldiniz!",
            font=FONTS["h2"], text_color=COLORS["text_primary"],
        ).pack(anchor="w")

        if self.user_email:
            ctk.CTkLabel(
                inner, text=self.user_email,
                font=FONTS["small"], text_color=COLORS["text_muted"],
            ).pack(anchor="w", pady=(2, 0))

        # ─── Hızlı Erişim Kartları ──────────────────
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
            ("guide", "Rehber", "Nasil kullanilir", COLORS["warning"]),
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

        # Alt bilgi
        ctk.CTkLabel(
            self,
            text=f"Fiyatcim Urun Yoneticisi v{APP_VERSION}  |  Powered by FiyatBot v2",
            font=FONTS["tiny"], text_color=COLORS["text_muted"],
        ).pack(anchor="center", pady=(24, 4))

    # ─── Canlı Veri Kartları ──────────────────────────────

    def _build_data_cards(self):
        """Sorun rapor kartlarını oluştur."""
        for w in self._data_frame.winfo_children():
            w.destroy()

        self._data_frame.columnconfigure((0, 1, 2, 3, 4), weight=1, uniform="data")
        ctx = self._get_context()

        cards = [
            ("Stoksuz", str(ctx.get("stok_sifir", "?")), COLORS["danger"], "stock"),
            ("Gorselsiz", str(ctx.get("gorsel_yok", "?")), COLORS["warning"], "products"),
            ("Fiyat=0", str(ctx.get("fiyat_sifir", "?")), COLORS["danger"], "products"),
            ("Aciklamasiz", str(ctx.get("aciklama_eksik", "?")), COLORS["warning"], "products"),
            ("Yeni Siparis", str(ctx.get("siparis_yeni", "?")), COLORS["success"], "orders"),
        ]

        for i, (label, value, color, target) in enumerate(cards):
            card = ctk.CTkFrame(self._data_frame, fg_color=COLORS["bg_card"],
                                 corner_radius=10, border_width=1,
                                 border_color=COLORS["border"], cursor="hand2")
            card.grid(row=0, column=i, padx=4, pady=4, sticky="nsew")

            # Değer (büyük sayı)
            val_color = color if value not in ("0", "?") else COLORS["text_muted"]
            ctk.CTkLabel(
                card, text=value,
                font=("Segoe UI", 28, "bold"), text_color=val_color,
            ).pack(pady=(12, 2))

            # Etiket
            ctk.CTkLabel(
                card, text=label,
                font=FONTS["tiny"], text_color=COLORS["text_secondary"],
            ).pack(pady=(0, 10))

            # Tıklama
            card.bind("<Button-1>", lambda e, k=target: self._navigate(k))
            for child in card.winfo_children():
                child.bind("<Button-1>", lambda e, k=target: self._navigate(k))

    def _update_data_cards(self):
        """Veri kartlarını güncelle."""
        self._build_data_cards()

    # ─── Bot Etkileşim ─────────────────────────────────────

    def _on_bot_click(self, event=None):
        """Bota tıklanınca yeni mesaj göster + yüz değiştir."""
        now = time.time()
        self._click_count += 1
        ctx = self._get_context()

        # Hızlı tıklama tepkisi
        if now - self._last_click_time < 2:
            msg = self._engine.pick(MsgCat.GENEL, ctx)
            if msg:
                self._set_message(msg.template)
            self._set_face("surprised")
        else:
            # Karma havuz
            cats = [MsgCat.GENEL, MsgCat.BOSTA, MsgCat.ACILIS]
            random.shuffle(cats)
            for cat in cats:
                # Engine cooldown'ı bypass et (click tepkisi için)
                pool = MESSAGES.get(cat, [])
                pool = [m for m in pool if m.dark_level <= self._engine.dark_humor_level]
                if pool:
                    msg = random.choice(pool)
                    self._set_message(self._engine._fill_template(msg.template, ctx))
                    break

            faces = ["normal", "side_eye", "wink", "unimpressed"]
            self._set_face(random.choice(faces))

        self._last_click_time = now
        self._schedule_next_message()

    def _set_message(self, text: str):
        try:
            self._msg_label.configure(text=f'"{text}"')
        except Exception:
            pass

    def _set_face(self, mood: str):
        try:
            self._face_label.configure(text=BOT_FACES.get(mood, BOT_FACES["normal"]))
        except Exception:
            pass

    # ─── Otomatik Mesaj Rotasyonu ──────────────────────────

    def _schedule_next_message(self):
        if self._msg_timer_id:
            try:
                self.after_cancel(self._msg_timer_id)
            except (ValueError, Exception):
                pass
        delay = random.randint(18000, 30000)  # 18-30 saniye
        self._msg_timer_id = self.after(delay, self._auto_rotate)

    def _auto_rotate(self):
        ctx = self._get_context()
        cats = [MsgCat.GENEL, MsgCat.BOSTA]

        # Sorun varsa ilgili kategoriden de mesaj göster
        if self._scan_result:
            if self._scan_result.stok_sifir > 0:
                cats.append(MsgCat.STOK_SIFIR)
            if self._scan_result.gorsel_yok > 0:
                cats.append(MsgCat.GORSEL_EKSIK)
            if self._scan_result.fiyat_sifir > 0:
                cats.append(MsgCat.FIYAT_SIFIR)
            if self._scan_result.aciklama_eksik > 0:
                cats.append(MsgCat.ACIKLAMA_EKSIK)

        # Gece modu
        h = datetime.now().hour
        if h >= 22 or h < 7:
            cats.append(MsgCat.GECE)

        random.shuffle(cats)
        for cat in cats:
            pool = MESSAGES.get(cat, [])
            pool = [m for m in pool if m.dark_level <= self._engine.dark_humor_level]
            if pool:
                msg = random.choice(pool)
                text = self._engine._fill_template(msg.template, {**ctx, "n": ctx.get("stok_sifir", "?")})
                self._set_message(text)

                # Yüz: sorun varsa angry/unimpressed
                if cat in (MsgCat.STOK_SIFIR, MsgCat.FIYAT_SIFIR):
                    self._set_face(random.choice(["angry", "unimpressed"]))
                elif cat == MsgCat.GECE:
                    self._set_face("sleepy")
                elif random.random() < 0.3:
                    mood, _ = _get_mood()
                    self._set_face(random.choice(["normal", "side_eye", "wink", mood]))
                break

        self._schedule_next_message()

    # ─── Yardımcı ──────────────────────────────────────────

    def _mood_text(self, period: str) -> str:
        moods = {
            "gece": "gece modu",
            "sabah": "sabah — kahve ictin mi?",
            "ogle": "ogle — mola ver",
            "mesai": "mesai modu",
            "aksam": "aksam — artik birak sunu",
        }
        return moods.get(period, "")

    def _navigate(self, page_key: str):
        if self.on_navigate:
            self.on_navigate(page_key)

    def destroy(self):
        if self._msg_timer_id:
            try:
                self.after_cancel(self._msg_timer_id)
            except Exception:
                pass
        super().destroy()
