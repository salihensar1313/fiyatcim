"""İndirimli ürün yönetimi: fiyat ve indirim ayarlama sayfası."""

import customtkinter as ctk
from tkinter import ttk, messagebox

from app.theme import COLORS, FONTS, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP, DROPDOWN_COLORS, apply_dark_scrollbar, bind_treeview_scroll
from app.utils import format_price, safe_float


class DiscountManager(ctk.CTkFrame):
    """İndirimli ürün yönetimi — fiyat, indirimli fiyat, yüzde ayarlama."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.products: list[dict] = []
        self._inline_entry = None
        self._inline_col = None
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık ──────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(header, text="Indirim Yonetimi", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(side="left")

        self.count_label = ctk.CTkLabel(
            header, text="", font=FONTS["small"],
            text_color=COLORS["text_muted"]
        )
        self.count_label.pack(side="left", padx=(12, 0))

        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], command=self.refresh
        ).pack(side="right")

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
        self.search_entry.bind("<KeyRelease>", lambda e: self._filter())

        # Filtre: Tümü / İndirimli / İndirimsiz
        self.disc_filter_var = ctk.StringVar(value="Tumu")
        ctk.CTkOptionMenu(
            filter_inner, values=["Tumu", "Indirimli", "Indirimsiz"],
            variable=self.disc_filter_var, width=120, height=32,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        ).pack(side="left", padx=(0, 8))

        # Toplu indirim uygula
        ctk.CTkLabel(filter_inner, text="Toplu:", font=FONTS["small_bold"],
                     text_color=COLORS["text_secondary"]).pack(side="left", padx=(16, 4))

        self.bulk_pct_entry = ctk.CTkEntry(
            filter_inner, width=60, height=32, font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="%"
        )
        self.bulk_pct_entry.pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            filter_inner, text="Indirim Uygula", width=110, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["success"],
            hover_color=COLORS["success_hover"],
            command=self._bulk_apply_discount
        ).pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            filter_inner, text="Indirimi Kaldir", width=110, height=32,
            font=FONTS["small_bold"], fg_color=COLORS["danger"],
            hover_color=COLORS["danger_hover"],
            command=self._bulk_remove_discount
        ).pack(side="left")

        # ─── Bilgi satırı ───────────────────
        info_frame = ctk.CTkFrame(self, fg_color="transparent")
        info_frame.pack(fill="x", pady=(0, 4))

        ctk.CTkLabel(
            info_frame,
            text="Fiyat veya Ind. Fiyat hucresine cift tiklayarak duzenleyebilirsiniz.",
            font=FONTS["small"], text_color=COLORS["text_muted"]
        ).pack(side="left")

        # ─── Treeview (tablo) ────────────────
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                   corner_radius=10, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True)

        style = ttk.Style()
        style.configure("Disc.Treeview", **TREEVIEW_STYLE)
        style.configure("Disc.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Disc.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        columns = ("name", "sku", "price", "sale_price", "discount_pct", "status")
        self.tree = ttk.Treeview(
            tree_frame, columns=columns, show="headings",
            style="Disc.Treeview", selectmode="extended"
        )

        self.tree.heading("name", text="Urun Adi", command=lambda: self._sort("name"))
        self.tree.heading("sku", text="SKU")
        self.tree.heading("price", text="Fiyat (TRY)", command=lambda: self._sort("price"))
        self.tree.heading("sale_price", text="Ind. Fiyat (TRY)", command=lambda: self._sort("sale_price"))
        self.tree.heading("discount_pct", text="Indirim %", command=lambda: self._sort("discount_pct"))
        self.tree.heading("status", text="Durum")

        self.tree.column("name", width=260, minwidth=180)
        self.tree.column("sku", width=100)
        self.tree.column("price", width=110)
        self.tree.column("sale_price", width=120)
        self.tree.column("discount_pct", width=90)
        self.tree.column("status", width=80)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)

        self.tree.tag_configure("odd", background=COLORS["bg_table"])
        self.tree.tag_configure("even", background=COLORS["bg_table_alt"])
        self.tree.tag_configure("discounted", foreground=COLORS["success"])
        self.tree.tag_configure("no_discount", foreground=COLORS["text_muted"])

        self.tree.bind("<Double-1>", self._on_double_click)

    # ─── Veri ────────────────────────────────────

    def refresh(self):
        try:
            self.products = self.sb.get_products()
            self._filter()
        except Exception as e:
            messagebox.showerror("Hata", f"Urunler yuklenemedi: {e}")

    def _filter(self):
        search = self.search_entry.get().strip().lower()
        disc_filter = self.disc_filter_var.get()

        filtered = []
        for p in self.products:
            if search and search not in p.get("name", "").lower() and search not in p.get("sku", "").lower():
                continue
            price = float(p.get("price", 0))
            sale = float(p.get("sale_price", 0) or 0)
            has_discount = sale > 0 and sale < price

            if disc_filter == "Indirimli" and not has_discount:
                continue
            if disc_filter == "Indirimsiz" and has_discount:
                continue

            filtered.append(p)

        self._populate(filtered)

    def _populate(self, products: list[dict]):
        self.tree.delete(*self.tree.get_children())
        disc_count = 0
        for i, p in enumerate(products):
            price = float(p.get("price", 0))
            sale = float(p.get("sale_price", 0) or 0)
            has_discount = sale > 0 and sale < price

            if has_discount:
                pct = round((1 - sale / price) * 100)
                pct_str = f"%{pct}"
                disc_count += 1
                tags = ("discounted",)
            else:
                pct_str = "-"
                sale_str = "-"
                tags = ("odd",) if i % 2 == 0 else ("even",)

            sale_str = format_price(sale) if has_discount else "-"
            status = "Aktif" if p.get("is_active", True) else "Pasif"

            self.tree.insert("", "end", iid=p["id"], values=(
                p.get("name", ""), p.get("sku", ""),
                format_price(price), sale_str, pct_str, status
            ), tags=tags)

        total = len(products)
        self.count_label.configure(text=f"{total} urun  |  {disc_count} indirimli")

    def _sort(self, column: str):
        reverse = getattr(self, f"_sort_{column}_rev", False)
        if column == "price":
            self.products.sort(key=lambda p: float(p.get("price", 0)), reverse=reverse)
        elif column == "sale_price":
            self.products.sort(key=lambda p: float(p.get("sale_price", 0) or 0), reverse=reverse)
        elif column == "discount_pct":
            def disc_pct(p):
                pr = float(p.get("price", 0))
                sp = float(p.get("sale_price", 0) or 0)
                if sp > 0 and sp < pr:
                    return round((1 - sp / pr) * 100)
                return 0
            self.products.sort(key=disc_pct, reverse=reverse)
        else:
            self.products.sort(key=lambda p: p.get(column, "").lower(), reverse=reverse)
        setattr(self, f"_sort_{column}_rev", not reverse)
        self._filter()

    # ─── Inline düzenleme ────────────────────────

    def _on_double_click(self, event):
        """Fiyat veya İnd. Fiyat sütununa çift tıkla → inline edit."""
        if self._inline_entry:
            self._cancel_inline()

        region = self.tree.identify("region", event.x, event.y)
        if region != "cell":
            return
        col = self.tree.identify_column(event.x)
        row = self.tree.identify_row(event.y)
        if not row:
            return

        # Sadece price (#3) ve sale_price (#4) sütunları düzenlenebilir
        col_idx = int(col.replace("#", "")) - 1
        if col_idx not in (2, 3):  # price=2, sale_price=3
            return

        # Hücre koordinatları
        bbox = self.tree.bbox(row, col)
        if not bbox:
            return

        x, y, w, h = bbox
        current_val = self.tree.set(row, self.tree["columns"][col_idx])

        self._inline_col = col_idx
        self._inline_row = row

        self._inline_entry = ctk.CTkEntry(
            self.tree, width=w, height=h,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            border_color=COLORS["accent"], text_color=COLORS["text_primary"]
        )
        # Temiz değeri göster (₺ ve formatlamayı kaldır)
        clean_val = current_val.replace("₺", "").replace(".", "").replace(",", ".").strip()
        if clean_val == "-":
            clean_val = ""
        self._inline_entry.insert(0, clean_val)
        self._inline_entry.place(x=x, y=y)
        self._inline_entry.focus_set()
        self._inline_entry.select_range(0, "end")

        self._inline_entry.bind("<Return>", self._commit_inline)
        self._inline_entry.bind("<Escape>", lambda e: self._cancel_inline())
        self._inline_entry.bind("<FocusOut>", self._commit_inline)

    def _commit_inline(self, event=None):
        if not self._inline_entry:
            return

        val = self._inline_entry.get().strip()
        row = self._inline_row
        col_idx = self._inline_col

        self._cancel_inline()

        new_val = safe_float(val)
        if new_val is None or new_val < 0:
            return

        # Ürünü bul
        product = None
        for p in self.products:
            if p["id"] == row:
                product = p
                break
        if not product:
            return

        try:
            if col_idx == 2:  # price
                if new_val <= 0:
                    messagebox.showerror("Hata", "Fiyat 0'dan buyuk olmali")
                    return
                if not messagebox.askyesno("Fiyat Guncelle",
                        f"'{product.get('name', '')}' fiyati {new_val:.2f} TRY olarak guncellenecek. Onayliyor musunuz?"):
                    return
                self.sb.update_product(row, {"price": new_val})
                product["price"] = new_val
            elif col_idx == 3:  # sale_price
                if new_val == 0:
                    self.sb.update_product(row, {"sale_price": None})
                    product["sale_price"] = None
                else:
                    price = product.get("price", 0)
                    if new_val >= price:
                        messagebox.showerror("Hata", f"Indirimli fiyat ({new_val:.2f}) normal fiyattan ({price:.2f}) dusuk olmali")
                        return
                    self.sb.update_product(row, {"sale_price": new_val})
                    product["sale_price"] = new_val

            self._filter()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _cancel_inline(self):
        if self._inline_entry:
            self._inline_entry.destroy()
            self._inline_entry = None

    # ─── Toplu indirim ───────────────────────────

    def _bulk_apply_discount(self):
        """Seçili ürünlere yüzde indirim uygula."""
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Once urun secin (Ctrl+Click ile coklu secim)")
            return

        pct_str = self.bulk_pct_entry.get().strip().replace("%", "")
        pct = safe_float(pct_str)
        if pct is None or pct <= 0 or pct >= 100:
            messagebox.showerror("Hata", "Gecerli bir yuzde girin (1-99)")
            return

        if not messagebox.askyesno(
            "Onay",
            f"{len(sel)} urune %{int(pct)} indirim uygulanacak.\nDevam?"
        ):
            return

        updated = 0
        for pid in sel:
            for p in self.products:
                if p["id"] == pid:
                    price = float(p.get("price", 0))
                    if price <= 0:
                        continue
                    new_sale = round(price * (1 - pct / 100), 2)
                    try:
                        self.sb.update_product(pid, {"sale_price": new_sale})
                        p["sale_price"] = new_sale
                        updated += 1
                    except Exception:
                        pass
                    break

        self._filter()
        messagebox.showinfo("Basarili", f"{updated} urun guncellendi")

    def _bulk_remove_discount(self):
        """Seçili ürünlerden indirimi kaldır."""
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Once urun secin")
            return

        if not messagebox.askyesno("Onay", f"{len(sel)} urunun indirimi kaldirilacak.\nDevam?"):
            return

        updated = 0
        for pid in sel:
            for p in self.products:
                if p["id"] == pid:
                    try:
                        self.sb.update_product(pid, {"sale_price": None})
                        p["sale_price"] = None
                        updated += 1
                    except Exception:
                        pass
                    break

        self._filter()
        messagebox.showinfo("Basarili", f"{updated} urunun indirimi kaldirildi")
