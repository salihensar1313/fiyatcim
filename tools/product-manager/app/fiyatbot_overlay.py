"""FiyatBot v2 — Bildirim overlay sistemi (sağ balon, toast, fısıltı, ikon)."""

import tkinter as tk
import customtkinter as ctk
from app.theme import COLORS, FONTS
from app.fiyatbot_engine import BotMessage, Surface, Severity


class FiyatBotOverlay:
    """Ana pencere üzerine bildirim balonları çizen overlay sistemi."""

    def __init__(self, master: ctk.CTk, on_action=None):
        """
        master: Ana CTk penceresi
        on_action: Tıklanınca sayfa değiştirme callback — on_action(page_key)
        """
        self.master = master
        self.on_action = on_action
        self._active_popups: list[tk.Toplevel] = []
        self._max_popups = 2  # aynı anda max popup

    def show(self, msg: BotMessage):
        """Mesajı uygun yüzeyde göster."""
        # Max popup kontrolü
        self._cleanup_dead()
        if len(self._active_popups) >= self._max_popups:
            return

        if msg.surface == Surface.TOAST:
            self._show_toast(msg)
        elif msg.surface == Surface.WHISPER:
            self._show_whisper(msg)
        else:
            self._show_balloon(msg)

    def _show_balloon(self, msg: BotMessage, duration_ms: int = 7000):
        """Sağ kenardan kayan bildirim balonu."""
        popup = tk.Toplevel(self.master)
        popup.overrideredirect(True)
        popup.attributes("-topmost", True)
        popup.configure(bg="#1e1e38")

        # Şeffaflık (Windows)
        try:
            popup.attributes("-alpha", 0.95)
        except Exception:
            pass

        width = 340
        height = 110

        # Ana frame
        frame = tk.Frame(popup, bg="#1e1e38", padx=16, pady=12)
        frame.pack(fill="both", expand=True)

        # Üst bar — bot adı + kapatma
        top = tk.Frame(frame, bg="#1e1e38")
        top.pack(fill="x")

        bot_icon = tk.Label(top, text="🤖", font=("Segoe UI", 11), bg="#1e1e38", fg="#818cf8")
        bot_icon.pack(side="left")

        tk.Label(top, text=" FiyatBot", font=("Segoe UI", 11, "bold"),
                 bg="#1e1e38", fg="#818cf8").pack(side="left")

        # Severity badge
        sev_colors = {Severity.INFO: "#3b82f6", Severity.WARNING: "#f59e0b", Severity.CRITICAL: "#ef4444"}
        sev_text = {Severity.INFO: "", Severity.WARNING: " ⚠", Severity.CRITICAL: " 🔴"}
        if msg.severity != Severity.INFO:
            tk.Label(top, text=sev_text[msg.severity], font=("Segoe UI", 10),
                     bg="#1e1e38", fg=sev_colors[msg.severity]).pack(side="left", padx=(4, 0))

        close_btn = tk.Label(top, text="✕", font=("Segoe UI", 12), bg="#1e1e38",
                             fg="#64748b", cursor="hand2")
        close_btn.pack(side="right")
        close_btn.bind("<Button-1>", lambda e: self._close_popup(popup))

        # Mesaj
        msg_label = tk.Label(frame, text=msg.template, font=("Segoe UI", 11),
                             bg="#1e1e38", fg="#f1f5f9", wraplength=300, justify="left")
        msg_label.pack(fill="x", pady=(8, 4))

        # Action link
        if msg.action_target and self.on_action:
            link = tk.Label(frame, text=f"  {_action_label(msg.action_target)} →",
                            font=("Segoe UI", 10), bg="#1e1e38", fg="#818cf8",
                            cursor="hand2")
            link.pack(anchor="w")
            link.bind("<Button-1>", lambda e, t=msg.action_target: self._on_link_click(popup, t))
            height += 20

        # Sol kenar renk çizgisi
        border_color = sev_colors.get(msg.severity, "#6366f1")
        popup.configure(highlightbackground=border_color, highlightthickness=2)

        # Pozisyon — sağ üst
        self.master.update_idletasks()
        mx = self.master.winfo_x()
        my = self.master.winfo_y()
        mw = self.master.winfo_width()

        # Mevcut popup'ların altına yerleştir
        offset_y = len(self._active_popups) * (height + 10)
        x = mx + mw - width - 30
        y = my + 60 + offset_y

        popup.geometry(f"{width}x{height}+{x}+{y}")
        self._active_popups.append(popup)

        # Otomatik kapanma
        popup.after(duration_ms, lambda: self._close_popup(popup))

    def _show_toast(self, msg: BotMessage, duration_ms: int = 8000):
        """Üstten kayan toast bildirim."""
        popup = tk.Toplevel(self.master)
        popup.overrideredirect(True)
        popup.attributes("-topmost", True)

        # Severity renk
        bg_colors = {Severity.INFO: "#1e40af", Severity.WARNING: "#854d0e", Severity.CRITICAL: "#991b1b"}
        border_colors = {Severity.INFO: "#3b82f6", Severity.WARNING: "#f59e0b", Severity.CRITICAL: "#ef4444"}
        bg = bg_colors.get(msg.severity, "#1e40af")

        popup.configure(bg=bg, highlightbackground=border_colors.get(msg.severity, "#3b82f6"),
                        highlightthickness=2)
        try:
            popup.attributes("-alpha", 0.95)
        except Exception:
            pass

        frame = tk.Frame(popup, bg=bg, padx=16, pady=10)
        frame.pack(fill="both", expand=True)

        top = tk.Frame(frame, bg=bg)
        top.pack(fill="x")

        sev_icons = {Severity.INFO: "ℹ️", Severity.WARNING: "⚠️", Severity.CRITICAL: "🚨"}
        tk.Label(top, text=f"{sev_icons.get(msg.severity, '🤖')} FiyatBot",
                 font=("Segoe UI", 11, "bold"), bg=bg, fg="#ffffff").pack(side="left")

        close_btn = tk.Label(top, text="✕", font=("Segoe UI", 12), bg=bg,
                             fg="#94a3b8", cursor="hand2")
        close_btn.pack(side="right")
        close_btn.bind("<Button-1>", lambda e: self._close_popup(popup))

        tk.Label(frame, text=msg.template, font=("Segoe UI", 11),
                 bg=bg, fg="#ffffff", wraplength=500, justify="left").pack(fill="x", pady=(6, 2))

        if msg.action_target and self.on_action:
            link = tk.Label(frame, text=f"  {_action_label(msg.action_target)} →",
                            font=("Segoe UI", 10), bg=bg, fg="#a5b4fc", cursor="hand2")
            link.pack(anchor="w")
            link.bind("<Button-1>", lambda e, t=msg.action_target: self._on_link_click(popup, t))

        # Pozisyon — üst orta
        width = 500
        height = 90
        self.master.update_idletasks()
        mx = self.master.winfo_x()
        mw = self.master.winfo_width()
        my = self.master.winfo_y()

        x = mx + (mw - width) // 2
        y = my + 10

        popup.geometry(f"{width}x{height}+{x}+{y}")
        self._active_popups.append(popup)
        popup.after(duration_ms, lambda: self._close_popup(popup))

    def _show_whisper(self, msg: BotMessage, duration_ms: int = 5000):
        """Sol alt köşede küçük fısıltı."""
        popup = tk.Toplevel(self.master)
        popup.overrideredirect(True)
        popup.attributes("-topmost", True)

        bg = "#13132a"
        popup.configure(bg=bg)
        try:
            popup.attributes("-alpha", 0.85)
        except Exception:
            pass

        frame = tk.Frame(popup, bg=bg, padx=12, pady=8)
        frame.pack(fill="both", expand=True)

        tk.Label(frame, text=f"💬 {msg.template}", font=("Segoe UI", 10),
                 bg=bg, fg="#94a3b8", wraplength=280, justify="left").pack()

        width = 300
        height = 55
        self.master.update_idletasks()
        mx = self.master.winfo_x()
        my = self.master.winfo_y()
        mh = self.master.winfo_height()

        x = mx + 200  # nav bar'ın sağında
        y = my + mh - height - 50

        popup.geometry(f"{width}x{height}+{x}+{y}")
        self._active_popups.append(popup)
        popup.after(duration_ms, lambda: self._close_popup(popup))

    def _on_link_click(self, popup: tk.Toplevel, target: str):
        """Action link tıklanınca sayfaya git + popup kapat."""
        self._close_popup(popup)
        if self.on_action:
            self.on_action(target)

    def _close_popup(self, popup: tk.Toplevel):
        """Popup'ı güvenli şekilde kapat."""
        try:
            if popup in self._active_popups:
                self._active_popups.remove(popup)
            popup.destroy()
        except Exception:
            pass

    def _cleanup_dead(self):
        """Ölmüş popup referanslarını temizle."""
        self._active_popups = [p for p in self._active_popups if _is_alive(p)]

    def destroy_all(self):
        """Tüm popup'ları kapat."""
        for p in self._active_popups[:]:
            try:
                p.destroy()
            except Exception:
                pass
        self._active_popups.clear()


def _is_alive(popup: tk.Toplevel) -> bool:
    try:
        return popup.winfo_exists()
    except Exception:
        return False


def _action_label(target: str) -> str:
    labels = {
        "products": "Urunleri Gor",
        "stock": "Stok Sayfasina Git",
        "orders": "Siparislere Bak",
        "categories": "Kategorilere Git",
        "brands": "Markalara Git",
        "dashboard": "Ozet'e Git",
    }
    return labels.get(target, "Git")
