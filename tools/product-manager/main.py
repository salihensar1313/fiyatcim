"""Fiyatcim Urun Yoneticisi — Ana baslatma dosyasi."""

import os
import sys
import customtkinter as ctk
from PIL import Image, ImageTk

from app.login_screen import LoginScreen
from app.main_window import MainWindow

APP_DIR = os.path.dirname(os.path.abspath(__file__))

# Windows taskbar'da Python yerine kendi ikonumuzu goster
try:
    import ctypes
    ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID("fiyatcim.urunyoneticisi")
except Exception:
    pass


class App(ctk.CTk):
    """Ana uygulama penceresi."""

    def __init__(self):
        super().__init__()

        self.title("Fiyatcim — Urun Yoneticisi")
        self.geometry("1280x800")
        self.minsize(1024, 700)

        # Pencere ikonu
        ico_path = os.path.join(APP_DIR, "logo.ico")
        png_path = os.path.join(APP_DIR, "logo.png")

        if os.path.exists(ico_path):
            self.iconbitmap(ico_path)

        # wm_iconphoto (bazi WM'ler icin)
        if os.path.exists(png_path):
            try:
                img = Image.open(png_path)
                icon_sizes = []
                for size in [256, 128, 64, 48, 32, 16]:
                    resized = img.copy()
                    resized.thumbnail((size, size), Image.LANCZOS)
                    icon_sizes.append(ImageTk.PhotoImage(resized))
                self._icon_refs = icon_sizes
                self.wm_iconphoto(True, *icon_sizes)
            except Exception:
                pass

        # Koyu tema
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # Global mouse wheel scroll — tum scrollable frame'lerde calissin
        self.bind_all("<MouseWheel>", self._on_global_mousewheel, add="+")

        # Giriş ekranını göster
        self.login_screen = LoginScreen(self, on_login_success=self._on_login)
        self.login_screen.pack(fill="both", expand=True)


    def _on_global_mousewheel(self, event):
        """Mouse wheel scroll — en yakin scrollable frame'i bul ve kaydir."""
        widget = event.widget
        # Widget'tan yukari cikarak CTkScrollableFrame bul
        w = widget
        while w:
            # CTkScrollableFrame icindeki _parent_canvas'i hedefle
            if hasattr(w, '_parent_canvas'):
                # 3 birim kaydır (varsayılan 1 çok yavaş)
                w._parent_canvas.yview_scroll(-3 * (event.delta // 120), "units")
                return
            try:
                w = w.master
            except Exception:
                break

    def _on_login(self, sb_manager):
        """Giriş başarılı — ana ekrana geç."""
        self.login_screen.destroy()
        self.main_window = MainWindow(self, sb_manager)

        # Guncelleme kontrolu (2 sn gecikme, background thread)
        self.after(2000, self._check_updates)

    def _check_updates(self):
        """Background thread'de GitHub'dan guncelleme kontrol et."""
        import threading

        def _worker():
            try:
                from app.updater import check_for_update, UpdateDialog
                result = check_for_update()
                if result and result.get("download_url"):
                    self.after(0, lambda: UpdateDialog(self, result))
            except Exception:
                pass  # Sessiz gecis

        threading.Thread(target=_worker, daemon=True).start()


def main():
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler()]
    )

    try:
        app = App()
        app.mainloop()
    except Exception as e:
        logging.error("Uygulama baslatma hatasi: %s", e, exc_info=True)
        try:
            from tkinter import messagebox
            messagebox.showerror("Hata", f"Uygulama baslatilamadi:\n{e}")
        except Exception:
            print(f"KRITIK HATA: {e}")


if __name__ == "__main__":
    main()
