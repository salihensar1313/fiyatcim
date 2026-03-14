"""Stok yönetimi: filtre, inline edit, kritik stok uyarı — premium tema."""

import customtkinter as ctk
from tkinter import ttk, messagebox

from app.theme import COLORS, FONTS, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, apply_dark_scrollbar, bind_treeview_scroll


class StockManager(ctk.CTkFrame):
    """Stok yönetimi sayfası."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.products: list[dict] = []
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="Stok Yonetimi", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 8))

        # Özet kartları
        self.summary_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.summary_frame.pack(fill="x", pady=(0, 12))

        self.total_label = self._stat_card(self.summary_frame, "Toplam", "0", COLORS["info"])
        self.out_label = self._stat_card(self.summary_frame, "Tukenen", "0", COLORS["danger"])
        self.critical_label = self._stat_card(self.summary_frame, "Kritik", "0", COLORS["warning"])
        self.normal_label = self._stat_card(self.summary_frame, "Normal", "0", COLORS["success"])

        # Filtre
        filter_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                     border_width=1, border_color=COLORS["border"])
        filter_frame.pack(fill="x", pady=(0, 8))
        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=12, pady=8)

        self.filter_var = ctk.StringVar(value="Tumu")
        for val in ["Tumu", "Tukenen", "Kritik", "Normal"]:
            ctk.CTkRadioButton(
                filter_inner, text=val, variable=self.filter_var, value=val,
                font=FONTS["body"], command=self._filter,
                fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"]
            ).pack(side="left", padx=(0, 16))

        self.search_entry = ctk.CTkEntry(
            filter_inner, width=200, height=32,
            placeholder_text="Ara...", font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"]
        )
        self.search_entry.pack(side="right")
        self.search_entry.bind("<KeyRelease>", lambda e: self._filter())

        # Tablo
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                   border_width=1, border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.configure("Stock.Treeview", **TREEVIEW_STYLE)
        style.configure("Stock.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Stock.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        columns = ("name", "sku", "stock", "critical", "status")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings",
                                 style="Stock.Treeview")
        self.tree.heading("name", text="Urun Adi")
        self.tree.heading("sku", text="SKU")
        self.tree.heading("stock", text="Stok")
        self.tree.heading("critical", text="Kritik Esik")
        self.tree.heading("status", text="Durum")
        self.tree.column("name", width=300)
        self.tree.column("sku", width=100)
        self.tree.column("stock", width=80)
        self.tree.column("critical", width=80)
        self.tree.column("status", width=100)

        self.tree.tag_configure("odd", background=COLORS["bg_table"])
        self.tree.tag_configure("even", background=COLORS["bg_table_alt"])

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)

        # Inline edit
        edit_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                                   border_width=1, border_color=COLORS["border"])
        edit_frame.pack(fill="x", pady=(8, 0))
        edit_inner = ctk.CTkFrame(edit_frame, fg_color="transparent")
        edit_inner.pack(fill="x", padx=12, pady=10)

        ctk.CTkLabel(edit_inner, text="Yeni Stok:", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))
        self.new_stock_entry = ctk.CTkEntry(edit_inner, width=80, height=32, font=FONTS["body"],
                                             fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.new_stock_entry.pack(side="left", padx=(0, 8))
        ctk.CTkButton(
            edit_inner, text="Guncelle", width=100, height=32,
            fg_color=COLORS["success"], hover_color=COLORS["success_hover"],
            font=FONTS["body"], command=self._update_stock
        ).pack(side="left", padx=(0, 16))

        ctk.CTkLabel(edit_inner, text="Kritik Esik:", font=FONTS["body"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))
        self.new_critical_entry = ctk.CTkEntry(edit_inner, width=80, height=32, font=FONTS["body"],
                                                fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        self.new_critical_entry.pack(side="left", padx=(0, 8))
        ctk.CTkButton(
            edit_inner, text="Esik Guncelle", width=110, height=32,
            fg_color=COLORS["warning"], hover_color=COLORS["warning_hover"],
            font=FONTS["body"], command=self._update_critical
        ).pack(side="left")

    def _stat_card(self, parent, title: str, value: str, color: str):
        card = ctk.CTkFrame(parent, width=130, height=70, fg_color=COLORS["bg_card"],
                             corner_radius=10, border_width=1, border_color=COLORS["border"])
        card.pack(side="left", padx=(0, 8))
        card.pack_propagate(False)
        # Accent bar
        bar = ctk.CTkFrame(card, width=4, fg_color=color, corner_radius=2)
        bar.pack(side="left", fill="y")
        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="both", expand=True, padx=8)
        ctk.CTkLabel(inner, text=title, font=FONTS["small"],
                     text_color=COLORS["text_muted"]).pack(anchor="w", pady=(8, 0))
        lbl = ctk.CTkLabel(inner, text=value, font=FONTS["h2"], text_color=color)
        lbl.pack(anchor="w")
        return lbl

    def refresh(self):
        try:
            self.products = self.sb.get_products()
            self._update_summary()
            self._filter()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _update_summary(self):
        total = len(self.products)
        out = sum(1 for p in self.products if p.get("stock", 0) <= 0)
        critical = sum(1 for p in self.products if 0 < p.get("stock", 0) <= p.get("critical_stock", 5))
        normal = total - out - critical
        self.total_label.configure(text=str(total))
        self.out_label.configure(text=str(out))
        self.critical_label.configure(text=str(critical))
        self.normal_label.configure(text=str(normal))

    def _filter(self):
        f = self.filter_var.get()
        search = self.search_entry.get().strip().lower()
        filtered = []
        for p in self.products:
            stock = p.get("stock", 0)
            critical = p.get("critical_stock", 5)
            if f == "Tukenen" and stock > 0:
                continue
            if f == "Kritik" and not (0 < stock <= critical):
                continue
            if f == "Normal" and stock <= critical:
                continue
            if search:
                if search not in p.get("name", "").lower() and search not in p.get("sku", "").lower():
                    continue
            filtered.append(p)
        self._populate(filtered)

    def _populate(self, products: list[dict]):
        self.tree.delete(*self.tree.get_children())
        for i, p in enumerate(products):
            stock = p.get("stock", 0)
            critical = p.get("critical_stock", 5)
            if stock <= 0:
                status = "TUKENDI"
            elif stock <= critical:
                status = "KRITIK"
            else:
                status = "Normal"
            tags = ("odd",) if i % 2 == 0 else ("even",)
            self.tree.insert("", "end", iid=p["id"], values=(
                p.get("name", ""), p.get("sku", ""), stock, critical, status
            ), tags=tags)

    def _update_stock(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Once bir urun secin")
            return
        try:
            new_stock = int(self.new_stock_entry.get())
        except ValueError:
            messagebox.showerror("Hata", "Gecerli bir sayi girin")
            return
        if new_stock < 0:
            messagebox.showerror("Hata", "Stok negatif olamaz")
            return
        names = [self.tree.item(pid, "values")[0] for pid in sel]
        msg = f"{len(sel)} urunun stogu {new_stock} olarak guncellenecek:\n"
        msg += "\n".join(f"  - {n}" for n in names[:5])
        if len(names) > 5:
            msg += f"\n  ... ve {len(names) - 5} urun daha"
        if not messagebox.askyesno("Stok Guncelleme Onay", msg):
            return
        try:
            for pid in sel:
                self.sb.update_product(pid, {"stock": new_stock})
            self.new_stock_entry.delete(0, "end")
            self.refresh()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _update_critical(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Once bir urun secin")
            return
        try:
            new_critical = int(self.new_critical_entry.get())
        except ValueError:
            messagebox.showerror("Hata", "Gecerli bir sayi girin")
            return
        if new_critical < 0:
            messagebox.showerror("Hata", "Kritik esik negatif olamaz")
            return
        if not messagebox.askyesno("Esik Guncelleme Onay",
                                    f"{len(sel)} urunun kritik esigi {new_critical} olarak guncellenecek. Devam?"):
            return
        try:
            for pid in sel:
                self.sb.update_product(pid, {"critical_stock": new_critical})
            self.new_critical_entry.delete(0, "end")
            self.refresh()
        except Exception as e:
            messagebox.showerror("Hata", str(e))
