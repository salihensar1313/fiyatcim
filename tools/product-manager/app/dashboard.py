"""Dashboard — Ozet istatistikler, son siparisler, kritik stok."""

import customtkinter as ctk
import threading
from tkinter import ttk

from app.theme import COLORS, FONTS, SPACING, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE, TREEVIEW_MAP
from app.theme import ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS
from app.utils import format_price, format_date


class Dashboard(ctk.CTkScrollableFrame):
    """Dashboard sayfasi — ozet istatistikler."""

    def __init__(self, master, sb_manager, on_navigate=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.on_navigate = on_navigate
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        # ─── Başlık ───────────────────────────────
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, SPACING["section_gap"]))

        ctk.CTkLabel(
            header, text="Dashboard",
            font=FONTS["h1"], text_color=COLORS["text_primary"],
        ).pack(side="left")

        ctk.CTkButton(
            header, text="Yenile", width=80, height=32,
            font=FONTS["body"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=8,
            command=self.refresh,
        ).pack(side="right")

        # ─── Stat Kartları (3x2 grid) ─────────────
        self.stats_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.stats_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))
        self.stats_frame.columnconfigure((0, 1, 2), weight=1, uniform="stat")

        self.stat_labels = {}
        stats_config = [
            ("total_products", "Toplam Urun", "0", COLORS["info"]),
            ("active_products", "Aktif Urun", "0", COLORS["success"]),
            ("total_orders", "Toplam Siparis", "0", COLORS["purple"]),
            ("today_orders", "Bugunun Siparisi", "0", COLORS["warning"]),
            ("total_revenue", "Toplam Ciro", "0 ₺", COLORS["emerald"]),
            ("critical_stock", "Kritik Stok", "0", COLORS["danger"]),
        ]

        for i, (key, title, default, color) in enumerate(stats_config):
            row, col = divmod(i, 3)
            card = ctk.CTkFrame(self.stats_frame, fg_color=COLORS["bg_card"],
                                 corner_radius=10, border_width=1,
                                 border_color=COLORS["border"])
            card.grid(row=row, column=col, padx=4, pady=4, sticky="nsew")

            inner = ctk.CTkFrame(card, fg_color="transparent")
            inner.pack(fill="both", padx=SPACING["card_pad_x"], pady=SPACING["card_pad_y"])

            # Sol accent bar
            bar = ctk.CTkFrame(card, width=4, fg_color=color, corner_radius=2)
            bar.place(x=0, y=8, relheight=0.7)

            ctk.CTkLabel(
                inner, text=title,
                font=FONTS["small"], text_color=COLORS["text_secondary"],
            ).pack(anchor="w")

            val_label = ctk.CTkLabel(
                inner, text=default,
                font=("Segoe UI", 26, "bold"), text_color=COLORS["text_primary"],
            )
            val_label.pack(anchor="w", pady=(4, 0))
            self.stat_labels[key] = val_label

        # ─── Hızlı Erişim ─────────────────────────
        actions_frame = ctk.CTkFrame(self, fg_color="transparent")
        actions_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))

        for text, key, color in [
            ("Yeni Urun", "new_product", COLORS["accent"]),
            ("Siparisler", "orders", COLORS["info"]),
            ("Stok Kontrol", "stock", COLORS["warning"]),
            ("CSV Export", "csv", COLORS["success"]),
        ]:
            ctk.CTkButton(
                actions_frame, text=text, width=130, height=34,
                font=FONTS["body_bold"], fg_color=color,
                hover_color=COLORS["bg_card_hover"], corner_radius=8,
                command=lambda k=key: self._navigate(k),
            ).pack(side="left", padx=(0, 8))

        # ─── Son Siparişler ───────────────────────
        ctk.CTkLabel(
            self, text="Son Siparisler",
            font=FONTS["h3"], text_color=COLORS["text_primary"],
        ).pack(anchor="w", pady=(0, 8))

        orders_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                     corner_radius=10, border_width=1,
                                     border_color=COLORS["border"])
        orders_frame.pack(fill="x", pady=(0, SPACING["section_gap"]))

        style = ttk.Style()
        style.configure("Dash.Treeview", **TREEVIEW_STYLE)
        style.configure("Dash.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Dash.Treeview", **TREEVIEW_MAP)

        cols = ("order_no", "date", "customer", "total", "status", "payment")
        self.orders_tree = ttk.Treeview(
            orders_frame, columns=cols, show="headings",
            style="Dash.Treeview", height=8,
        )

        self.orders_tree.heading("order_no", text="Siparis No")
        self.orders_tree.heading("date", text="Tarih")
        self.orders_tree.heading("customer", text="Musteri")
        self.orders_tree.heading("total", text="Toplam")
        self.orders_tree.heading("status", text="Durum")
        self.orders_tree.heading("payment", text="Odeme")

        self.orders_tree.column("order_no", width=140)
        self.orders_tree.column("date", width=130)
        self.orders_tree.column("customer", width=200)
        self.orders_tree.column("total", width=100)
        self.orders_tree.column("status", width=130)
        self.orders_tree.column("payment", width=100)

        self.orders_tree.pack(fill="x", padx=2, pady=2)

        # ─── Kritik Stok Uyarıları ────────────────
        ctk.CTkLabel(
            self, text="Kritik Stok Uyarilari",
            font=FONTS["h3"], text_color=COLORS["danger"],
        ).pack(anchor="w", pady=(0, 8))

        self.critical_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"],
                                            corner_radius=10, border_width=1,
                                            border_color=COLORS["danger_muted"])
        self.critical_frame.pack(fill="x")

        self.critical_label = ctk.CTkLabel(
            self.critical_frame, text="Yukleniyor...",
            font=FONTS["body"], text_color=COLORS["text_secondary"],
            justify="left",
        )
        self.critical_label.pack(padx=SPACING["card_pad_x"], pady=SPACING["card_pad_y"],
                                  anchor="w")

    def refresh(self):
        """Dashboard verilerini yenile (background thread)."""
        # Show loading state
        for key in self.stat_labels:
            self.stat_labels[key].configure(text="...")
        self.critical_label.configure(text="Yukleniyor...", text_color=COLORS["text_muted"])
        self.orders_tree.delete(*self.orders_tree.get_children())

        def _worker():
            results = {}
            try:
                products = self.sb.get_products()
                results["total_products"] = len(products)
                results["active_products"] = len([p for p in products if p.get("is_active")])
            except Exception:
                results["total_products"] = "Hata"
                results["active_products"] = "0"

            try:
                results["active_products_db"] = self.sb.get_active_product_count()
            except Exception:
                pass

            try:
                results["total_orders"] = self.sb.get_order_count()
            except Exception:
                results["total_orders"] = 0

            try:
                results["today_orders"] = self.sb.get_orders_today_count()
            except Exception:
                results["today_orders"] = 0

            try:
                results["revenue"] = self.sb.get_total_revenue()
            except Exception:
                results["revenue"] = 0

            try:
                results["critical"] = self.sb.get_critical_stock_products()
            except Exception:
                results["critical"] = None

            try:
                results["recent_orders"] = self.sb.get_recent_orders(10)
            except Exception:
                results["recent_orders"] = []

            self.after(0, lambda: self._on_refresh_done(results))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_refresh_done(self, results: dict):
        """Update UI with fetched data (main thread)."""
        tp = results.get("total_products", "0")
        self.stat_labels["total_products"].configure(text=str(tp))

        active = results.get("active_products_db") or results.get("active_products", "0")
        self.stat_labels["active_products"].configure(text=str(active))

        self.stat_labels["total_orders"].configure(text=str(results.get("total_orders", 0)))
        self.stat_labels["today_orders"].configure(text=str(results.get("today_orders", 0)))

        revenue = results.get("revenue", 0)
        self.stat_labels["total_revenue"].configure(text=format_price(revenue) if revenue else "0 ₺")

        critical = results.get("critical")
        if critical is not None:
            self.stat_labels["critical_stock"].configure(text=str(len(critical)))
            self._update_critical_list(critical)
        else:
            self.stat_labels["critical_stock"].configure(text="0")
            self.critical_label.configure(text="Veri alinamadi")

        recent = results.get("recent_orders", [])
        if recent:
            self._update_orders_table(recent)

    def _update_orders_table(self, orders: list[dict]):
        self.orders_tree.delete(*self.orders_tree.get_children())
        for o in orders:
            status = ORDER_STATUS_LABELS.get(o.get("status", ""), o.get("status", ""))
            payment = PAYMENT_STATUS_LABELS.get(o.get("payment_status", ""), o.get("payment_status", ""))
            self.orders_tree.insert("", "end", values=(
                o.get("order_no", "-"),
                format_date(o.get("created_at")),
                o.get("customer_email", "-"),
                format_price(float(o.get("total", 0))),
                status,
                payment,
            ))

    def _update_critical_list(self, products: list[dict]):
        if not products:
            self.critical_label.configure(
                text="Kritik stokta urun yok. Her sey yolunda!",
                text_color=COLORS["success"],
            )
            return

        lines = []
        for p in products[:10]:
            name = p.get("name", "?")
            stock = p.get("stock", 0)
            critical = p.get("critical_stock", 5)
            lines.append(f"  {name}  —  Stok: {stock} / Esik: {critical}")

        self.critical_label.configure(
            text="\n".join(lines),
            text_color=COLORS["warning"],
        )

    def _navigate(self, page_key: str):
        if self.on_navigate:
            self.on_navigate(page_key)
