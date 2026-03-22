"""Kategori yönetimi: liste + ekleme/düzenleme/silme + gorsel yukleme — premium tema."""

import os
import customtkinter as ctk
import threading
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk

from app.theme import COLORS, FONTS, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, DROPDOWN_COLORS, bind_treeview_scroll
from app.utils import slugify


class CategoryManager(ctk.CTkFrame):
    """Kategori CRUD sayfası."""

    def __init__(self, master, sb_manager, on_change=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.on_change = on_change
        self.categories: list[dict] = []
        self.editing_id = None
        self._selected_image_path = None
        self._current_image_url = None
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="Kategori Yonetimi", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 16))

        # Form
        form = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                             border_width=1, border_color=COLORS["border"])
        form.pack(fill="x", pady=(0, 16))

        row1 = ctk.CTkFrame(form, fg_color="transparent")
        row1.pack(fill="x", padx=16, pady=(12, 4))

        ctk.CTkLabel(row1, text="Kategori Adi *", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 8))
        self.name_entry = ctk.CTkEntry(row1, width=250, height=32, font=FONTS["body"],
                                        fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.name_entry.pack(side="left", padx=(0, 16))

        ctk.CTkLabel(row1, text="Sira No", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 8))
        self.sort_entry = ctk.CTkEntry(row1, width=60, height=32, font=FONTS["body"],
                                        fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.sort_entry.insert(0, "0")
        self.sort_entry.pack(side="left", padx=(0, 16))

        ctk.CTkLabel(row1, text="Ikon", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 8))
        self.icon_options = [
            "Package", "Shield", "Camera", "Home", "Fingerprint",
            "Bell", "Lock", "Wifi", "Eye", "Monitor",
            "Radio", "Flame", "Zap", "Speaker", "Server",
        ]
        self.icon_combo = ctk.CTkComboBox(
            row1, values=self.icon_options, width=140, height=32,
            font=FONTS["body"], state="readonly",
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            button_color=COLORS["accent"],
            dropdown_fg_color=COLORS["bg_card"],
            dropdown_text_color=COLORS["text_primary"],
            dropdown_hover_color=COLORS["accent"],
            text_color=COLORS["text_primary"])
        self.icon_combo.set("Package")
        self.icon_combo.pack(side="left")

        # Görsel satırı
        img_row = ctk.CTkFrame(form, fg_color="transparent")
        img_row.pack(fill="x", padx=16, pady=(4, 4))

        ctk.CTkLabel(img_row, text="Gorsel", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 8))
        ctk.CTkButton(
            img_row, text="Dosya Sec", width=100, height=28,
            fg_color=COLORS["purple"], hover_color="#7c3aed",
            font=FONTS["small"], command=self._pick_image
        ).pack(side="left", padx=(0, 8))

        self.img_status_label = ctk.CTkLabel(
            img_row, text="Gorsel yok", font=FONTS["small"],
            text_color=COLORS["text_muted"])
        self.img_status_label.pack(side="left", padx=(0, 8))
        self.img_preview_label = ctk.CTkLabel(img_row, text="", width=48, height=48)
        self.img_preview_label.pack(side="left")

        row2 = ctk.CTkFrame(form, fg_color="transparent")
        row2.pack(fill="x", padx=16, pady=(4, 12))

        ctk.CTkButton(
            row2, text="Kaydet", width=100, height=32,
            fg_color=COLORS["success"], hover_color=COLORS["success_hover"],
            font=FONTS["body"], command=self._save
        ).pack(side="left", padx=(0, 8))
        ctk.CTkButton(
            row2, text="Temizle", width=80, height=32,
            fg_color=COLORS["bg_input"], hover_color=COLORS["border_light"],
            font=FONTS["body"], command=self._clear
        ).pack(side="left")
        self.status_label = ctk.CTkLabel(row2, text="", font=FONTS["body"])
        self.status_label.pack(side="left", padx=16)

        # Tablo
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                   border_width=1, border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.configure("Cat.Treeview", **TREEVIEW_STYLE)
        style.configure("Cat.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Cat.Treeview", **TREEVIEW_MAP)

        columns = ("name", "slug", "icon", "sort_order", "image")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings",
                                 style="Cat.Treeview", height=10)
        self.tree.heading("name", text="Ad")
        self.tree.heading("slug", text="Slug")
        self.tree.heading("icon", text="Ikon")
        self.tree.heading("sort_order", text="Sira")
        self.tree.heading("image", text="Gorsel")
        self.tree.column("name", width=200)
        self.tree.column("slug", width=160)
        self.tree.column("icon", width=90)
        self.tree.column("sort_order", width=50)
        self.tree.column("image", width=60)

        self.tree.tag_configure("odd", background=COLORS["bg_table"])
        self.tree.tag_configure("even", background=COLORS["bg_table_alt"])

        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)
        self.tree.bind("<Double-1>", self._on_double_click)

        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(8, 0))
        ctk.CTkButton(
            btn_frame, text="Secili Sil", width=100, height=32,
            fg_color=COLORS["danger"], hover_color=COLORS["danger_hover"],
            font=FONTS["body"], command=self._delete
        ).pack(side="left")

    def refresh(self):
        self._set_loading(True)

        def _worker():
            try:
                data = self.sb.get_categories()
            except Exception:
                data = []
            self.after(0, lambda: self._on_refresh_done(data))

        threading.Thread(target=_worker, daemon=True).start()

    def _set_loading(self, loading):
        if loading:
            self.tree.delete(*self.tree.get_children())
            self.tree.insert("", "end", values=("Yukleniyor...", "", "", "", ""))

    def _on_refresh_done(self, data):
        self.categories = data
        self._populate()

    def _populate(self):
        self.tree.delete(*self.tree.get_children())
        for i, c in enumerate(self.categories):
            has_img = "Var" if c.get("image_url") else "-"
            tags = ("odd",) if i % 2 == 0 else ("even",)
            self.tree.insert("", "end", iid=c["id"], values=(
                c.get("name", ""), c.get("slug", ""), c.get("icon", "Package"),
                c.get("sort_order", 0), has_img
            ), tags=tags)

    def _save(self):
        name = self.name_entry.get().strip()
        if not name:
            messagebox.showerror("Hata", "Kategori adi zorunlu")
            return
        slug = slugify(name)
        data = {"name": name, "slug": slug,
                "sort_order": int(self.sort_entry.get() or 0),
                "icon": self.icon_combo.get()}
        if self._selected_image_path:
            self.status_label.configure(text="Gorsel yukleniyor...", text_color=COLORS["info"])
            self.update_idletasks()
            try:
                storage_path = f"categories/{slug}.jpg"
                url = self.sb.upload_image(self._selected_image_path, storage_path)
                data["image_url"] = url
            except Exception:
                try:
                    b64 = self.sb.upload_image_base64(self._selected_image_path)
                    data["image_url"] = b64
                except Exception as e:
                    messagebox.showerror("Gorsel Hatasi", f"Gorsel yuklenemedi: {e}")
                    return
        try:
            if self.editing_id:
                self.sb.update_category(self.editing_id, data)
                self.status_label.configure(text="Guncellendi", text_color=COLORS["success"])
            else:
                self.sb.create_category(data)
                self.status_label.configure(text="Eklendi", text_color=COLORS["success"])
            self._clear()
            self.refresh()
            if self.on_change:
                self.on_change()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _delete(self):
        sel = self.tree.selection()
        if not sel:
            return
        if not messagebox.askyesno("Onay", f"{len(sel)} kategori silinecek. Emin misiniz?"):
            return
        try:
            for cid in sel:
                self.sb.delete_category(cid)
            self.refresh()
            if self.on_change:
                self.on_change()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _on_double_click(self, event):
        sel = self.tree.selection()
        if not sel:
            return
        cid = sel[0]
        for c in self.categories:
            if c["id"] == cid:
                self.editing_id = cid
                self.name_entry.delete(0, "end")
                self.name_entry.insert(0, c.get("name", ""))
                self.sort_entry.delete(0, "end")
                self.sort_entry.insert(0, str(c.get("sort_order", 0)))
                self.icon_combo.set(c.get("icon", "Package"))
                self._selected_image_path = None
                self._current_image_url = c.get("image_url", "")
                if self._current_image_url:
                    self.img_status_label.configure(text="Mevcut gorsel var", text_color=COLORS["success"])
                else:
                    self.img_status_label.configure(text="Gorsel yok", text_color=COLORS["text_muted"])
                self.img_preview_label.configure(image=None, text="")
                self.status_label.configure(text="Duzenleniyor...", text_color=COLORS["warning"])
                break

    def _clear(self):
        self.editing_id = None
        self._selected_image_path = None
        self._current_image_url = None
        self.name_entry.delete(0, "end")
        self.sort_entry.delete(0, "end")
        self.sort_entry.insert(0, "0")
        self.icon_combo.set("Package")
        self.img_status_label.configure(text="Gorsel yok", text_color=COLORS["text_muted"])
        self.img_preview_label.configure(image=None, text="")
        self.status_label.configure(text="")

    def _pick_image(self):
        path = filedialog.askopenfilename(
            title="Kategori Gorseli Sec",
            filetypes=[("Resim Dosyalari", "*.png *.jpg *.jpeg *.webp"), ("Tum Dosyalar", "*.*")])
        if not path:
            return
        self._selected_image_path = path
        filename = os.path.basename(path)
        self.img_status_label.configure(text=filename, text_color=COLORS["success"])
        try:
            img = Image.open(path)
            img.thumbnail((48, 48))
            photo = ImageTk.PhotoImage(img)
            self.img_preview_label.configure(image=photo, text="")
            self.img_preview_label._photo = photo
        except Exception:
            self.img_preview_label.configure(image=None, text="?")

    def get_categories(self) -> list[dict]:
        return list(self.categories)
