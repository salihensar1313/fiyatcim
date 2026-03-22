"""Ürün listesi: tablo, arama, filtre, sıralama, inline edit, kopyalama."""

import customtkinter as ctk
import threading
from tkinter import ttk, messagebox

from app.theme import COLORS, FONTS, SPACING, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, DROPDOWN_COLORS, apply_dark_scrollbar, bind_treeview_scroll
from app.utils import format_price, safe_float, safe_int


class ProductList(ctk.CTkFrame):
    """Ürün listesi sayfası — tablo görünümü + hızlı filtre + inline edit."""

    def __init__(self, master, sb_manager, categories, brands,
                 on_edit=None, on_copy=None, on_selection_change=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.categories = categories
        self.brands = brands
        self.on_edit = on_edit
        self.on_copy = on_copy
        self.on_selection_change = on_selection_change
        self.products: list[dict] = []
        self.selected_ids: set[str] = set()
        self._inline_entry = None
        self._search_timer = None

        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık ──────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(header, text="Urunler", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(side="left")

        self.count_label = ctk.CTkLabel(
            header, text="0 urun", font=FONTS["small"],
            text_color=COLORS["text_muted"]
        )
        self.count_label.pack(side="left", padx=(12, 0))

        # Sağ butonlar
        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], command=self.refresh
        ).pack(side="right")

        ctk.CTkButton(
            header, text="Kopyala", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["info"],
            hover_color=COLORS["info_hover"], command=self._copy_selected
        ).pack(side="right", padx=(0, 6))

        # ─── Filtre satırı ───────────────────
        filter_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                     corner_radius=10, border_width=1,
                                     border_color=COLORS["border"])
        filter_frame.pack(fill="x", pady=(0, 8))
        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=12, pady=10)

        self.search_entry = ctk.CTkEntry(
            filter_inner, width=220, height=32,
            placeholder_text="Ara (isim veya SKU)...",
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            border_color=COLORS["border"]
        )
        self.search_entry.pack(side="left", padx=(0, 8))
        self.search_entry.bind("<KeyRelease>", self._on_search_key)

        # Kategori filtresi
        cat_names = ["Tumu"] + [c["name"] for c in self.categories]
        self.cat_filter_var = ctk.StringVar(value="Tumu")
        ctk.CTkOptionMenu(
            filter_inner, values=cat_names, variable=self.cat_filter_var,
            width=150, height=32, font=FONTS["body"],
            fg_color=COLORS["bg_input"], button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        ).pack(side="left", padx=(0, 8))

        # Marka filtresi
        brand_names = ["Tumu"] + [b["name"] for b in self.brands]
        self.brand_filter_var = ctk.StringVar(value="Tumu")
        ctk.CTkOptionMenu(
            filter_inner, values=brand_names, variable=self.brand_filter_var,
            width=140, height=32, font=FONTS["body"],
            fg_color=COLORS["bg_input"], button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        ).pack(side="left", padx=(0, 8))

        # Durum filtresi
        self.status_filter_var = ctk.StringVar(value="Tumu")
        ctk.CTkOptionMenu(
            filter_inner, values=["Tumu", "Aktif", "Pasif"],
            variable=self.status_filter_var, width=90, height=32,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        ).pack(side="left")

        # ─── Hızlı filtre toggle'ları ────────
        quick_frame = ctk.CTkFrame(self, fg_color="transparent")
        quick_frame.pack(fill="x", pady=(0, 8))

        self.quick_filter_var = ctk.StringVar(value="Tumu")
        quick_filters = [
            ("Tumu", COLORS["text_muted"]),
            ("Indirimli", COLORS["success"]),
            ("One Cikan", COLORS["warning"]),
            ("Trend", COLORS["cyan"]),
        ]
        self.quick_btns = {}
        for label, color in quick_filters:
            btn = ctk.CTkButton(
                quick_frame, text=label, width=90, height=28,
                font=FONTS["small_bold"], corner_radius=14,
                fg_color=COLORS["bg_card"] if label != "Tumu" else color,
                hover_color=color,
                text_color=COLORS["text_primary"],
                command=lambda l=label, c=color: self._set_quick_filter(l, c)
            )
            btn.pack(side="left", padx=(0, 6))
            self.quick_btns[label] = (btn, color)

        # ─── Treeview (tablo) ────────────────
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                   corner_radius=10, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.theme_use("default")
        style.configure("PList.Treeview", **TREEVIEW_STYLE)
        style.configure("PList.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("PList.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        columns = ("name", "sku", "category", "brand", "price", "stock", "status")
        self.tree = ttk.Treeview(
            tree_frame, columns=columns, show="headings",
            style="PList.Treeview", selectmode="extended"
        )

        self.tree.heading("name", text="Urun Adi", command=lambda: self._sort("name"))
        self.tree.heading("sku", text="SKU")
        self.tree.heading("category", text="Kategori")
        self.tree.heading("brand", text="Marka")
        self.tree.heading("price", text="Fiyat", command=lambda: self._sort("price"))
        self.tree.heading("stock", text="Stok", command=lambda: self._sort("stock"))
        self.tree.heading("status", text="Durum")

        self.tree.column("name", width=260, minwidth=180)
        self.tree.column("sku", width=100)
        self.tree.column("category", width=130)
        self.tree.column("brand", width=100)
        self.tree.column("price", width=120)
        self.tree.column("stock", width=70)
        self.tree.column("status", width=70)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)

        self.tree.bind("<Double-1>", self._on_double_click)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # Zebra striping tag'leri
        self.tree.tag_configure("odd", background=COLORS["bg_table"])
        self.tree.tag_configure("even", background=COLORS["bg_table_alt"])
        self.tree.tag_configure("critical", foreground=COLORS["danger"])
        self.tree.tag_configure("discount", foreground=COLORS["success"])

    def _on_search_key(self, event=None):
        if self._search_timer:
            self.after_cancel(self._search_timer)
        self._search_timer = self.after(300, self._filter)

    def _set_quick_filter(self, label: str, color: str):
        self.quick_filter_var.set(label)
        for lbl, (btn, c) in self.quick_btns.items():
            if lbl == label:
                btn.configure(fg_color=c)
            else:
                btn.configure(fg_color=COLORS["bg_card"])
        self._filter()

    def refresh(self):
        """DB'den ürünleri yeniden çeker (background thread)."""
        self._set_loading(True)

        def _worker():
            try:
                data = self.sb.get_products()
            except Exception:
                data = []
            self.after(0, lambda: self._on_refresh_done(data))

        threading.Thread(target=_worker, daemon=True).start()

    def _set_loading(self, loading):
        if loading:
            self.tree.delete(*self.tree.get_children())
            self.tree.insert("", "end", values=("Yukleniyor...", "", "", "", "", "", ""))
            self.count_label.configure(text="Yukleniyor...")

    def _on_refresh_done(self, data):
        self.products = data
        self._filter()

    def _filter(self):
        search = self.search_entry.get().strip().lower()
        cat = self.cat_filter_var.get()
        brand = self.brand_filter_var.get()
        status = self.status_filter_var.get()
        quick = self.quick_filter_var.get()

        filtered = []
        for p in self.products:
            if search and search not in p.get("name", "").lower() and search not in p.get("sku", "").lower():
                continue
            if cat != "Tumu":
                p_cat = (p.get("categories") or {}).get("name", "")
                if p_cat != cat:
                    continue
            if brand != "Tumu":
                p_brand = (p.get("brands") or {}).get("name", "")
                if p_brand != brand:
                    continue
            if status == "Aktif" and not p.get("is_active", True):
                continue
            if status == "Pasif" and p.get("is_active", True):
                continue
            # Hızlı filtreler
            if quick == "Indirimli":
                sp = p.get("sale_price")
                if not sp or sp <= 0 or sp >= p.get("price", 0):
                    continue
            elif quick == "One Cikan":
                if not p.get("is_featured"):
                    continue
            elif quick == "Trend":
                if not p.get("is_trending"):
                    continue
            filtered.append(p)

        self._populate_tree(filtered)

    def _populate_tree(self, products: list[dict]):
        self.tree.delete(*self.tree.get_children())
        for i, p in enumerate(products):
            cat_name = (p.get("categories") or {}).get("name", "-")
            brand_name = (p.get("brands") or {}).get("name", "-")
            price_str = format_price(p.get("price", 0))
            sale = p.get("sale_price")
            if sale and sale > 0 and sale < p.get("price", 0):
                pct = round((1 - sale / p["price"]) * 100)
                price_str = f"{format_price(sale)} (-%{pct})"
            stock = p.get("stock", 0)
            status = "Aktif" if p.get("is_active", True) else "Pasif"

            tags = ("odd",) if i % 2 == 0 else ("even",)
            if stock <= 0:
                tags = ("critical",)
            elif sale and sale > 0 and sale < p.get("price", 0):
                tags = ("discount",) if i % 2 == 0 else ("discount",)

            self.tree.insert("", "end", iid=p["id"], values=(
                p.get("name", ""), p.get("sku", ""),
                cat_name, brand_name, price_str, stock, status
            ), tags=tags)
        self.count_label.configure(text=f"{len(products)} urun")

    def _sort(self, column: str):
        reverse = getattr(self, f"_sort_{column}_rev", False)
        if column == "price":
            self.products.sort(key=lambda p: p.get("price", 0), reverse=reverse)
        elif column == "stock":
            self.products.sort(key=lambda p: p.get("stock", 0), reverse=reverse)
        else:
            self.products.sort(key=lambda p: p.get(column, "").lower(), reverse=reverse)
        setattr(self, f"_sort_{column}_rev", not reverse)
        self._filter()

    def _on_double_click(self, event):
        sel = self.tree.selection()
        if sel and self.on_edit:
            pid = sel[0]
            for p in self.products:
                if p["id"] == pid:
                    self.on_edit(p)
                    break

    def _on_select(self, event):
        self.selected_ids = set(self.tree.selection())
        if self.on_selection_change:
            self.on_selection_change(self.selected_ids)

    def _copy_selected(self):
        """Seçili ürünü kopyala — form'a "Kopya" olarak yükle."""
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Once bir urun secin")
            return
        pid = sel[0]
        for p in self.products:
            if p["id"] == pid:
                if self.on_copy:
                    self.on_copy(p)
                break

    def get_selected_ids(self) -> list[str]:
        return list(self.selected_ids)

    def get_product_count(self) -> int:
        return len(self.products)
