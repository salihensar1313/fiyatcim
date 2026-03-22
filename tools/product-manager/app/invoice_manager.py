"""Fatura Yonetimi — siparis sec, PDF fatura olustur."""

import os
import customtkinter as ctk
import threading
from tkinter import ttk, messagebox, filedialog

from app.theme import (COLORS, FONTS, SPACING, TREEVIEW_STYLE,
                        TREEVIEW_HEADING_STYLE, TREEVIEW_MAP,
                        ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
                        apply_dark_scrollbar, bind_treeview_scroll)
from app.utils import format_price, format_date
from app.pdf_invoice import generate_invoice_pdf


class InvoiceManager(ctk.CTkFrame):
    """Fatura sayfasi — siparis sec, PDF olustur."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.configure(fg_color="transparent")
        self.orders: list[dict] = []
        self.selected_order: dict | None = None
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık ───────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            header, text="Faturalar",
            font=FONTS["h2"], text_color=COLORS["text_primary"],
        ).pack(side="left")

        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=8,
            command=self.refresh,
        ).pack(side="right")

        # ─── Açıklama ────────────────────────────
        ctk.CTkLabel(
            self,
            text="Asagidaki tablodan bir siparis secin, ardindan PDF fatura olusturun.",
            font=FONTS["small"], text_color=COLORS["text_muted"],
        ).pack(anchor="w", pady=(0, 8))

        # ─── Filtre ──────────────────────────────
        filter_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                     corner_radius=8, border_width=1,
                                     border_color=COLORS["border"])
        filter_frame.pack(fill="x", pady=(0, 8))

        filter_inner = ctk.CTkFrame(filter_frame, fg_color="transparent")
        filter_inner.pack(fill="x", padx=12, pady=8)

        self.search_entry = ctk.CTkEntry(
            filter_inner, width=250, height=30, font=FONTS["small"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Siparis no ile ara...",
        )
        self.search_entry.pack(side="left")
        self.search_entry.bind("<KeyRelease>", lambda e: self._filter())

        self.count_label = ctk.CTkLabel(
            filter_inner, text="0 siparis", font=FONTS["small"],
            text_color=COLORS["text_muted"],
        )
        self.count_label.pack(side="right")

        # ─── Sipariş Tablosu ─────────────────────
        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True, pady=(0, 8))

        style = ttk.Style()
        style.configure("Invoice.Treeview", **TREEVIEW_STYLE)
        style.configure("Invoice.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Invoice.Treeview", **TREEVIEW_MAP)
        apply_dark_scrollbar(style)

        cols = ("order_no", "date", "customer", "total", "status", "invoice_type")
        self.tree = ttk.Treeview(
            tree_frame, columns=cols, show="headings",
            style="Invoice.Treeview", selectmode="browse",
        )

        self.tree.heading("order_no", text="Siparis No")
        self.tree.heading("date", text="Tarih")
        self.tree.heading("customer", text="Musteri")
        self.tree.heading("total", text="Toplam")
        self.tree.heading("status", text="Durum")
        self.tree.heading("invoice_type", text="Fatura Tipi")

        self.tree.column("order_no", width=140)
        self.tree.column("date", width=120)
        self.tree.column("customer", width=200)
        self.tree.column("total", width=100)
        self.tree.column("status", width=130)
        self.tree.column("invoice_type", width=100)

        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side="right", fill="y")
        self.tree.pack(fill="both", expand=True, padx=2, pady=2)
        bind_treeview_scroll(self.tree)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)

        # ─── Alt: Önizleme + Butonlar ────────────
        bottom_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                     corner_radius=10, border_width=1,
                                     border_color=COLORS["border"])
        bottom_frame.pack(fill="x")

        bottom_inner = ctk.CTkFrame(bottom_frame, fg_color="transparent")
        bottom_inner.pack(fill="x", padx=SPACING["card_pad_x"], pady=SPACING["card_pad_y"])

        # Seçili sipariş bilgisi
        self.preview_label = ctk.CTkLabel(
            bottom_inner,
            text="Fatura olusturmak icin yukardaki tablodan siparis secin.",
            font=FONTS["body"], text_color=COLORS["text_muted"],
            justify="left",
        )
        self.preview_label.pack(anchor="w", pady=(0, 12))

        # Butonlar
        btn_frame = ctk.CTkFrame(bottom_inner, fg_color="transparent")
        btn_frame.pack(fill="x")

        self.pdf_btn = ctk.CTkButton(
            btn_frame, text="PDF Fatura Olustur ve Kaydet",
            width=250, height=38, font=FONTS["body_bold"],
            fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            corner_radius=8, command=self._generate_pdf,
            state="disabled",
        )
        self.pdf_btn.pack(side="left", padx=(0, 12))

        self.parasut_btn = ctk.CTkButton(
            btn_frame, text="Parasut E-Fatura (Yakin Zamanda)",
            width=250, height=38, font=FONTS["body_bold"],
            fg_color=COLORS["text_muted"], hover_color=COLORS["text_muted"],
            corner_radius=8, state="disabled",
        )
        self.parasut_btn.pack(side="left")

        # Parasut durumunu kontrol et
        self._check_parasut()

    def _check_parasut(self):
        """Parasut API yapilandirmasi var mi kontrol et."""
        try:
            from app.parasut_client import ParasutClient
            client = ParasutClient()
            if client.is_configured():
                self.parasut_btn.configure(
                    text="Parasut E-Fatura Olustur",
                    fg_color=COLORS["success"],
                    hover_color=COLORS["success_hover"],
                    state="normal",
                )
        except Exception:
            pass

    def refresh(self):
        self._set_loading(True)

        def _worker():
            try:
                data = self.sb.get_orders(limit=100)
            except Exception:
                data = []
            self.after(0, lambda: self._on_refresh_done(data))

        threading.Thread(target=_worker, daemon=True).start()

    def _set_loading(self, loading):
        if loading:
            self.tree.delete(*self.tree.get_children())
            self.tree.insert("", "end", values=("Yukleniyor...", "", "", "", "", ""))
            self.count_label.configure(text="Yukleniyor...")

    def _on_refresh_done(self, data):
        self.orders = data
        self._filter()

    def _filter(self):
        search = self.search_entry.get().strip().lower()
        filtered = self.orders
        if search:
            filtered = [o for o in self.orders if
                        search in (o.get("order_no") or "").lower() or
                        search in (o.get("customer_email") or "").lower()]
        self._populate_tree(filtered)

    def _populate_tree(self, orders: list[dict]):
        self.tree.delete(*self.tree.get_children())
        for o in orders:
            inv_info = o.get("invoice_info") or {}
            inv_type = ""
            if inv_info:
                inv_type = "Kurumsal" if inv_info.get("type") == "kurumsal" else "Bireysel"

            self.tree.insert("", "end", iid=o["id"], values=(
                o.get("order_no", "-"),
                format_date(o.get("created_at"), include_time=False),
                o.get("customer_email", "-"),
                format_price(float(o.get("total", 0))),
                ORDER_STATUS_LABELS.get(o.get("status", ""), o.get("status", "")),
                inv_type or "-",
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
                self._update_preview(o)
                self.pdf_btn.configure(state="normal")
                break

    def _update_preview(self, order: dict):
        inv = order.get("invoice_info") or {}
        items = order.get("items", [])

        lines = []
        lines.append(f"Siparis: {order.get('order_no', '-')}")
        lines.append(f"Tarih: {format_date(order.get('created_at'))}")
        lines.append(f"Musteri: {order.get('customer_email', '-')}")

        if inv.get("type") == "kurumsal":
            lines.append(f"Firma: {inv.get('companyName', '-')}  |  VKN: {inv.get('taxNumber', '-')}")
        elif inv.get("fullName"):
            lines.append(f"Ad Soyad: {inv.get('fullName', '-')}")

        lines.append(f"Urun Sayisi: {len(items)}  |  Toplam: {format_price(float(order.get('total', 0)))}")

        self.preview_label.configure(
            text="\n".join(lines),
            text_color=COLORS["text_primary"],
        )

    def _generate_pdf(self):
        if not self.selected_order:
            messagebox.showwarning("Uyari", "Once bir siparis secin")
            return

        order_no = self.selected_order.get("order_no", "fatura")
        default_name = f"Fatura-{order_no}.pdf"

        file_path = filedialog.asksaveasfilename(
            title="Fatura Kaydet",
            defaultextension=".pdf",
            filetypes=[("PDF Dosyasi", "*.pdf")],
            initialfile=default_name,
        )

        if not file_path:
            return

        try:
            generate_invoice_pdf(self.selected_order, file_path)
            messagebox.showinfo("Basarili", f"Fatura olusturuldu:\n{file_path}")

            # PDF'i ac
            try:
                os.startfile(file_path)
            except Exception:
                pass
        except Exception as e:
            messagebox.showerror("Hata", f"Fatura olusturulamadi:\n{e}")
