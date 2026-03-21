"""Ana pencere: sol navigasyon + sag icerik alani — 12 sayfa."""

import customtkinter as ctk
from tkinter import messagebox
import threading

from app.theme import COLORS, FONTS, SPACING
from app.version import APP_VERSION
from app.home_page import HomePage
from app.dashboard import Dashboard
from app.product_form import ProductForm
from app.product_list import ProductList
from app.category_manager import CategoryManager
from app.brand_manager import BrandManager
from app.stock_manager import StockManager
from app.bulk_ops import BulkOps
from app.order_manager import OrderManager
from app.invoice_manager import InvoiceManager
from app.csv_export import CsvExport
from app.site_guide import SiteGuide
from app.discount_manager import DiscountManager
from app.source_matcher import SourceMatcher


class MainWindow(ctk.CTkFrame):
    """Ana uygulama penceresi — navigasyon + icerik."""

    def __init__(self, master, sb_manager):
        super().__init__(master)
        self.sb = sb_manager
        self.configure(fg_color="transparent")

        self.categories: list[dict] = []
        self.brands: list[dict] = []
        self.pages: dict[str, ctk.CTkFrame] = {}
        self.current_page = None
        self.nav_buttons: dict[str, ctk.CTkButton] = {}
        self._badge_labels: dict[str, ctk.CTkLabel] = {}

        self._load_data()
        self.pack(fill="both", expand=True)
        self._build_layout()

        # Varsayilan sayfa
        self._show_page("home")

        # Bildirim badge guncelle (background thread — UI kasmasin)
        self.after(3000, self._check_notifications_bg)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DATA
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def _load_data(self):
        try:
            self.categories = self.sb.get_categories()
            self.brands = self.sb.get_brands()
        except Exception as e:
            messagebox.showerror("Veri Yuklenemedi", str(e))

    def _build_layout(self):
        # ─── Sol Navigasyon ──────────────────
        self.nav_frame = ctk.CTkFrame(self, width=190, fg_color=COLORS["bg_nav"],
                                       corner_radius=0)
        self.nav_frame.pack(side="left", fill="y")
        self.nav_frame.pack_propagate(False)

        # Logo bolumu
        logo_frame = ctk.CTkFrame(self.nav_frame, fg_color=COLORS["bg_nav_logo"],
                                   corner_radius=0)
        logo_frame.pack(fill="x", pady=(0, 4))

        ctk.CTkLabel(
            logo_frame, text="Fiyatcim",
            font=FONTS["logo"], text_color=COLORS["brand_red"]
        ).pack(pady=(16, 0))
        ctk.CTkLabel(
            logo_frame, text=".com",
            font=FONTS["body"], text_color=COLORS["text_muted"]
        ).pack(pady=(0, 2))
        ctk.CTkLabel(
            logo_frame, text=f"Urun Yoneticisi v{APP_VERSION}",
            font=FONTS["tiny"], text_color=COLORS["text_muted"]
        ).pack(pady=(0, 12))

        # Nav gruplari
        nav_groups = [
            [("home", "Ana Sayfa"), ("dashboard", "Ozet")],
            [("products", "Urunler"), ("new_product", "Yeni Urun"),
             ("discounts", "Indirimler"), ("bulk", "Toplu Islem"),
             ("source_match", "Kaynak Esleme")],
            [("orders", "Siparisler"), ("invoices", "Faturalar")],
            [("categories", "Kategoriler"), ("brands", "Markalar"),
             ("stock", "Stok"), ("csv", "CSV / Yedek"), ("guide", "Rehber")],
        ]

        for group_idx, group in enumerate(nav_groups):
            if group_idx > 0:
                sep = ctk.CTkFrame(self.nav_frame, height=1,
                                    fg_color=COLORS["border"], corner_radius=0)
                sep.pack(fill="x", padx=SPACING["nav_pad"], pady=4)

            for key, label in group:
                btn_frame = ctk.CTkFrame(self.nav_frame, fg_color="transparent")
                btn_frame.pack(fill="x", padx=SPACING["nav_pad"], pady=1)

                btn = ctk.CTkButton(
                    btn_frame, text=f"  {label}", height=36,
                    font=FONTS["nav"], anchor="w",
                    fg_color="transparent", hover_color=COLORS["bg_card"],
                    text_color=COLORS["text_secondary"], corner_radius=8,
                    command=lambda k=key: self._show_page(k)
                )
                btn.pack(side="left", fill="x", expand=True)
                self.nav_buttons[key] = btn

                if key in ("orders", "stock"):
                    badge = ctk.CTkLabel(
                        btn_frame, text="", width=20, height=18,
                        font=FONTS["badge"], corner_radius=9,
                        fg_color="transparent", text_color="#ffffff"
                    )
                    badge.pack(side="right", padx=(0, 4))
                    self._badge_labels[key] = badge

        # Alt bilgi
        spacer = ctk.CTkFrame(self.nav_frame, fg_color="transparent")
        spacer.pack(fill="both", expand=True)

        sep = ctk.CTkFrame(self.nav_frame, height=1, fg_color=COLORS["border"])
        sep.pack(fill="x", padx=10)

        email = self.sb.get_user_email()
        ctk.CTkLabel(
            self.nav_frame, text=email[:24] + "..." if len(email) > 27 else email,
            font=FONTS["small"], text_color=COLORS["text_muted"]
        ).pack(pady=(8, 4))

        ctk.CTkButton(
            self.nav_frame, text="Cikis", width=120, height=30,
            font=FONTS["small"], fg_color=COLORS["bg_card"],
            hover_color=COLORS["border"], corner_radius=8,
            command=self._logout
        ).pack(pady=(0, 12))

        # ─── Sag Icerik Alani ───────────────
        self.content_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.content_frame.pack(side="left", fill="both", expand=True, padx=0, pady=0)

        # ─── Alt Durum Cubugu ───────────────
        self.status_bar = ctk.CTkFrame(self.master, height=28,
                                        fg_color=COLORS["bg_nav"], corner_radius=0)
        self.status_bar.pack(side="bottom", fill="x")

        self.status_label = ctk.CTkLabel(
            self.status_bar,
            text=f"DB: Bagli  |  {len(self.categories)} kategori  |  {len(self.brands)} marka",
            font=FONTS["tiny"], text_color=COLORS["text_muted"]
        )
        self.status_label.pack(side="left", padx=12)

        # ─── Sayfalari olustur ──────────────
        self._create_pages()

    def _create_pages(self):
        def _safe_create(key, factory):
            try:
                page = factory()
                self.pages[key] = page
                return page
            except Exception as e:
                print(f"[HATA] Sayfa olusturulamadi: {key} — {e}")
                fallback = ctk.CTkFrame(self.content_frame, fg_color="transparent")
                ctk.CTkLabel(fallback, text=f"Sayfa yuklenemedi: {key}\n{e}",
                             font=FONTS["body"], text_color=COLORS["danger"]).pack(pady=40)
                self.pages[key] = fallback
                return None

        self.home_page = _safe_create("home", lambda: HomePage(
            self.content_frame,
            user_email=self.sb.get_user_email(),
            on_navigate=self._show_page,
        ))

        self.dashboard = _safe_create("dashboard", lambda: Dashboard(
            self.content_frame, self.sb,
            on_navigate=self._show_page
        ))

        self.product_list = _safe_create("products", lambda: ProductList(
            self.content_frame, self.sb, self.categories, self.brands,
            on_edit=self._edit_product,
            on_copy=self._copy_product,
            on_selection_change=self._on_product_selection
        ))

        self.product_form = _safe_create("new_product", lambda: ProductForm(
            self.content_frame, self.sb, self.categories, self.brands,
            on_saved=self._on_product_saved
        ))

        self.discount_mgr = _safe_create("discounts", lambda: DiscountManager(self.content_frame, self.sb))
        self.bulk_ops = _safe_create("bulk", lambda: BulkOps(self.content_frame, self.sb))
        self.source_matcher = _safe_create("source_match", lambda: SourceMatcher(self.content_frame, self.sb))
        self.order_mgr = _safe_create("orders", lambda: OrderManager(self.content_frame, self.sb))
        self.invoice_mgr = _safe_create("invoices", lambda: InvoiceManager(self.content_frame, self.sb))

        self.category_mgr = _safe_create("categories", lambda: CategoryManager(
            self.content_frame, self.sb, on_change=self._on_category_change
        ))

        self.brand_mgr = _safe_create("brands", lambda: BrandManager(
            self.content_frame, self.sb, on_change=self._on_brand_change
        ))

        self.stock_mgr = _safe_create("stock", lambda: StockManager(self.content_frame, self.sb))
        _safe_create("csv", lambda: CsvExport(self.content_frame, self.sb))
        _safe_create("guide", lambda: SiteGuide(self.content_frame))

    def _show_page(self, key: str):
        if self.current_page and self.current_page in self.pages:
            self.pages[self.current_page].pack_forget()

        for k, btn in self.nav_buttons.items():
            if k == key:
                btn.configure(fg_color=COLORS["accent_muted"],
                              text_color=COLORS["accent_light"])
            else:
                btn.configure(fg_color="transparent",
                              text_color=COLORS["text_secondary"])

        self.current_page = key
        page = self.pages[key]
        page.pack(fill="both", expand=True, padx=SPACING["page_pad"],
                  pady=SPACING["page_pad"])

        # Sayfa acildiginda refresh cagir (varsa)
        refresh_map = {
            "products": "product_list",
            "dashboard": "dashboard",
            "categories": "category_mgr",
            "brands": "brand_mgr",
            "stock": "stock_mgr",
            "discounts": "discount_mgr",
            "bulk": "bulk_ops",
            "source_match": "source_matcher",
            "orders": "order_mgr",
            "invoices": "invoice_mgr",
        }
        attr = refresh_map.get(key)
        if attr and hasattr(self, attr):
            obj = getattr(self, attr)
            if obj and hasattr(obj, "refresh"):
                try:
                    obj.refresh()
                except Exception as e:
                    print(f"[HATA] {key} refresh hatasi: {e}")

    def _edit_product(self, product: dict):
        self.product_form.load_product(product)
        self._show_page("new_product")

    def _copy_product(self, product: dict):
        self.product_form.load_product(product, is_copy=True)
        self._show_page("new_product")

    def _on_product_saved(self):
        self._update_status()

    def _on_product_selection(self, ids: set[str]):
        pass

    def _on_category_change(self):
        self.categories = self.sb.get_categories()
        self._update_status()
        if hasattr(self, 'product_form'):
            self.product_form.refresh_dropdowns(self.categories, self.brands)

    def _on_brand_change(self):
        self.brands = self.sb.get_brands()
        self._update_status()
        if hasattr(self, 'product_form'):
            self.product_form.refresh_dropdowns(self.categories, self.brands)

    def _update_status(self):
        self.status_label.configure(
            text=f"DB: Bagli  |  {len(self.categories)} kategori  |  {len(self.brands)} marka"
        )

    def _check_notifications_bg(self):
        """Background thread'de bildirim kontrolu — UI kasmasin."""
        def _worker():
            try:
                today_count = self.sb.get_orders_today_count()
                critical = self.sb.get_critical_stock_products()
                # UI guncellemeyi ana thread'de yap
                self.after(0, lambda: self._update_badges(today_count, critical))
            except Exception:
                pass

        threading.Thread(target=_worker, daemon=True).start()
        # Sonraki kontrol: 5 dakika (eskiden 60sn idi — cok sik)
        self.after(300000, self._check_notifications_bg)

    def _update_badges(self, today_count: int, critical: list):
        """Badge'leri guncelle (ana thread'de cagirilir)."""
        try:
            if today_count > 0 and "orders" in self._badge_labels:
                self._badge_labels["orders"].configure(
                    text=str(today_count), fg_color=COLORS["danger"]
                )
            elif "orders" in self._badge_labels:
                self._badge_labels["orders"].configure(
                    text="", fg_color="transparent"
                )

            if critical and "stock" in self._badge_labels:
                self._badge_labels["stock"].configure(
                    text=str(len(critical)), fg_color=COLORS["warning"]
                )
            elif "stock" in self._badge_labels:
                self._badge_labels["stock"].configure(
                    text="", fg_color="transparent"
                )
        except Exception:
            pass

    def _logout(self):
        if messagebox.askyesno("Cikis", "Cikmak istediginize emin misiniz?"):
            try:
                self.sb.sign_out()
            except Exception:
                pass
            self.master.destroy()
