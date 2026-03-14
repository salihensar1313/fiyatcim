"""Toplu Islemler v2 — kendi urun listesi + modern islem paneli."""

import customtkinter as ctk
from tkinter import ttk, messagebox

from app.theme import COLORS, FONTS, SPACING, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, DROPDOWN_COLORS, apply_dark_scrollbar, bind_treeview_scroll
from app.utils import format_price, safe_float, safe_int


class BulkOps(ctk.CTkFrame):
    """Toplu islemler — sol: urun sec, sag: islem uygula."""

    def __init__(self, master, sb_manager, product_list_ref=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.product_list_ref = product_list_ref
        self.configure(fg_color="transparent")
        self.products: list[dict] = []
        self.selected_ids: set[str] = set()
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık ───────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            header, text="Toplu Islemler",
            font=FONTS["h2"], text_color=COLORS["text_primary"],
        ).pack(side="left")

        self.sel_badge = ctk.CTkLabel(
            header, text="0 secili", font=FONTS["small_bold"],
            text_color=COLORS["text_on_accent"],
            fg_color=COLORS["accent"], corner_radius=8,
        )
        self.sel_badge.pack(side="left", padx=(12, 0))

        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=8,
            command=self._load_products,
        ).pack(side="right")

        # ─── Ana İçerik: Sol (Ürünler) + Sağ (İşlemler) ───
        main = ctk.CTkFrame(self, fg_color="transparent")
        main.pack(fill="both", expand=True)
        main.columnconfigure(0, weight=3)
        main.columnconfigure(1, weight=2)

        # ═══ SOL: Ürün Listesi ═══════════════════
        left = ctk.CTkFrame(main, fg_color="transparent")
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        # Filtre satırı
        filter_frame = ctk.CTkFrame(left, fg_color=COLORS["bg_card"],
                                     corner_radius=8, border_width=1,
                                     border_color=COLORS["border"])
        filter_frame.pack(fill="x", pady=(0, 6))

        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=8, pady=6)

        self.search_var = ctk.StringVar()
        ctk.CTkEntry(
            filter_inner, width=180, height=28, font=FONTS["small"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Ara...", textvariable=self.search_var,
        ).pack(side="left", padx=(0, 6))
        self.search_var.trace_add("write", lambda *a: self._filter())

        # Kategori filtresi
        self.cat_var = ctk.StringVar(value="Tumu")
        self.cat_menu = ctk.CTkOptionMenu(
            filter_inner, values=["Tumu"], variable=self.cat_var,
            width=120, height=28, font=FONTS["small"],
            fg_color=COLORS["bg_input"], button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        )
        self.cat_menu.pack(side="left", padx=(0, 6))

        # Seç/Temizle
        ctk.CTkButton(
            filter_inner, text="Tumunu Sec", width=85, height=28,
            font=FONTS["small"], fg_color=COLORS["info"],
            hover_color=COLORS["info_hover"], corner_radius=6,
            command=self._select_all,
        ).pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            filter_inner, text="Temizle", width=65, height=28,
            font=FONTS["small"], fg_color=COLORS["text_muted"],
            hover_color=COLORS["bg_card_hover"], corner_radius=6,
            command=self._clear_selection,
        ).pack(side="left")

        # Ürün tablosu
        tree_frame = ctk.CTkFrame(left, fg_color=COLORS["bg_card"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.configure("Bulk.Treeview", **TREEVIEW_STYLE)
        style.configure("Bulk.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Bulk.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        cols = ("name", "sku", "price", "stock", "status")
        self.tree = ttk.Treeview(
            tree_frame, columns=cols, show="headings",
            style="Bulk.Treeview", selectmode="extended",
        )
        self.tree.heading("name", text="Urun Adi")
        self.tree.heading("sku", text="SKU")
        self.tree.heading("price", text="Fiyat")
        self.tree.heading("stock", text="Stok")
        self.tree.heading("status", text="Durum")

        self.tree.column("name", width=220)
        self.tree.column("sku", width=80)
        self.tree.column("price", width=100)
        self.tree.column("stock", width=60)
        self.tree.column("status", width=60)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # ═══ SAĞ: İşlem Paneli ═══════════════════
        right = ctk.CTkScrollableFrame(main, fg_color="transparent", width=300)
        right.grid(row=0, column=1, sticky="nsew")

        # ─── Fiyat İşlemi ────────────────────────
        self._section(right, "Fiyat Islemleri", COLORS["info"])

        price_card = ctk.CTkFrame(right, fg_color=COLORS["bg_card"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        price_card.pack(fill="x", pady=(0, 10))

        pc = ctk.CTkFrame(price_card, fg_color="transparent")
        pc.pack(fill="x", padx=12, pady=10)

        ctk.CTkLabel(pc, text="Islem:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.price_op_var = ctk.StringVar(value="Yuzde Artir")
        ctk.CTkOptionMenu(
            pc, values=["Yuzde Artir", "Yuzde Azalt", "Sabit Tutar Artir",
                         "Sabit Tutar Azalt"],
            variable=self.price_op_var, width=200, height=30,
            font=FONTS["small"], fg_color=COLORS["bg_input"],
            button_color=COLORS["info"], **DROPDOWN_COLORS,
        ).pack(anchor="w", pady=(2, 6))

        ctk.CTkLabel(pc, text="Deger:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.price_val = ctk.CTkEntry(
            pc, width=200, height=30, font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="orn: 10",
        )
        self.price_val.pack(anchor="w", pady=(2, 8))

        ctk.CTkButton(
            pc, text="Fiyat Guncelle", width=200, height=34,
            font=FONTS["body_bold"], fg_color=COLORS["info"],
            hover_color=COLORS["info_hover"], corner_radius=8,
            command=self._update_price,
        ).pack(anchor="w")

        # ─── Stok İşlemi ─────────────────────────
        self._section(right, "Stok Islemleri", COLORS["success"])

        stock_card = ctk.CTkFrame(right, fg_color=COLORS["bg_card"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        stock_card.pack(fill="x", pady=(0, 10))

        sc = ctk.CTkFrame(stock_card, fg_color="transparent")
        sc.pack(fill="x", padx=12, pady=10)

        ctk.CTkLabel(sc, text="Islem:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.stock_op_var = ctk.StringVar(value="Stok Ayarla")
        ctk.CTkOptionMenu(
            sc, values=["Stok Ayarla", "Stok Ekle", "Stok Cikar"],
            variable=self.stock_op_var, width=200, height=30,
            font=FONTS["small"], fg_color=COLORS["bg_input"],
            button_color=COLORS["success"], **DROPDOWN_COLORS,
        ).pack(anchor="w", pady=(2, 6))

        ctk.CTkLabel(sc, text="Miktar:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.stock_val = ctk.CTkEntry(
            sc, width=200, height=30, font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="orn: 50",
        )
        self.stock_val.pack(anchor="w", pady=(2, 8))

        ctk.CTkButton(
            sc, text="Stok Guncelle", width=200, height=34,
            font=FONTS["body_bold"], fg_color=COLORS["success"],
            hover_color=COLORS["success_hover"], corner_radius=8,
            command=self._update_stock,
        ).pack(anchor="w")

        # ─── Durum İşlemi ────────────────────────
        self._section(right, "Durum Degistir", COLORS["warning"])

        status_card = ctk.CTkFrame(right, fg_color=COLORS["bg_card"],
                                    corner_radius=8, border_width=1,
                                    border_color=COLORS["border"])
        status_card.pack(fill="x", pady=(0, 10))

        stc = ctk.CTkFrame(status_card, fg_color="transparent")
        stc.pack(fill="x", padx=12, pady=10)

        btn_row1 = ctk.CTkFrame(stc, fg_color="transparent")
        btn_row1.pack(fill="x", pady=(0, 6))

        ctk.CTkButton(
            btn_row1, text="Aktif Yap", width=95, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["success"],
            hover_color=COLORS["success_hover"], corner_radius=6,
            command=lambda: self._set_active(True),
        ).pack(side="left", padx=(0, 6))

        ctk.CTkButton(
            btn_row1, text="Pasif Yap", width=95, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["warning"],
            hover_color=COLORS["warning_hover"], corner_radius=6,
            command=lambda: self._set_active(False),
        ).pack(side="left")

        btn_row2 = ctk.CTkFrame(stc, fg_color="transparent")
        btn_row2.pack(fill="x", pady=(0, 6))

        ctk.CTkButton(
            btn_row2, text="One Cikan Ac", width=95, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=6,
            command=lambda: self._set_flag("is_featured", True),
        ).pack(side="left", padx=(0, 6))

        ctk.CTkButton(
            btn_row2, text="Trend Ac", width=95, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["purple"],
            hover_color=COLORS["accent_hover"], corner_radius=6,
            command=lambda: self._set_flag("is_trending", True),
        ).pack(side="left")

        btn_row3 = ctk.CTkFrame(stc, fg_color="transparent")
        btn_row3.pack(fill="x")

        ctk.CTkButton(
            btn_row3, text="Toplu Sil", width=200, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["danger"],
            hover_color=COLORS["danger_hover"], corner_radius=6,
            command=self._bulk_delete,
        ).pack(anchor="w")

    def _section(self, parent, title: str, color: str):
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        frame.pack(fill="x", pady=(4, 2))
        bar = ctk.CTkFrame(frame, width=4, height=16, fg_color=color, corner_radius=2)
        bar.pack(side="left", padx=(0, 8))
        ctk.CTkLabel(frame, text=title, font=FONTS["h4"],
                      text_color=COLORS["text_primary"]).pack(side="left")

    def _load_products(self):
        try:
            self.products = self.sb.get_products()
            # Kategori filtresini guncelle
            cats = sorted(set(
                (p.get("categories") or {}).get("name", "")
                for p in self.products if (p.get("categories") or {}).get("name")
            ))
            self.cat_menu.configure(values=["Tumu"] + cats)
            self._filter()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def refresh(self):
        self._load_products()

    def _filter(self):
        search = self.search_var.get().strip().lower()
        cat = self.cat_var.get()

        filtered = []
        for p in self.products:
            if search and search not in p.get("name", "").lower() and search not in p.get("sku", "").lower():
                continue
            if cat != "Tumu":
                p_cat = (p.get("categories") or {}).get("name", "")
                if p_cat != cat:
                    continue
            filtered.append(p)

        self._populate_tree(filtered)

    def _populate_tree(self, products: list[dict]):
        # Onceki secimi hatirla
        prev_sel = set(self.tree.selection())

        self.tree.delete(*self.tree.get_children())
        for p in products:
            status = "Aktif" if p.get("is_active", True) else "Pasif"
            self.tree.insert("", "end", iid=p["id"], values=(
                p.get("name", ""), p.get("sku", ""),
                format_price(p.get("price", 0)),
                p.get("stock", 0), status,
            ))

        # Onceki secimi geri yukle
        for pid in prev_sel:
            if self.tree.exists(pid):
                self.tree.selection_add(pid)

        self._update_badge()

    def _on_select(self, event):
        self.selected_ids = set(self.tree.selection())
        self._update_badge()

    def _update_badge(self):
        count = len(self.selected_ids)
        self.sel_badge.configure(text=f"  {count} secili  ")

    def _select_all(self):
        for item in self.tree.get_children():
            self.tree.selection_add(item)
        self.selected_ids = set(self.tree.get_children())
        self._update_badge()

    def _clear_selection(self):
        self.tree.selection_remove(*self.tree.get_children())
        self.selected_ids.clear()
        self._update_badge()

    def update_selection(self, ids: list[str]):
        """Dis kaynaktan secim guncelleme (geriye uyumluluk)."""
        self.selected_ids = set(ids)
        self._update_badge()

    def _check_selection(self) -> bool:
        if not self.selected_ids:
            messagebox.showwarning("Uyari", "Once urun secin!")
            return False
        return True

    def _update_price(self):
        if not self._check_selection():
            return

        val = safe_float(self.price_val.get())
        if val <= 0:
            messagebox.showerror("Hata", "Gecerli bir deger girin")
            return

        op = self.price_op_var.get()
        is_percent = "Yuzde" in op
        is_up = "Artir" in op

        symbol = "%" if is_percent else "₺"
        direction = "arttirilacak" if is_up else "azaltilacak"
        msg = f"{len(self.selected_ids)} urun fiyati {symbol}{val} {direction}.\n\nDevam?"

        if not messagebox.askyesno("Onay", msg):
            return

        try:
            count = 0
            for pid in self.selected_ids:
                product = self.sb.get_product(pid)
                if not product:
                    continue
                price = float(product.get("price", 0))
                price_usd = float(product.get("price_usd", 0))

                if is_percent:
                    delta = price * (val / 100)
                    delta_usd = price_usd * (val / 100)
                else:
                    delta = val
                    delta_usd = val

                new_price = price + delta if is_up else price - delta
                new_usd = price_usd + delta_usd if is_up else price_usd - delta_usd

                self.sb.update_product(pid, {
                    "price": max(0, round(new_price, 2)),
                    "price_usd": max(0, round(new_usd, 2)),
                })
                count += 1

            messagebox.showinfo("Basarili", f"{count} urun fiyati guncellendi")
            self._load_products()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _update_stock(self):
        if not self._check_selection():
            return

        val = safe_int(self.stock_val.get())
        op = self.stock_op_var.get()

        if op == "Stok Ayarla":
            msg = f"{len(self.selected_ids)} urun stoku {val} olarak ayarlanacak."
        elif op == "Stok Ekle":
            msg = f"{len(self.selected_ids)} urune {val} stok eklenecek."
        else:
            msg = f"{len(self.selected_ids)} urunden {val} stok cikarilacak."

        if not messagebox.askyesno("Onay", f"{msg}\n\nDevam?"):
            return

        try:
            if op == "Stok Ayarla":
                self.sb.bulk_update_products(list(self.selected_ids), {"stock": val})
            else:
                for pid in self.selected_ids:
                    product = self.sb.get_product(pid)
                    if not product:
                        continue
                    current = int(product.get("stock", 0))
                    new_stock = current + val if op == "Stok Ekle" else max(0, current - val)
                    self.sb.update_product(pid, {"stock": new_stock})

            messagebox.showinfo("Basarili", "Stok guncellendi")
            self._load_products()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _show_bulk_result(self, result: dict, action: str):
        """Toplu islem sonucunu gosterir."""
        msg = f"{result['success']} urun {action}"
        if result.get("errors"):
            msg += f"\n\n{len(result['errors'])} hata (ilk 3):\n"
            msg += "\n".join(result["errors"][:3])
            messagebox.showwarning("Sonuc", msg)
        else:
            messagebox.showinfo("Basarili", msg)

    def _set_active(self, active: bool):
        if not self._check_selection():
            return
        status = "aktif" if active else "pasif"
        if not messagebox.askyesno("Onay",
                                     f"{len(self.selected_ids)} urun {status} yapilacak. Devam?"):
            return
        try:
            result = self.sb.bulk_update_products(list(self.selected_ids), {"is_active": active})
            self._show_bulk_result(result, f"{status} yapildi")
            self._load_products()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _set_flag(self, flag: str, value: bool):
        if not self._check_selection():
            return
        label = "One Cikan" if flag == "is_featured" else "Trend"
        if not messagebox.askyesno("Onay",
                                     f"{len(self.selected_ids)} urun '{label}' olarak isaretlenecek. Devam?"):
            return
        try:
            result = self.sb.bulk_update_products(list(self.selected_ids), {flag: value})
            self._show_bulk_result(result, "guncellendi")
            self._load_products()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _bulk_delete(self):
        if not self._check_selection():
            return
        if not messagebox.askyesno("Dikkat!",
                                     f"{len(self.selected_ids)} urun silinecek. Bu islem geri alinamaz!\n\nDevam?"):
            return
        try:
            result = self.sb.bulk_delete_products(list(self.selected_ids))
            self._show_bulk_result(result, "silindi")
            self.selected_ids.clear()
            self._update_badge()
            self._load_products()
        except Exception as e:
            messagebox.showerror("Hata", str(e))
