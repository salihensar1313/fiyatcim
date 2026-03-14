"""Marka yönetimi: liste + ekleme/düzenleme/silme — premium tema."""

import customtkinter as ctk
from tkinter import ttk, messagebox

from app.theme import COLORS, FONTS, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, TEXTBOX_COLORS, bind_treeview_scroll
from app.utils import slugify


class BrandManager(ctk.CTkFrame):
    """Marka CRUD sayfası."""

    def __init__(self, master, sb_manager, on_change=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.on_change = on_change
        self.brands: list[dict] = []
        self.editing_id = None
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="Marka Yonetimi", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 16))

        # Form
        form = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                             border_width=1, border_color=COLORS["border"])
        form.pack(fill="x", pady=(0, 16))

        row1 = ctk.CTkFrame(form, fg_color="transparent")
        row1.pack(fill="x", padx=16, pady=(12, 4))

        ctk.CTkLabel(row1, text="Marka Adi *", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 8))
        self.name_entry = ctk.CTkEntry(row1, width=250, height=32, font=FONTS["body"],
                                        fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.name_entry.pack(side="left")

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
        ctk.CTkButton(
            row2, text="Toplu Ekle", width=100, height=32,
            fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            font=FONTS["body"], command=self._bulk_add
        ).pack(side="left", padx=(8, 0))
        self.status_label = ctk.CTkLabel(row2, text="", font=FONTS["body"])
        self.status_label.pack(side="left", padx=16)

        # Tablo
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                   border_width=1, border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.configure("Brand.Treeview", **TREEVIEW_STYLE)
        style.configure("Brand.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Brand.Treeview", **TREEVIEW_MAP)

        columns = ("name", "slug")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings",
                                 style="Brand.Treeview", height=10)
        self.tree.heading("name", text="Marka Adi")
        self.tree.heading("slug", text="Slug")
        self.tree.column("name", width=250)
        self.tree.column("slug", width=200)

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
        try:
            self.brands = self.sb.get_brands()
            self._populate()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _populate(self):
        self.tree.delete(*self.tree.get_children())
        for i, b in enumerate(self.brands):
            tags = ("odd",) if i % 2 == 0 else ("even",)
            self.tree.insert("", "end", iid=b["id"], values=(
                b.get("name", ""), b.get("slug", "")
            ), tags=tags)

    def _save(self):
        name = self.name_entry.get().strip()
        if not name:
            messagebox.showerror("Hata", "Marka adi zorunlu")
            return
        data = {"name": name, "slug": slugify(name)}
        try:
            if self.editing_id:
                self.sb.update_brand(self.editing_id, data)
                self.status_label.configure(text="Guncellendi", text_color=COLORS["success"])
            else:
                self.sb.create_brand(data)
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
        if not messagebox.askyesno("Onay", f"{len(sel)} marka silinecek. Emin misiniz?"):
            return
        try:
            for bid in sel:
                self.sb.delete_brand(bid)
            self.refresh()
            if self.on_change:
                self.on_change()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _on_double_click(self, event):
        sel = self.tree.selection()
        if not sel:
            return
        bid = sel[0]
        for b in self.brands:
            if b["id"] == bid:
                self.editing_id = bid
                self.name_entry.delete(0, "end")
                self.name_entry.insert(0, b.get("name", ""))
                self.status_label.configure(text="Duzenleniyor...", text_color=COLORS["warning"])
                break

    def _bulk_add(self):
        dialog = ctk.CTkToplevel(self)
        dialog.title("Toplu Marka Ekle")
        dialog.geometry("450x420")
        dialog.configure(fg_color=COLORS["bg_primary"])
        dialog.transient(self.winfo_toplevel())
        dialog.grab_set()
        dialog.attributes("-topmost", True)

        ctk.CTkLabel(dialog, text="Her satira bir marka adi yazin:",
                     font=FONTS["h4"], text_color=COLORS["text_primary"]).pack(padx=16, pady=(16, 8), anchor="w")

        text_box = ctk.CTkTextbox(dialog, width=410, height=250, font=FONTS["body"],
                                   fg_color=COLORS["bg_input"],
                                   text_color=COLORS["text_primary"])
        text_box.pack(padx=16, fill="both", expand=True)

        result_label = ctk.CTkLabel(dialog, text="", font=FONTS["body"],
                                     text_color=COLORS["text_primary"])
        result_label.pack(padx=16, pady=(4, 0))

        def do_bulk():
            raw = text_box.get("1.0", "end").strip()
            if not raw:
                result_label.configure(text="Liste bos", text_color=COLORS["danger"])
                return
            names = [n.strip() for n in raw.splitlines() if n.strip()]
            if not names:
                result_label.configure(text="Gecerli marka adi yok", text_color=COLORS["danger"])
                return
            existing = {b.get("name", "").lower() for b in self.brands}
            added = skipped = 0
            for name in names:
                if name.lower() in existing:
                    skipped += 1
                    continue
                try:
                    self.sb.create_brand({"name": name, "slug": slugify(name)})
                    existing.add(name.lower())
                    added += 1
                except Exception:
                    skipped += 1
            self.refresh()
            if self.on_change:
                self.on_change()
            result_label.configure(
                text=f"{added} eklendi" + (f", {skipped} atland" if skipped else ""),
                text_color=COLORS["success"])
            if added > 0:
                dialog.after(1500, dialog.destroy)

        btn_frame = ctk.CTkFrame(dialog, fg_color="transparent")
        btn_frame.pack(fill="x", padx=16, pady=(8, 16))
        ctk.CTkButton(
            btn_frame, text="Ekle", width=120, height=36,
            fg_color=COLORS["success"], hover_color=COLORS["success_hover"],
            font=FONTS["h4"], command=do_bulk
        ).pack(side="left")
        ctk.CTkButton(
            btn_frame, text="Iptal", width=80, height=36,
            fg_color=COLORS["bg_input"], hover_color=COLORS["border_light"],
            font=FONTS["body"], command=dialog.destroy
        ).pack(side="left", padx=(8, 0))

    def _clear(self):
        self.editing_id = None
        self.name_entry.delete(0, "end")
        self.status_label.configure(text="")

    def get_brands(self) -> list[dict]:
        return list(self.brands)
