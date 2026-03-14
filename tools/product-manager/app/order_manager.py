"""Siparis Takibi — siparis listesi, detay, durum guncelleme."""

import customtkinter as ctk
from tkinter import ttk, messagebox

from app.theme import (COLORS, FONTS, SPACING, TREEVIEW_STYLE,
                        TREEVIEW_HEADING_STYLE, TREEVIEW_MAP,
                        ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
                        PAYMENT_STATUS_LABELS, ORDER_TRANSITIONS,
                        DROPDOWN_COLORS, apply_dark_scrollbar, bind_treeview_scroll)
from app.utils import format_price, format_date


class OrderManager(ctk.CTkFrame):
    """Siparis yonetim sayfasi."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.configure(fg_color="transparent")
        self.orders: list[dict] = []
        self.selected_order: dict | None = None
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık + Filtre ──────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            header, text="Siparis Takibi",
            font=FONTS["h2"], text_color=COLORS["text_primary"],
        ).pack(side="left")

        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=8,
            command=self.refresh,
        ).pack(side="right")

        # Filtre satırı
        filter_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                     corner_radius=8, border_width=1,
                                     border_color=COLORS["border"])
        filter_frame.pack(fill="x", pady=(0, 8))

        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=12, pady=8)

        # Durum filtresi
        ctk.CTkLabel(filter_inner, text="Durum:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))

        status_options = ["Tumu"] + list(ORDER_STATUS_LABELS.values())
        self.status_var = ctk.StringVar(value="Tumu")
        ctk.CTkOptionMenu(
            filter_inner, values=status_options, variable=self.status_var,
            width=160, height=30, font=FONTS["small"],
            fg_color=COLORS["bg_input"], button_color=COLORS["accent"],
            command=lambda v: self._filter(),
            **DROPDOWN_COLORS,
        ).pack(side="left", padx=(0, 12))

        # Arama
        ctk.CTkLabel(filter_inner, text="Ara:", font=FONTS["small"],
                      text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))
        self.search_entry = ctk.CTkEntry(
            filter_inner, width=200, height=30, font=FONTS["small"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Siparis no veya email...",
        )
        self.search_entry.pack(side="left")
        self.search_entry.bind("<KeyRelease>", lambda e: self._filter())

        # Siparis sayisi
        self.count_label = ctk.CTkLabel(
            filter_inner, text="0 siparis", font=FONTS["small"],
            text_color=COLORS["text_muted"],
        )
        self.count_label.pack(side="right")

        # ─── Üst-Alt Panel (PanedWindow benzeri) ──
        # Üst: Sipariş tablosu
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True, pady=(0, 8))

        style = ttk.Style()
        style.configure("Order.Treeview", **TREEVIEW_STYLE)
        style.configure("Order.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Order.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        cols = ("order_no", "date", "customer", "total", "status", "payment")
        self.tree = ttk.Treeview(
            tree_frame, columns=cols, show="headings",
            style="Order.Treeview", selectmode="browse",
        )

        self.tree.heading("order_no", text="Siparis No")
        self.tree.heading("date", text="Tarih")
        self.tree.heading("customer", text="Musteri")
        self.tree.heading("total", text="Toplam")
        self.tree.heading("status", text="Durum")
        self.tree.heading("payment", text="Odeme")

        self.tree.column("order_no", width=140)
        self.tree.column("date", width=130)
        self.tree.column("customer", width=220)
        self.tree.column("total", width=110)
        self.tree.column("status", width=140)
        self.tree.column("payment", width=100)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # ─── Alt: Detay Paneli ────────────────────
        self.detail_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                          corner_radius=10, border_width=1,
                                          border_color=COLORS["border"],
                                          height=360)
        self.detail_frame.pack(fill="x")
        self.detail_frame.pack_propagate(False)

        self.detail_inner = ctk.CTkScrollableFrame(self.detail_frame,
                                                     fg_color="transparent")
        self.detail_inner.pack(fill="both", expand=True, padx=4, pady=4)

        self.detail_placeholder = ctk.CTkLabel(
            self.detail_inner,
            text="Detay gormek icin yukardaki tablodan bir siparis secin.",
            font=FONTS["body"], text_color=COLORS["text_muted"],
        )
        self.detail_placeholder.pack(pady=40)

    def refresh(self):
        """Siparisleri yeniden yukle."""
        try:
            self.orders = self.sb.get_orders(limit=100)
            self._filter()
        except Exception as e:
            messagebox.showerror("Hata", f"Siparisler yuklenemedi: {e}")

    def _filter(self):
        status_label = self.status_var.get()
        search = self.search_entry.get().strip().lower()

        # Label'dan key'e cevir
        status_key = None
        if status_label != "Tumu":
            for key, label in ORDER_STATUS_LABELS.items():
                if label == status_label:
                    status_key = key
                    break

        filtered = []
        for o in self.orders:
            if status_key and o.get("status") != status_key:
                continue
            if search:
                if (search not in (o.get("order_no") or "").lower() and
                        search not in (o.get("customer_email") or "").lower()):
                    continue
            filtered.append(o)

        self._populate_tree(filtered)

    @staticmethod
    def _get_customer_name(order: dict) -> str:
        """Siparisten musteri adini cek — shipping_address veya customer_email."""
        addr = order.get("shipping_address")
        if addr and isinstance(addr, dict):
            ad = addr.get("ad", "")
            soyad = addr.get("soyad", "")
            if ad or soyad:
                return f"{ad} {soyad}".strip()
        email = order.get("customer_email")
        if email:
            return email
        return "-"

    def _populate_tree(self, orders: list[dict]):
        self.tree.delete(*self.tree.get_children())
        for o in orders:
            status = ORDER_STATUS_LABELS.get(o.get("status", ""), o.get("status", ""))
            payment = PAYMENT_STATUS_LABELS.get(o.get("payment_status", ""), o.get("payment_status", ""))
            customer = self._get_customer_name(o)
            self.tree.insert("", "end", iid=o["id"], values=(
                o.get("order_no", "-"),
                format_date(o.get("created_at")),
                customer,
                format_price(float(o.get("total", 0))),
                status,
                payment,
            ))
        self.count_label.configure(text=f"{len(orders)} siparis")

    def _on_select(self, event):
        sel = self.tree.selection()
        if not sel:
            return
        order_id = sel[0]
        for o in self.orders:
            if o["id"] == order_id:
                self.selected_order = o
                self._show_detail(o)
                break

    def _show_detail(self, order: dict):
        # Mevcut detay widget'larini temizle
        for w in self.detail_inner.winfo_children():
            w.destroy()

        # ─── Üst bilgi satırı ─────────────────────
        info_row = ctk.CTkFrame(self.detail_inner, fg_color="transparent")
        info_row.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            info_row, text=f"Siparis: {order.get('order_no', '-')}",
            font=FONTS["h3"], text_color=COLORS["accent_light"],
        ).pack(side="left")

        status = order.get("status", "")
        status_color = ORDER_STATUS_COLORS.get(status, COLORS["text_muted"])
        ctk.CTkLabel(
            info_row, text=f"  {ORDER_STATUS_LABELS.get(status, status)}  ",
            font=FONTS["badge"], text_color="#fff",
            fg_color=status_color, corner_radius=6,
        ).pack(side="left", padx=(12, 0))

        # ─── Müşteri + Adres ──────────────────────
        customer_frame = ctk.CTkFrame(self.detail_inner, fg_color=COLORS["bg_primary"],
                                       corner_radius=6)
        customer_frame.pack(fill="x", pady=(0, 8))

        cust_inner = ctk.CTkFrame(customer_frame, fg_color="transparent")
        cust_inner.pack(fill="x", padx=12, pady=8)

        ctk.CTkLabel(cust_inner, text="Musteri", font=FONTS["small_bold"],
                      text_color=COLORS["text_secondary"]).pack(anchor="w")
        ctk.CTkLabel(cust_inner, text=order.get("customer_email", "-"),
                      font=FONTS["body"], text_color=COLORS["text_primary"]).pack(anchor="w")

        # Adres
        addr = order.get("shipping_address")
        if addr and isinstance(addr, dict):
            addr_text = f"{addr.get('ad', '')} {addr.get('soyad', '')}\n{addr.get('adres', '')}\n{addr.get('ilce', '')} / {addr.get('il', '')}\nTel: {addr.get('telefon', '')}"
            ctk.CTkLabel(cust_inner, text=addr_text, font=FONTS["small"],
                          text_color=COLORS["text_muted"], justify="left").pack(anchor="w", pady=(4, 0))

        # ─── Ürün Tablosu ─────────────────────────
        items = order.get("items", [])
        if items:
            ctk.CTkLabel(self.detail_inner, text="Urunler", font=FONTS["small_bold"],
                          text_color=COLORS["text_secondary"]).pack(anchor="w", pady=(0, 4))

            items_frame = ctk.CTkFrame(self.detail_inner, fg_color=COLORS["bg_primary"],
                                        corner_radius=6)
            items_frame.pack(fill="x", pady=(0, 8))

            # Header
            hdr = ctk.CTkFrame(items_frame, fg_color=COLORS["bg_table_header"], corner_radius=0)
            hdr.pack(fill="x")
            hdr.columnconfigure(0, weight=3)
            hdr.columnconfigure((1, 2, 3), weight=1)

            for col, text in enumerate(["Urun", "Adet", "Fiyat", "Toplam"]):
                ctk.CTkLabel(hdr, text=text, font=FONTS["small_bold"],
                              text_color=COLORS["text_secondary"]).grid(
                    row=0, column=col, padx=8, pady=4, sticky="w")

            for i, item in enumerate(items):
                bg = COLORS["bg_primary"] if i % 2 == 0 else COLORS["bg_table_alt"]
                row_frame = ctk.CTkFrame(items_frame, fg_color=bg, corner_radius=0)
                row_frame.pack(fill="x")
                row_frame.columnconfigure(0, weight=3)
                row_frame.columnconfigure((1, 2, 3), weight=1)

                name = item.get("name_snapshot", "-")
                qty = item.get("qty", 0)
                price = float(item.get("price_snapshot", 0))
                sale = item.get("sale_price_snapshot")
                unit = float(sale) if sale else price
                total = unit * qty

                ctk.CTkLabel(row_frame, text=name, font=FONTS["small"],
                              text_color=COLORS["text_primary"]).grid(
                    row=0, column=0, padx=8, pady=3, sticky="w")
                ctk.CTkLabel(row_frame, text=str(qty), font=FONTS["small"],
                              text_color=COLORS["text_primary"]).grid(
                    row=0, column=1, padx=8, pady=3, sticky="w")
                ctk.CTkLabel(row_frame, text=format_price(unit), font=FONTS["small"],
                              text_color=COLORS["text_primary"]).grid(
                    row=0, column=2, padx=8, pady=3, sticky="w")
                ctk.CTkLabel(row_frame, text=format_price(total), font=FONTS["small_bold"],
                              text_color=COLORS["text_primary"]).grid(
                    row=0, column=3, padx=8, pady=3, sticky="w")

        # ─── Toplam Özet ──────────────────────────
        totals_frame = ctk.CTkFrame(self.detail_inner, fg_color=COLORS["bg_primary"],
                                     corner_radius=6)
        totals_frame.pack(fill="x", pady=(0, 8))

        totals_inner = ctk.CTkFrame(totals_frame, fg_color="transparent")
        totals_inner.pack(padx=12, pady=8, anchor="e")

        for label, key in [("Ara Toplam", "subtotal"), ("Kargo", "shipping"),
                            ("Indirim", "discount")]:
            val = float(order.get(key, 0))
            if val or key != "discount":
                row = ctk.CTkFrame(totals_inner, fg_color="transparent")
                row.pack(fill="x")
                ctk.CTkLabel(row, text=f"{label}:", font=FONTS["small"],
                              text_color=COLORS["text_muted"], width=100).pack(side="left")
                prefix = "-" if key == "discount" and val > 0 else ""
                ctk.CTkLabel(row, text=f"{prefix}{format_price(val)}",
                              font=FONTS["small"], text_color=COLORS["text_secondary"]).pack(side="right")

        # Genel toplam
        total_row = ctk.CTkFrame(totals_inner, fg_color="transparent")
        total_row.pack(fill="x", pady=(4, 0))
        ctk.CTkLabel(total_row, text="TOPLAM:", font=FONTS["body_bold"],
                      text_color=COLORS["text_primary"], width=100).pack(side="left")
        ctk.CTkLabel(total_row, text=format_price(float(order.get("total", 0))),
                      font=("Segoe UI", 16, "bold"),
                      text_color=COLORS["accent_light"]).pack(side="right")

        # ─── Durum Güncelleme ─────────────────────
        action_frame = ctk.CTkFrame(self.detail_inner, fg_color=COLORS["bg_primary"],
                                     corner_radius=6)
        action_frame.pack(fill="x", pady=(0, 4))

        action_inner = ctk.CTkFrame(action_frame, fg_color="transparent")
        action_inner.pack(fill="x", padx=12, pady=8)

        # Durum değiştir
        ctk.CTkLabel(action_inner, text="Durum:", font=FONTS["small_bold"],
                      text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))

        current_status = order.get("status", "")
        available = ORDER_TRANSITIONS.get(current_status, [])
        available_labels = [ORDER_STATUS_LABELS.get(s, s) for s in available]

        if available_labels:
            self._status_var = ctk.StringVar(value=available_labels[0] if available_labels else "")
            ctk.CTkOptionMenu(
                action_inner, values=available_labels,
                variable=self._status_var, width=160, height=30,
                font=FONTS["small"], fg_color=COLORS["bg_input"],
                button_color=COLORS["accent"],
                **DROPDOWN_COLORS,
            ).pack(side="left", padx=(0, 8))

            ctk.CTkButton(
                action_inner, text="Guncelle", width=90, height=30,
                font=FONTS["small_bold"], fg_color=COLORS["accent"],
                hover_color=COLORS["accent_hover"], corner_radius=6,
                command=lambda: self._update_status(order),
            ).pack(side="left", padx=(0, 16))
        else:
            ctk.CTkLabel(action_inner, text="(gecis yok)", font=FONTS["small"],
                          text_color=COLORS["text_muted"]).pack(side="left", padx=(0, 16))

        # Kargo takip
        ctk.CTkLabel(action_inner, text="Kargo:", font=FONTS["small_bold"],
                      text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 4))
        self._tracking_entry = ctk.CTkEntry(
            action_inner, width=150, height=30, font=FONTS["small"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Takip No",
        )
        self._tracking_entry.pack(side="left", padx=(0, 4))
        if order.get("tracking_no"):
            self._tracking_entry.insert(0, order["tracking_no"])

        ctk.CTkButton(
            action_inner, text="Kaydet", width=70, height=30,
            font=FONTS["small_bold"], fg_color=COLORS["info"],
            hover_color=COLORS["info_hover"], corner_radius=6,
            command=lambda: self._save_tracking(order),
        ).pack(side="left")

    def _update_status(self, order: dict):
        label = self._status_var.get()
        # Label'dan key bul
        new_status = None
        for key, lbl in ORDER_STATUS_LABELS.items():
            if lbl == label:
                new_status = key
                break
        if not new_status:
            return

        if not messagebox.askyesno("Onay",
                                     f"Siparis durumu '{label}' olarak guncellenecek. Devam?"):
            return

        try:
            self.sb.update_order_status(order["id"], new_status)
            messagebox.showinfo("Basarili", "Siparis durumu guncellendi")
            self.refresh()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _save_tracking(self, order: dict):
        tracking = self._tracking_entry.get().strip()
        if not tracking:
            messagebox.showwarning("Uyari", "Takip numarasi girin")
            return
        try:
            self.sb.update_order_tracking(order["id"], tracking)
            messagebox.showinfo("Basarili", "Kargo takip numarasi kaydedildi")
        except Exception as e:
            messagebox.showerror("Hata", str(e))
