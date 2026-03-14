"""Ana pencere: sol navigasyon + sağ içerik alanı — 12 sayfa + FiyatBot v2."""

import customtkinter as ctk
from tkinter import messagebox
from datetime import datetime

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

# FiyatBot v2 — kapalı devre maskot sistemi
from app.fiyatbot_engine import MessageEngine, MsgCat, Severity
from app.fiyatbot_overlay import FiyatBotOverlay
from app.fiyatbot_scanner import FiyatBotScanner


class MainWindow(ctk.CTkFrame):
    """Ana uygulama penceresi — navigasyon + içerik + FiyatBot v2."""

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

        # FiyatBot v2
        self._bot_engine = MessageEngine(dark_humor_level=2)
        self._bot_overlay = FiyatBotOverlay(
            master=self.winfo_toplevel(),
            on_action=self._show_page
        )
        self._bot_scanner = FiyatBotScanner(sb_manager)
        self._bot_scan_result = None
        self._bot_enabled = True
        self._save_streak = 0

        self._load_data()
        self.pack(fill="both", expand=True)
        self._build_layout()

        # Varsayılan sayfa
        self._show_page("home")

        # İlk tarama + açılış mesajı (2sn gecikme — UI yerleşsin)
        self.after(2000, self._bot_initial_scan)

        # Periyodik tarama (5 dakikada bir)
        self._bot_scan_timer()

        # Bildirim polling — 60 saniyede bir
        self._check_notifications()

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FİYATBOT v2 — Tarama & Bildirim Sistemi
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    def _bot_initial_scan(self):
        """Uygulama açıldığında ilk tarama + açılış bildirimi."""
        if not self._bot_enabled:
            return

        # Tarama
        self._bot_scan_result = self._bot_scanner.scan()
        ctx = self._bot_scan_result.to_context()

        # Home page'e veri gönder
        if "home" in self.pages and hasattr(self.pages["home"], "update_scan_result"):
            self.pages["home"].update_scan_result(self._bot_scan_result)

        # Açılış mesajı (sağ balon)
        msg = self._bot_engine.pick(MsgCat.ACILIS, ctx)
        if msg:
            self._bot_overlay.show(msg)

        # 5 saniye sonra en önemli sorunu bildir
        self.after(5000, self._bot_report_top_issue)

    def _bot_report_top_issue(self):
        """En önemli sorunu bildir."""
        if not self._bot_enabled or not self._bot_scan_result:
            return

        r = self._bot_scan_result
        ctx = r.to_context()

        # Öncelik sırası: fiyat=0 > stok=0 > görsel > açıklama > sipariş > eski
        if r.fiyat_sifir > 0:
            msg = self._bot_engine.pick(MsgCat.FIYAT_SIFIR, {**ctx, "n": r.fiyat_sifir})
            if msg:
                self._bot_overlay.show(msg)
        elif r.stok_sifir > 0:
            msg = self._bot_engine.pick(MsgCat.STOK_SIFIR, {**ctx, "n": r.stok_sifir})
            if msg:
                self._bot_overlay.show(msg)
        elif r.gorsel_yok > 0:
            msg = self._bot_engine.pick(MsgCat.GORSEL_EKSIK, {**ctx, "n": r.gorsel_yok,
                                         "oran": round(r.gorsel_yok / max(r.urun_toplam, 1) * 100)})
            if msg:
                self._bot_overlay.show(msg)
        elif r.aciklama_eksik > 0:
            msg = self._bot_engine.pick(MsgCat.ACIKLAMA_EKSIK, {**ctx, "n": r.aciklama_eksik,
                                         "oran": round(r.aciklama_eksik / max(r.urun_toplam, 1) * 100)})
            if msg:
                self._bot_overlay.show(msg)
        elif r.siparis_yeni > 0:
            msg = self._bot_engine.pick(MsgCat.SIPARIS_YENI, {**ctx, "n": r.siparis_yeni})
            if msg:
                self._bot_overlay.show(msg)

    def _bot_scan_timer(self):
        """5 dakikada bir tarama yap + sorun varsa bildir."""
        def _do_scan():
            if self._bot_enabled:
                self._bot_scan_result = self._bot_scanner.scan()
                ctx = self._bot_scan_result.to_context()

                # Home page güncelle
                if "home" in self.pages and hasattr(self.pages["home"], "update_scan_result"):
                    self.pages["home"].update_scan_result(self._bot_scan_result)

                # Yeni sipariş varsa bildir
                if self._bot_scan_result.siparis_yeni > 0:
                    msg = self._bot_engine.pick(MsgCat.SIPARIS_YENI,
                                                 {**ctx, "n": self._bot_scan_result.siparis_yeni})
                    if msg:
                        self._bot_overlay.show(msg)

                # Gece modu mesajı
                h = datetime.now().hour
                if h >= 22 or h < 7:
                    msg = self._bot_engine.pick(MsgCat.GECE, ctx)
                    if msg:
                        self._bot_overlay.show(msg)

            # Sonraki tarama
            self.after(300000, _do_scan)  # 5 dakika

        self.after(300000, _do_scan)

    def _bot_on_save(self):
        """Ürün kaydedildiğinde bot tepkisi."""
        if not self._bot_enabled:
            return
        self._save_streak += 1
        if self._save_streak >= 5 and self._save_streak % 5 == 0:
            msg = self._bot_engine.pick(MsgCat.BASARI)
            if msg:
                self._bot_overlay.show(msg)

    def _bot_on_bulk_action(self, count: int, action: str = "islem"):
        """Toplu işlem başladığında bot uyarısı."""
        if not self._bot_enabled:
            return
        msg = self._bot_engine.pick(MsgCat.KRITIK, {"n": count, "islem": action})
        if msg:
            self._bot_overlay.show(msg)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # MEVCUT FONKSİYONLAR
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

        # Logo bölümü
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

        # Nav grupları
        nav_groups = [
            [("home", "Ana Sayfa"), ("dashboard", "Ozet")],
            [("products", "Urunler"), ("new_product", "Yeni Urun"),
             ("discounts", "Indirimler"), ("bulk", "Toplu Islem")],
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

        # ─── Sağ İçerik Alanı ───────────────
        self.content_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.content_frame.pack(side="left", fill="both", expand=True, padx=0, pady=0)

        # ─── Alt Durum Çubuğu ───────────────
        self.status_bar = ctk.CTkFrame(self.master, height=28,
                                        fg_color=COLORS["bg_nav"], corner_radius=0)
        self.status_bar.pack(side="bottom", fill="x")

        self.status_label = ctk.CTkLabel(
            self.status_bar,
            text=f"DB: Bagli  |  {len(self.categories)} kategori  |  {len(self.brands)} marka",
            font=FONTS["tiny"], text_color=COLORS["text_muted"]
        )
        self.status_label.pack(side="left", padx=12)

        # FiyatBot status indicator
        self._bot_status_label = ctk.CTkLabel(
            self.status_bar,
            text="🤖 FiyatBot: aktif",
            font=FONTS["tiny"], text_color=COLORS["accent_light"]
        )
        self._bot_status_label.pack(side="right", padx=12)

        # ─── Sayfaları oluştur ──────────────
        self._create_pages()

    def _create_pages(self):
        def _safe_create(key, factory):
            try:
                page = factory()
                self.pages[key] = page
                return page
            except Exception as e:
                print(f"[HATA] Sayfa olusturulamadi: {key} — {e}")
                # Fallback bos sayfa
                fallback = ctk.CTkFrame(self.content_frame, fg_color="transparent")
                ctk.CTkLabel(fallback, text=f"Sayfa yuklenemedi: {key}\n{e}",
                             font=FONTS["body"], text_color=COLORS["danger"]).pack(pady=40)
                self.pages[key] = fallback
                return None

        self.home_page = _safe_create("home", lambda: HomePage(
            self.content_frame,
            user_email=self.sb.get_user_email(),
            on_navigate=self._show_page,
            scan_result=self._bot_scan_result
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

        _safe_create("discounts", lambda: DiscountManager(self.content_frame, self.sb))
        _safe_create("bulk", lambda: BulkOps(self.content_frame, self.sb))
        _safe_create("orders", lambda: OrderManager(self.content_frame, self.sb))
        _safe_create("invoices", lambda: InvoiceManager(self.content_frame, self.sb))

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

        if key == "products":
            self.product_list.refresh()
        elif key == "dashboard":
            self.dashboard.refresh()
        elif key == "categories":
            self.category_mgr.refresh()
        elif key == "brands":
            self.brand_mgr.refresh()
        elif key == "stock":
            self.stock_mgr.refresh()
        elif key == "discounts":
            self.discount_mgr.refresh()
        elif key == "orders":
            self.order_mgr.refresh()
        elif key == "invoices":
            self.invoice_mgr.refresh()

    def _edit_product(self, product: dict):
        self.product_form.load_product(product)
        self._show_page("new_product")

    def _copy_product(self, product: dict):
        self.product_form.load_product(product, is_copy=True)
        self._show_page("new_product")

    def _on_product_saved(self):
        self._update_status()
        self._bot_on_save()

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

    def _check_notifications(self):
        """60 saniyede bir bildirim kontrolü."""
        try:
            today_count = self.sb.get_orders_today_count()
            if today_count > 0 and "orders" in self._badge_labels:
                self._badge_labels["orders"].configure(
                    text=str(today_count), fg_color=COLORS["danger"]
                )
            elif "orders" in self._badge_labels:
                self._badge_labels["orders"].configure(
                    text="", fg_color="transparent"
                )

            critical = self.sb.get_critical_stock_products()
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

        self.after(60000, self._check_notifications)

    def _logout(self):
        if messagebox.askyesno("Cikis", "Cikmak istediginize emin misiniz?"):
            # FiyatBot kapanış mesajı
            if self._bot_enabled and self._bot_scan_result:
                ctx = self._bot_scan_result.to_context()
                msg = self._bot_engine.pick(MsgCat.KAPANIS, ctx)
                # Kapanış mesajını göstermek için kısa bekleme
                if msg:
                    self._bot_overlay.show(msg)

            # Overlay'ları temizle
            self._bot_overlay.destroy_all()

            try:
                self.sb.sign_out()
            except Exception:
                pass
            self.master.destroy()
