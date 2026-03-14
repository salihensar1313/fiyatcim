"""Görsel yönetimi widget: drag & drop, dosya seç, önizleme, sırala, sil."""

import customtkinter as ctk
from tkinter import filedialog
from PIL import Image, ImageTk
from pathlib import Path
import tkinter as tk
import os
import io
import urllib.request


# Basit in-memory cache: URL → PIL.Image
_url_image_cache: dict[str, Image.Image] = {}


def _load_image_from_url(url: str) -> Image.Image | None:
    """URL'den görseli indir ve PIL Image olarak döndür (cache'li)."""
    if url in _url_image_cache:
        return _url_image_cache[url].copy()
    try:
        import ssl
        ctx = ssl.create_default_context()
        req = urllib.request.Request(url, headers={"User-Agent": "FiyatcimApp/1.0"})
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            data = resp.read()
        img = Image.open(io.BytesIO(data))
        _url_image_cache[url] = img.copy()
        return img
    except Exception as e:
        print(f"[IMG] Gorsel yuklenemedi: {url[:80]}... — {e}")
        return None


class ImageManager(ctk.CTkFrame):
    """Ürün görselleri — büyük önizleme + thumbnail strip + drag & drop."""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        self.configure(fg_color="transparent")
        self.image_paths: list[str] = []
        self.image_urls: list[str] = []
        self.thumbnails: list[ImageTk.PhotoImage] = []
        self.main_photo = None
        self.selected_index = 0

        self._build_ui()

    def _build_ui(self):
        # ─── Sol: Büyük önizleme ─────────────────────
        left = ctk.CTkFrame(self, fg_color="transparent")
        left.pack(side="left", fill="both", expand=True, padx=(0, 12))

        # Ana görsel alanı (drag & drop destekli)
        self.preview_frame = ctk.CTkFrame(left, height=360, fg_color="#1a1a2e",
                                           corner_radius=12)
        self.preview_frame.pack(fill="x")
        self.preview_frame.pack_propagate(False)

        # Drop zone (başlangıç durumu)
        self.drop_zone = ctk.CTkFrame(self.preview_frame, fg_color="transparent")
        self.drop_zone.place(relx=0.5, rely=0.5, anchor="center")

        self.drop_icon = ctk.CTkLabel(
            self.drop_zone, text="📁", font=("Segoe UI", 48)
        )
        self.drop_icon.pack()
        self.drop_label = ctk.CTkLabel(
            self.drop_zone,
            text="Gorsel yuklemek icin tiklayin\nveya dosyalari buraya surukleyin",
            font=("Segoe UI", 13), text_color="#64748b", justify="center"
        )
        self.drop_label.pack(pady=(8, 0))

        self.drop_hint = ctk.CTkLabel(
            self.drop_zone,
            text="JPG, PNG, WebP  •  Maks 5MB",
            font=("Segoe UI", 11), text_color="#475569"
        )
        self.drop_hint.pack(pady=(4, 0))

        # Büyük önizleme label (görsel yüklenince gösterilir)
        self.main_label = ctk.CTkLabel(self.preview_frame, text="")
        # place ile gizli tutuyoruz, görsel gelince göstereceğiz

        # Tıklama ile dosya seç
        self.preview_frame.bind("<Button-1>", lambda e: self._add_files())

        # Zoom ikonu (sağ üst köşe)
        self.zoom_btn = ctk.CTkButton(
            self.preview_frame, text="🔍", width=32, height=32,
            font=("Segoe UI", 16), fg_color="#1a1a2e", hover_color="#2d2d3f",
            corner_radius=8, command=self._zoom_current
        )

        # Thumbnail strip
        thumb_outer = ctk.CTkFrame(left, fg_color="transparent")
        thumb_outer.pack(fill="x", pady=(8, 0))

        self.thumb_frame = ctk.CTkFrame(thumb_outer, fg_color="transparent", height=72)
        self.thumb_frame.pack(side="left", fill="x", expand=True)

        # Butonlar sağda
        btn_frame = ctk.CTkFrame(thumb_outer, fg_color="transparent")
        btn_frame.pack(side="right", padx=(8, 0))

        ctk.CTkButton(
            btn_frame, text="+", width=32, height=32,
            font=("Segoe UI", 18, "bold"), fg_color="#3b82f6", hover_color="#2563eb",
            corner_radius=8, command=self._add_files
        ).pack(pady=(0, 4))

        ctk.CTkButton(
            btn_frame, text="📂", width=32, height=32,
            font=("Segoe UI", 16), fg_color="#6b7280", hover_color="#4b5563",
            corner_radius=8, command=self._add_folder
        ).pack()

        # Görsel sayısı
        self.count_label = ctk.CTkLabel(
            left, text="0 gorsel", font=("Segoe UI", 11), text_color="#64748b"
        )
        self.count_label.pack(anchor="w", pady=(4, 0))

        # ─── Sağ: Bilgi paneli ──────────────────────
        right = ctk.CTkFrame(self, width=200, fg_color="#1e1e2e", corner_radius=12)
        right.pack(side="right", fill="y")
        right.pack_propagate(False)

        ctk.CTkLabel(right, text="Gorsel Bilgileri",
                     font=("Segoe UI", 13, "bold"), text_color="#e2e8f0"
                     ).pack(padx=12, pady=(12, 8), anchor="w")

        sep = ctk.CTkFrame(right, height=1, fg_color="#334155")
        sep.pack(fill="x", padx=12)

        self.info_name = ctk.CTkLabel(right, text="Dosya: -",
                                       font=("Segoe UI", 11), text_color="#94a3b8",
                                       wraplength=176, justify="left")
        self.info_name.pack(padx=12, pady=(8, 2), anchor="w")

        self.info_size = ctk.CTkLabel(right, text="Boyut: -",
                                       font=("Segoe UI", 11), text_color="#94a3b8")
        self.info_size.pack(padx=12, pady=2, anchor="w")

        self.info_dims = ctk.CTkLabel(right, text="Cozunurluk: -",
                                       font=("Segoe UI", 11), text_color="#94a3b8")
        self.info_dims.pack(padx=12, pady=2, anchor="w")

        self.info_index = ctk.CTkLabel(right, text="Sira: -",
                                        font=("Segoe UI", 11), text_color="#94a3b8")
        self.info_index.pack(padx=12, pady=2, anchor="w")

        spacer = ctk.CTkFrame(right, fg_color="transparent")
        spacer.pack(fill="both", expand=True)

        # Sil butonu
        self.del_btn = ctk.CTkButton(
            right, text="Secili Gorseli Sil", width=176, height=34,
            font=("Segoe UI", 12), fg_color="#ef4444", hover_color="#dc2626",
            command=self._remove_selected
        )
        self.del_btn.pack(padx=12, pady=(0, 8))

        # Sıralama butonları
        order_frame = ctk.CTkFrame(right, fg_color="transparent")
        order_frame.pack(padx=12, pady=(0, 12), fill="x")

        ctk.CTkButton(
            order_frame, text="◀ Sola", width=82, height=28,
            font=("Segoe UI", 11), fg_color="#374151", hover_color="#4b5563",
            command=self._move_left
        ).pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            order_frame, text="Saga ▶", width=82, height=28,
            font=("Segoe UI", 11), fg_color="#374151", hover_color="#4b5563",
            command=self._move_right
        ).pack(side="left")

    # ─── Dosya ekleme ─────────────────────────────────

    def _add_files(self):
        files = filedialog.askopenfilenames(
            title="Gorsel Sec",
            filetypes=[
                ("Resim Dosyalari", "*.jpg *.jpeg *.png *.webp"),
                ("Tum Dosyalar", "*.*"),
            ]
        )
        for f in files:
            if f not in self.image_paths:
                self.image_paths.append(f)
        self._refresh()

    def _add_folder(self):
        folder = filedialog.askdirectory(title="Gorsel Klasoru Sec")
        if not folder:
            return
        exts = {".jpg", ".jpeg", ".png", ".webp"}
        for p in sorted(Path(folder).iterdir()):
            if p.suffix.lower() in exts and str(p) not in self.image_paths:
                self.image_paths.append(str(p))
        self._refresh()

    # ─── Görsel işlemleri ─────────────────────────────

    def _get_all_items(self) -> list[str]:
        return self.image_urls + self.image_paths

    def _refresh(self):
        all_items = self._get_all_items()
        total = len(all_items)
        self.count_label.configure(text=f"{total} gorsel")

        if total == 0:
            self.drop_zone.place(relx=0.5, rely=0.5, anchor="center")
            self.main_label.place_forget()
            self.zoom_btn.place_forget()
            self.selected_index = 0
        else:
            self.drop_zone.place_forget()
            if self.selected_index >= total:
                self.selected_index = total - 1
            self._show_main_image(self.selected_index)

        self._refresh_thumbs()
        self._update_info()

    def _show_main_image(self, index: int):
        all_items = self._get_all_items()
        if not all_items or index >= len(all_items):
            return

        self.selected_index = index
        item = all_items[index]

        try:
            img = None
            if item.startswith("http"):
                img = _load_image_from_url(item)
            elif item.startswith("data:"):
                self.main_label.configure(image=None, text=f"Gorsel #{index+1}\n(Base64)")
                self.main_label.place(relx=0.5, rely=0.5, anchor="center")
            else:
                img = Image.open(item)

            if img:
                img.thumbnail((520, 340), Image.LANCZOS)
                self.main_photo = ImageTk.PhotoImage(img)
                self.main_label.configure(image=self.main_photo, text="")
                self.main_label.place(relx=0.5, rely=0.5, anchor="center")
            elif not item.startswith("data:"):
                self.main_label.configure(image=None, text="Gorsel yuklenemedi")
                self.main_label.place(relx=0.5, rely=0.5, anchor="center")
        except Exception:
            self.main_label.configure(image=None, text="Gorsel yuklenemedi")
            self.main_label.place(relx=0.5, rely=0.5, anchor="center")

        self.zoom_btn.place(relx=0.96, rely=0.04, anchor="ne")
        self._update_info()
        self._refresh_thumbs()

    def _refresh_thumbs(self):
        for w in self.thumb_frame.winfo_children():
            w.destroy()
        self.thumbnails.clear()

        all_items = self._get_all_items()
        for idx, item in enumerate(all_items):
            border_color = "#ef4444" if idx == self.selected_index else "#334155"
            card = ctk.CTkFrame(self.thumb_frame, width=64, height=64,
                                fg_color="#2d2d3f", corner_radius=6,
                                border_width=2, border_color=border_color)
            card.pack(side="left", padx=3)
            card.pack_propagate(False)

            try:
                img = None
                if item.startswith("http"):
                    img = _load_image_from_url(item)
                elif item.startswith("data:"):
                    lbl = ctk.CTkLabel(card, text=f"#{idx+1}",
                                       font=("Segoe UI", 10), text_color="#94a3b8")
                    lbl.place(relx=0.5, rely=0.5, anchor="center")
                    lbl.bind("<Button-1>", lambda e, i=idx: self._show_main_image(i))
                else:
                    img = Image.open(item)

                if img:
                    img.thumbnail((56, 56), Image.LANCZOS)
                    photo = ImageTk.PhotoImage(img)
                    self.thumbnails.append(photo)
                    lbl = ctk.CTkLabel(card, image=photo, text="")
                    lbl.place(relx=0.5, rely=0.5, anchor="center")
                    lbl.bind("<Button-1>", lambda e, i=idx: self._show_main_image(i))
                elif not item.startswith("data:"):
                    lbl = ctk.CTkLabel(card, text="!",
                                       font=("Segoe UI", 12), text_color="#ef4444")
                    lbl.place(relx=0.5, rely=0.5, anchor="center")
            except Exception:
                lbl = ctk.CTkLabel(card, text="!", font=("Segoe UI", 12),
                                   text_color="#ef4444")
                lbl.place(relx=0.5, rely=0.5, anchor="center")

            card.bind("<Button-1>", lambda e, i=idx: self._show_main_image(i))

    def _update_info(self):
        all_items = self._get_all_items()
        if not all_items or self.selected_index >= len(all_items):
            self.info_name.configure(text="Dosya: -")
            self.info_size.configure(text="Boyut: -")
            self.info_dims.configure(text="Cozunurluk: -")
            self.info_index.configure(text="Sira: -")
            return

        item = all_items[self.selected_index]
        self.info_index.configure(text=f"Sira: {self.selected_index + 1} / {len(all_items)}")

        if item.startswith("http"):
            # URL'den dosya adını çıkar
            url_name = item.rsplit("/", 1)[-1].split("?")[0] if "/" in item else "URL"
            self.info_name.configure(text=f"Dosya: {url_name}")
            img = _load_image_from_url(item)
            if img:
                w, h = img.size
                self.info_size.configure(text="Boyut: -")
                self.info_dims.configure(text=f"Cozunurluk: {w}x{h}")
            else:
                self.info_size.configure(text="Boyut: -")
                self.info_dims.configure(text="Cozunurluk: -")
        elif item.startswith("data:"):
            self.info_name.configure(text="Dosya: Base64")
            self.info_size.configure(text="Boyut: -")
            self.info_dims.configure(text="Cozunurluk: -")
        else:
            name = os.path.basename(item)
            self.info_name.configure(text=f"Dosya: {name}")
            try:
                size_mb = os.path.getsize(item) / (1024 * 1024)
                self.info_size.configure(text=f"Boyut: {size_mb:.1f} MB")
                img = Image.open(item)
                w, h = img.size
                self.info_dims.configure(text=f"Cozunurluk: {w}x{h}")
            except Exception:
                self.info_size.configure(text="Boyut: -")
                self.info_dims.configure(text="Cozunurluk: -")

    def _remove_selected(self):
        all_items = self._get_all_items()
        if not all_items:
            return
        idx = self.selected_index
        if idx < len(self.image_urls):
            self.image_urls.pop(idx)
        else:
            path_idx = idx - len(self.image_urls)
            if 0 <= path_idx < len(self.image_paths):
                self.image_paths.pop(path_idx)
        self._refresh()

    def _move_left(self):
        all_items = self._get_all_items()
        if self.selected_index <= 0 or not all_items:
            return
        self._swap(self.selected_index, self.selected_index - 1)
        self.selected_index -= 1
        self._refresh()

    def _move_right(self):
        all_items = self._get_all_items()
        if self.selected_index >= len(all_items) - 1 or not all_items:
            return
        self._swap(self.selected_index, self.selected_index + 1)
        self.selected_index += 1
        self._refresh()

    def _swap(self, i: int, j: int):
        """Birleşik listede iki öğeyi yer değiştir."""
        combined = self.image_urls + self.image_paths
        combined[i], combined[j] = combined[j], combined[i]
        url_count = len(self.image_urls)
        self.image_urls = [x for x in combined[:url_count] if x.startswith("http") or x.startswith("data:")]
        self.image_paths = [x for x in combined if not (x.startswith("http") or x.startswith("data:"))]
        # Daha basit: hepsini birleşik tutup yeniden ayır
        self.image_urls = []
        self.image_paths = []
        for item in combined:
            if item.startswith("http") or item.startswith("data:"):
                self.image_urls.append(item)
            else:
                self.image_paths.append(item)

    def _zoom_current(self):
        """Seçili görseli büyük pencerede göster."""
        all_items = self._get_all_items()
        if not all_items or self.selected_index >= len(all_items):
            return
        item = all_items[self.selected_index]
        if item.startswith("data:"):
            return

        try:
            if item.startswith("http"):
                img = _load_image_from_url(item)
            else:
                img = Image.open(item)

            if not img:
                return

            zoom_win = ctk.CTkToplevel(self)
            zoom_win.title("Gorsel Onizleme")
            zoom_win.geometry("900x700")
            zoom_win.configure(fg_color="#0f0f1a")

            img.thumbnail((860, 660), Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)

            lbl = ctk.CTkLabel(zoom_win, image=photo, text="")
            lbl.image = photo
            lbl.pack(expand=True)
        except Exception:
            pass

    # ─── Dış API ──────────────────────────────────────

    def get_local_paths(self) -> list[str]:
        return list(self.image_paths)

    def get_existing_urls(self) -> list[str]:
        return list(self.image_urls)

    def set_images(self, urls: list[str]):
        self.image_urls = list(urls) if urls else []
        self.image_paths.clear()
        self.selected_index = 0
        self._refresh()

    def clear(self):
        self.image_paths.clear()
        self.image_urls.clear()
        self.selected_index = 0
        self._refresh()
