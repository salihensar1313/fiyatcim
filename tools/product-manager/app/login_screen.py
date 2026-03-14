"""Supabase giriş ekranı — premium tasarım."""

import os
import json
import base64

from app.version import APP_VERSION
import customtkinter as ctk
from tkinter import messagebox
from PIL import Image

from app.theme import COLORS, FONTS

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSION_FILE = os.path.join(APP_DIR, ".session.json")

# Keyring desteği (varsa güvenli, yoksa eski yöntem)
_KEYRING_SERVICE = "FiyatcimProductManager"
try:
    import keyring as _keyring
    _HAS_KEYRING = True
except ImportError:
    _keyring = None
    _HAS_KEYRING = False


class LoginScreen(ctk.CTkFrame):
    """Email + şifre ile Supabase auth giriş ekranı."""

    def __init__(self, master, on_login_success):
        super().__init__(master)
        self.on_login_success = on_login_success
        self.configure(fg_color=COLORS["bg_primary"])

        card = ctk.CTkFrame(self, width=420, height=500, corner_radius=16,
                             fg_color=COLORS["bg_card"], border_width=1,
                             border_color=COLORS["border"])
        card.place(relx=0.5, rely=0.5, anchor="center")
        card.pack_propagate(False)

        logo_path = os.path.join(APP_DIR, "logo.png")
        if os.path.exists(logo_path):
            logo_img = ctk.CTkImage(
                light_image=Image.open(logo_path),
                dark_image=Image.open(logo_path),
                size=(120, 120)
            )
            ctk.CTkLabel(card, image=logo_img, text="").pack(pady=(24, 4))
            self._logo_ref = logo_img
        else:
            ctk.CTkLabel(card, text="Fiyatcim", font=FONTS["logo"],
                         text_color=COLORS["brand_red"]).pack(pady=(40, 0))
            ctk.CTkLabel(card, text=".com", font=FONTS["body"],
                         text_color=COLORS["text_muted"]).pack(pady=(0, 5))

        ctk.CTkLabel(card, text=f"Urun Yoneticisi v{APP_VERSION}", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(pady=(0, 24))

        ctk.CTkLabel(card, text="E-posta", font=FONTS["h4"],
                     text_color=COLORS["text_primary"], anchor="w").pack(padx=40, anchor="w")
        self.email_entry = ctk.CTkEntry(
            card, width=340, height=42, placeholder_text="admin@fiyatcim.com",
            font=FONTS["body"], fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.email_entry.pack(padx=40, pady=(4, 12))

        ctk.CTkLabel(card, text="Sifre", font=FONTS["h4"],
                     text_color=COLORS["text_primary"], anchor="w").pack(padx=40, anchor="w")
        self.password_entry = ctk.CTkEntry(
            card, width=340, height=42, placeholder_text="********", show="*",
            font=FONTS["body"], fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.password_entry.pack(padx=40, pady=(4, 12))

        self.remember_var = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(
            card, text="Beni Hatirla", variable=self.remember_var,
            font=FONTS["body"], fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            border_color=COLORS["border"], text_color=COLORS["text_secondary"]
        ).pack(padx=40, anchor="w", pady=(0, 16))

        self.login_btn = ctk.CTkButton(
            card, text="Giris Yap", width=340, height=44,
            font=FONTS["h3"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=10,
            command=self._do_login)
        self.login_btn.pack(padx=40)

        self.error_label = ctk.CTkLabel(card, text="", font=FONTS["body"],
                                         text_color=COLORS["danger"])
        self.error_label.pack(pady=(10, 0))

        self.email_entry.bind("<Return>", lambda e: self.password_entry.focus())
        self.password_entry.bind("<Return>", lambda e: self._do_login())
        self._try_auto_login()

    def _try_auto_login(self):
        email, pwd = self._load_session()
        if email and pwd:
            self.email_entry.insert(0, email)
            self.password_entry.insert(0, pwd)
            self.remember_var.set(True)
            self.after(200, self._do_login)

    @staticmethod
    def _save_session(email: str, password: str):
        if _HAS_KEYRING:
            try:
                _keyring.set_password(_KEYRING_SERVICE, email, password)
                with open(SESSION_FILE, "w", encoding="utf-8") as f:
                    json.dump({"email": email, "store": "keyring"}, f)
                return
            except Exception:
                pass
        # Fallback: base64 (eski yöntem)
        data = {"email": email, "pwd": base64.b64encode(password.encode("utf-8")).decode("utf-8")}
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f)

    @staticmethod
    def _load_session() -> tuple[str, str]:
        if not os.path.exists(SESSION_FILE):
            return "", ""
        try:
            with open(SESSION_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            email = data.get("email", "")
            if not email:
                return "", ""
            # Keyring ile saklanan
            if data.get("store") == "keyring" and _HAS_KEYRING:
                pwd = _keyring.get_password(_KEYRING_SERVICE, email)
                return email, pwd or ""
            # Eski base64 yöntemi
            pwd = base64.b64decode(data.get("pwd", "")).decode("utf-8")
            return email, pwd
        except Exception:
            try:
                os.remove(SESSION_FILE)
            except Exception:
                pass
            return "", ""

    @staticmethod
    def _clear_session():
        if os.path.exists(SESSION_FILE):
            try:
                with open(SESSION_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                email = data.get("email", "")
                if email and _HAS_KEYRING:
                    try:
                        _keyring.delete_password(_KEYRING_SERVICE, email)
                    except Exception:
                        pass
            except Exception:
                pass
            try:
                os.remove(SESSION_FILE)
            except Exception:
                pass

    def _do_login(self):
        email = self.email_entry.get().strip()
        password = self.password_entry.get().strip()
        if not email or not password:
            self.error_label.configure(text="E-posta ve sifre zorunlu")
            return
        self.login_btn.configure(state="disabled", text="Giris yapiliyor...")
        self.error_label.configure(text="")
        self.update_idletasks()
        try:
            from app.supabase_client import SupabaseManager
            sb = SupabaseManager()
            sb.sign_in(email, password)
            if self.remember_var.get():
                self._save_session(email, password)
            else:
                self._clear_session()
            self.on_login_success(sb)
        except Exception as e:
            error_msg = str(e)
            if "Invalid login" in error_msg or "invalid" in error_msg.lower():
                self.error_label.configure(text="Hatali e-posta veya sifre")
            else:
                self.error_label.configure(text=f"Hata: {error_msg[:60]}")
            self.login_btn.configure(state="normal", text="Giris Yap")
