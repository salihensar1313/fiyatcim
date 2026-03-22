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
        self._page_factories: dict[str, tuple] = {}
        self.current_page = None
        self.nav_buttons: dict[str, ctk.CTkButton] = {}
        self._badge_labels: dict[str, ctk.CTkLabel] = {}

        self.pack(fill="both", expand=True)
        self._build_layout()

        # Varsayilan sayfa (home — veri gerektirmez)
        self._show_page("home")

        # Veriyi arka planda yukle
        threading.Thread(target=self._load_data_async, daemon=True).start()

        # Bildirim badge guncelle (background thread — UI kasmasin)
        self.after(3000, self._check_notifications_bg)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # DATA
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def _load_data_async(self):
        """Background thread: kategorileri ve markalari yukle."""
        try:
            cats = self.sb.get_categories()
            brands = self.sb.get_brands()
        except Exception:
            cats = []
            brands = []
        self.after(0, lambda: self._on_data_ready(cats, brands))

    def _on_data_ready(self, cats, brands):
        """Ana thread: veri hazir, sayfa factory'lerini kaydet."""
        self.categories = cats
        self.brands = brands
        self._register_page_factories()
        self._update_status()

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

        # Home ve guide sayfalarini hemen olustur (veri gerektirmez)
        self._page_factories = {
            "home": lambda: HomePage(
                self.content_frame,
                user_email=self.sb.get_user_email(),
                on_navigate=self._show_page,
            ),
            "guide": lambda: SiteGuide(self.content_frame),
        }

    def _register_page_factories(self):
        """Sayfa factory'lerini kaydet — sayfalar ilk erisimde olusturulur."""
        self._page_factories = {
            "home": lambda: HomePage(
                self.content_frame,
                user_email=self.sb.get_user_email(),
                on_navigate=self._show_page,
            ),
            "dashboard": lambda: Dashboard(
                self.content_frame, self.sb,
                on_navigate=self._show_page,
            ),
            "products": lambda: ProductList(
                self.content_frame, self.sb, self.categories, self.brands,
                on_edit=self._edit_product,
                on_copy=self._copy_product,
                on_selection_change=self._on_product_selection,
            ),
            "new_product": lambda: ProductForm(
                self.content_frame, self.sb, self.categories, self.brands,
                on_saved=self._on_product_saved,
            ),
            "discounts": lambda: DiscountManager(self.content_frame, self.sb),
            "bulk": lambda: BulkOps(self.content_frame, self.sb),
            "source_match": lambda: SourceMatcher(self.content_frame, self.sb),
            "orders": lambda: OrderManager(self.content_frame, self.sb),
            "invoices": lambda: InvoiceManager(self.content_frame, self.sb),
            "categories": lambda: CategoryManager(
                self.content_frame, self.sb, on_change=self._on_category_change,
            ),
            "brands": lambda: BrandManager(
                self.content_frame, self.sb, on_change=self._on_brand_change,
            ),
            "stock": lambda: StockManager(self.content_frame, self.sb),
            "csv": lambda: CsvExport(self.content_frame, self.sb),
            "guide": lambda: SiteGuide(self.content_frame),
        }

    def _get_or_create_page(self, key: str) -> ctk.CTkFrame | None:
        """Sayfa yoksa factory'den olustur, varsa dondur."""
        if key in self.pages:
            return self.pages[key]

        factory = self._page_factories.get(key)
        if not factory:
            return None

        try:
            page = factory()
            self.pages[key] = page
            # Attr atamalari — geriye uyumluluk
            attr_map = {
                "home": "home_page", "dashboard": "dashboard",
                "products": "product_list", "new_product": "product_form",
                "discounts": "discount_mgr", "bulk": "bulk_ops",
                "source_match": "source_matcher", "orders": "order_mgr",
                "invoices": "invoice_mgr", "categories": "category_mgr",
                "brands": "brand_mgr", "stock": "stock_mgr",
            }
            if key in attr_map:
                setattr(self, attr_map[key], page)
            return page
        except Exception as e:
            print(f"[HATA] Sayfa olusturulamadi: {key} — {e}")
            fallback = ctk.CTkFrame(self.content_frame, fg_color="transparent")
            ctk.CTkLabel(fallback, text=f"Sayfa yuklenemedi: {key}\n{e}",
                         font=FONTS["body"], text_color=COLORS["danger"]).pack(pady=40)
            self.pages[key] = fallback
            return fallback

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

        # Lazy page creation
        page = self._get_or_create_page(key)
        if not page:
            # Factories not registered yet (data still loading)
            if not hasattr(self, '_loading_frame'):
                self._loading_frame = ctk.CTkFrame(self.content_frame, fg_color="transparent")
                ctk.CTkLabel(self._loading_frame, text="Veriler yukleniyor...",
                             font=FONTS["h3"], text_color=COLORS["text_muted"]).pack(pady=60)
            page = self._loading_frame

        page.pack(fill="both", expand=True, padx=SPACING["page_pad"],
                  pady=SPACING["page_pad"])

        # Sayfa acildiginda refresh cagir (varsa)
        if hasattr(page, "refresh"):
            try:
                page.refresh()
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
        def _worker():
            try:
                cats = self.sb.get_categories()
            except Exception:
                return
            self.after(0, lambda: self._apply_category_change(cats))
        threading.Thread(target=_worker, daemon=True).start()

    def _apply_category_change(self, cats):
        self.categories = cats
        self._update_status()
        if hasattr(self, 'product_form') and self.product_form:
            self.product_form.refresh_dropdowns(self.categories, self.brands)

    def _on_brand_change(self):
        def _worker():
            try:
                brands = self.sb.get_brands()
            except Exception:
                return
            self.after(0, lambda: self._apply_brand_change(brands))
        threading.Thread(target=_worker, daemon=True).start()

    def _apply_brand_change(self, brands):
        self.brands = brands
        self._update_status()
        if hasattr(self, 'product_form') and self.product_form:
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
