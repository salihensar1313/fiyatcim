"""Otomatik guncelleme sistemi — GitHub Releases API ile kontrol, indirme, kurulum."""

import os
import sys
import json
import tempfile
import zipfile
import subprocess
import threading
import urllib.request

import customtkinter as ctk

from app.version import APP_VERSION
from app.theme import COLORS, FONTS


# ─── GitHub bilgileri ────────────────────────────────────────
GITHUB_REPO = "salihensar1313/fiyatcim"
RELEASES_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"


# ─── Versiyon karsilastirma ──────────────────────────────────
def _is_newer(remote: str, local: str) -> bool:
    """Semver karsilastirma: remote > local ise True."""
    try:
        r = tuple(int(x) for x in remote.split("."))
        l = tuple(int(x) for x in local.split("."))
        return r > l
    except (ValueError, AttributeError):
        return False


# ─── Guncelleme kontrolu ────────────────────────────────────
def check_for_update() -> dict | None:
    """GitHub Releases API'den son surumu kontrol et.
    Guncelleme varsa dict dondurur, yoksa None."""
    try:
        req = urllib.request.Request(RELEASES_URL, headers={
            "User-Agent": "FiyatcimApp",
            "Accept": "application/vnd.github.v3+json",
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            release = json.loads(resp.read().decode())

        tag = release.get("tag_name", "").lstrip("v")
        if not tag or not _is_newer(tag, APP_VERSION):
            return None

        # ZIP asset bul
        zip_asset = None
        for asset in release.get("assets", []):
            if asset["name"].endswith(".zip"):
                zip_asset = asset
                break

        if not zip_asset:
            return None

        return {
            "version": tag,
            "changelog": release.get("body", ""),
            "download_url": zip_asset["browser_download_url"],
            "download_size": zip_asset.get("size", 0),
            "filename": zip_asset["name"],
        }
    except Exception:
        return None


# ─── Uygulama dizinini bul ───────────────────────────────────
def _get_app_directory() -> str:
    """PyInstaller onedir build'de uygulama dizinini dondurur."""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ─── Batch script sablonu ────────────────────────────────────
BAT_TEMPLATE = r"""@echo off
chcp 65001 >NUL 2>&1
setlocal enabledelayedexpansion
set "APP_DIR=%~1"
set "UPDATE_DIR=%~2"
set "EXE_NAME=%~3"
set "PID=%~4"

echo.
echo  Fiyatcim guncelleniyor, lutfen bekleyin...
echo.

:: Uygulamanin kapanmasini bekle (max 30 saniye)
set /a attempts=0
:wait_loop
tasklist /FI "PID eq %PID%" 2>NUL | find /I "%PID%" >NUL
if %ERRORLEVEL%==0 (
    set /a attempts+=1
    if !attempts! GEQ 30 (
        echo  HATA: Uygulama kapatilamadi. Guncelleme iptal edildi.
        pause
        exit /b 1
    )
    timeout /t 1 /nobreak >NUL
    goto wait_loop
)

:: Ekstra guvenlik beklemesi
timeout /t 1 /nobreak >NUL

:: Eski dosyalari sil (config ve session koru)
for /f "delims=" %%i in ('dir /b "%APP_DIR%"') do (
    if /I not "%%i"==".session.json" (
    if /I not "%%i"=="config.json" (
    if /I not "%%i"==".env" (
        rmdir /s /q "%APP_DIR%\%%i" 2>NUL
        del /q "%APP_DIR%\%%i" 2>NUL
    )))
)

:: Yeni dosyalari kopyala
xcopy /s /e /y /q "%UPDATE_DIR%\*" "%APP_DIR%\" >NUL

:: Gecici dosyalari temizle
rmdir /s /q "%UPDATE_DIR%" 2>NUL

echo.
echo  Guncelleme tamamlandi! Uygulama yeniden baslatiliyor...
echo.

:: Uygulamayi yeniden baslat
start "" "%APP_DIR%\%EXE_NAME%"

:: Bu scripti sil
(goto) 2>nul & del "%~f0"
"""


# ─── ZIP extract ─────────────────────────────────────────────
def _extract_update(zip_path: str, temp_dir: str) -> str:
    """ZIP'i ac, icerik dizinini dondur."""
    extract_to = os.path.join(temp_dir, "extracted")
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(extract_to)

    # Tek ust klasor icinde mi kontrol et
    contents = os.listdir(extract_to)
    if len(contents) == 1 and os.path.isdir(os.path.join(extract_to, contents[0])):
        return os.path.join(extract_to, contents[0])
    return extract_to


# ─── Kurulum + yeniden baslatma ──────────────────────────────
def _install_and_restart(extracted_dir: str):
    """Batch script olustur, baslat, uygulamadan cik."""
    app_dir = _get_app_directory()
    exe_name = "Fiyatcim-UrunYoneticisi.exe"
    pid = os.getpid()

    bat_path = os.path.join(tempfile.gettempdir(), "fiyatcim_updater.bat")
    with open(bat_path, "w", encoding="utf-8") as f:
        f.write(BAT_TEMPLATE)

    # Detached process olarak baslat
    subprocess.Popen(
        [bat_path, app_dir, extracted_dir, exe_name, str(pid)],
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS,
        close_fds=True,
    )

    # Uygulamadan cik
    sys.exit(0)


# ─── Guncelleme Dialogu ─────────────────────────────────────
class UpdateDialog(ctk.CTkToplevel):
    """Guncelleme bildirimi + indirme + kurulum dialogu."""

    def __init__(self, master, release_info: dict):
        super().__init__(master)
        self.release_info = release_info
        self._download_thread = None
        self._progress = 0.0
        self._status = "ready"  # ready, downloading, extracting, installing, error
        self._error_msg = ""
        self._zip_path = ""
        self._temp_dir = ""

        self.title("Guncelleme Mevcut")
        self.geometry("500x420")
        self.resizable(False, False)
        self.configure(fg_color=COLORS["bg_primary"])

        # Modal
        self.transient(master)
        self.grab_set()

        # Ortala
        self.after(10, self._center)

        self._build_ui()

    def _center(self):
        self.update_idletasks()
        w = self.winfo_width()
        h = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (w // 2)
        y = (self.winfo_screenheight() // 2) - (h // 2)
        self.geometry(f"+{x}+{y}")

    def _build_ui(self):
        # Baslik
        ctk.CTkLabel(
            self, text="Yeni Guncelleme Mevcut!",
            font=FONTS["h2"], text_color=COLORS["accent_light"],
        ).pack(pady=(20, 4))

        # Versiyon bilgisi
        ver_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=8)
        ver_frame.pack(fill="x", padx=24, pady=(8, 0))

        ctk.CTkLabel(
            ver_frame,
            text=f"Mevcut: v{APP_VERSION}  →  Yeni: v{self.release_info['version']}",
            font=FONTS["body_bold"], text_color=COLORS["text_primary"],
        ).pack(pady=10)

        # Degisiklik notu
        ctk.CTkLabel(
            self, text="Degisiklikler:", font=FONTS["small_bold"],
            text_color=COLORS["text_secondary"], anchor="w",
        ).pack(fill="x", padx=24, pady=(12, 4))

        self.changelog_box = ctk.CTkTextbox(
            self, height=140, font=FONTS["small"],
            fg_color=COLORS["bg_card"], text_color=COLORS["text_primary"],
            border_color=COLORS["border"], corner_radius=8,
        )
        self.changelog_box.pack(fill="x", padx=24)
        changelog = self.release_info.get("changelog", "Degisiklik notu yok.")
        self.changelog_box.insert("1.0", changelog)
        self.changelog_box.configure(state="disabled")

        # Dosya boyutu
        size_mb = self.release_info.get("download_size", 0) / (1024 * 1024)
        ctk.CTkLabel(
            self, text=f"Dosya boyutu: {size_mb:.1f} MB",
            font=FONTS["tiny"], text_color=COLORS["text_muted"],
        ).pack(pady=(4, 0))

        # Progress bar (baslangicta gizli)
        self.progress_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.progress_bar = ctk.CTkProgressBar(
            self.progress_frame, width=400, height=14,
            progress_color=COLORS["accent"], fg_color=COLORS["bg_card"],
        )
        self.progress_bar.set(0)
        self.progress_bar.pack(pady=(0, 4))

        self.progress_label = ctk.CTkLabel(
            self.progress_frame, text="",
            font=FONTS["small"], text_color=COLORS["text_secondary"],
        )
        self.progress_label.pack()

        # Butonlar
        self.btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.btn_frame.pack(fill="x", padx=24, pady=(12, 16))

        self.btn_later = ctk.CTkButton(
            self.btn_frame, text="Sonra", width=100, height=36,
            font=FONTS["body_bold"], fg_color=COLORS["bg_card"],
            hover_color=COLORS["bg_card_hover"], corner_radius=8,
            command=self._on_later,
        )
        self.btn_later.pack(side="left")

        self.btn_update = ctk.CTkButton(
            self.btn_frame, text="Guncelle", width=160, height=36,
            font=FONTS["body_bold"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=8,
            command=self._on_update,
        )
        self.btn_update.pack(side="right")

    def _on_later(self):
        self.grab_release()
        self.destroy()

    def _on_update(self):
        """Indirmeyi baslat."""
        self.btn_update.configure(state="disabled", text="Indiriliyor...")
        self.btn_later.configure(state="disabled")
        self.changelog_box.pack_forget()

        # Progress goster
        self.progress_frame.pack(fill="x", padx=24, pady=(8, 0))
        self._status = "downloading"
        self._progress = 0.0

        # Background thread
        self._download_thread = threading.Thread(target=self._download_worker, daemon=True)
        self._download_thread.start()

        # Progress polling
        self._poll_progress()

    def _download_worker(self):
        """Background thread: indir + extract."""
        try:
            url = self.release_info["download_url"]
            self._temp_dir = tempfile.mkdtemp(prefix="fiyatcim_update_")
            self._zip_path = os.path.join(self._temp_dir, "update.zip")

            req = urllib.request.Request(url, headers={"User-Agent": "FiyatcimApp"})
            resp = urllib.request.urlopen(req, timeout=120)
            total = int(resp.headers.get("Content-Length", 0))

            downloaded = 0
            with open(self._zip_path, "wb") as f:
                while True:
                    chunk = resp.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total > 0:
                        self._progress = downloaded / total

            # Extract
            self._status = "extracting"
            self._extracted_dir = _extract_update(self._zip_path, self._temp_dir)
            self._status = "done"

        except Exception as e:
            self._error_msg = str(e)
            self._status = "error"

    def _poll_progress(self):
        """100ms arayla progress kontrol et."""
        if self._status == "downloading":
            self.progress_bar.set(self._progress)
            pct = int(self._progress * 100)
            self.progress_label.configure(text=f"Indiriliyor... %{pct}")
            self.after(100, self._poll_progress)

        elif self._status == "extracting":
            self.progress_bar.set(1.0)
            self.progress_label.configure(text="Dosyalar aciliyor...")
            self.after(100, self._poll_progress)

        elif self._status == "done":
            self.progress_bar.set(1.0)
            self.progress_label.configure(text="Kurulum baslatiliyor...")
            self.after(500, self._do_install)

        elif self._status == "error":
            self.progress_label.configure(
                text=f"Hata: {self._error_msg[:60]}",
                text_color=COLORS["danger"],
            )
            self.btn_later.configure(state="normal", text="Kapat")
            self.btn_update.configure(state="normal", text="Tekrar Dene")
            self.btn_update.configure(command=self._on_update)

    def _do_install(self):
        """Batch script olustur ve uygulamadan cik."""
        try:
            _install_and_restart(self._extracted_dir)
        except Exception as e:
            self.progress_label.configure(
                text=f"Kurulum hatasi: {str(e)[:60]}",
                text_color=COLORS["danger"],
            )
            self.btn_later.configure(state="normal", text="Kapat")
