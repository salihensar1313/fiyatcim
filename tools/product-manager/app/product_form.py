"""Ürün ekleme/düzenleme formu — temiz, kullanımı kolay layout."""

import customtkinter as ctk
from tkinter import messagebox
import threading

from app.image_manager import ImageManager
from app.spec_editor import SpecEditor
from app.product_preview import open_preview
from app.theme import COLORS, FONTS, DROPDOWN_COLORS, SWITCH_COLORS
from app.utils import slugify, safe_int, safe_float, get_exchange_rate


class ProductForm(ctk.CTkScrollableFrame):
    """Ürün ekleme ve düzenleme formu."""

    def __init__(self, master, sb_manager, categories, brands, on_saved=None, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.categories = categories
        self.brands = brands
        self.on_saved = on_saved
        self.editing_id = None
        self._exchange_rate = 38.5  # fallback, background'da guncellenecek
        self._auto_convert = True

        self.configure(fg_color="transparent")
        self._build_form()

        # Kuru background'da cek (UI bloklama yok)
        threading.Thread(target=self._fetch_rate_bg, daemon=True).start()

    def _fetch_rate_bg(self):
        rate = get_exchange_rate()
        self._exchange_rate = rate
        try:
            self.after(0, lambda: self.rate_label.configure(
                text=f"$1 = {rate:.2f} TL"))
        except Exception:
            pass

    # ─── UI BUILD ─────────────────────────────────────

    def _build_form(self):
        # ═══════════════════════════════════════════════
        # BÖLÜM 1: Görseller (tam genişlik)
        # ═══════════════════════════════════════════════
        self.image_manager = ImageManager(self)
        self.image_manager.pack(fill="x", pady=(0, 20))

        # ═══════════════════════════════════════════════
        # BÖLÜM 2: Temel Bilgiler
        # ═══════════════════════════════════════════════
        basic_card = self._card("Temel Bilgiler")

        # Satır 1: Ürün adı (tam genişlik)
        self._field_label(basic_card, "URUN ADI *")
        self.name_entry = ctk.CTkEntry(
            basic_card, height=44, font=("Segoe UI", 15, "bold"),
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Urun adini girin...")
        self.name_entry.pack(fill="x", pady=(0, 12))
        self.name_entry.bind("<KeyRelease>", self._auto_slug)

        # Satır 2: Marka + Kategori yan yana
        row_mc = ctk.CTkFrame(basic_card, fg_color="transparent")
        row_mc.pack(fill="x", pady=(0, 12))
        row_mc.columnconfigure(0, weight=1)
        row_mc.columnconfigure(1, weight=1)

        mk_f = ctk.CTkFrame(row_mc, fg_color="transparent")
        mk_f.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self._field_label(mk_f, "MARKA *")
        brand_names = [b["name"] for b in self.brands]
        self.brand_var = ctk.StringVar(value=brand_names[0] if brand_names else "")
        self.brand_menu = ctk.CTkOptionMenu(
            mk_f, values=brand_names or ["---"],
            variable=self.brand_var, height=36,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            button_color=COLORS["accent"], **DROPDOWN_COLORS,
        )
        self.brand_menu.pack(fill="x")

        cat_f = ctk.CTkFrame(row_mc, fg_color="transparent")
        cat_f.grid(row=0, column=1, sticky="ew", padx=(8, 0))
        self._field_label(cat_f, "KATEGORI *")
        cat_names = [c["name"] for c in self.categories]
        self.category_var = ctk.StringVar(value=cat_names[0] if cat_names else "")
        self.category_menu = ctk.CTkOptionMenu(
            cat_f, values=cat_names or ["---"],
            variable=self.category_var, height=36,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            button_color=COLORS["accent"], **DROPDOWN_COLORS,
        )
        self.category_menu.pack(fill="x")

        # SKU + Slug gizli — otomatik olusturulur (pack edilmiyor, sadece veri tutucu)
        self._hidden_frame = ctk.CTkFrame(basic_card, fg_color="transparent", height=1)
        self.sku_entry = ctk.CTkEntry(self._hidden_frame)
        self.slug_entry = ctk.CTkEntry(self._hidden_frame)

        # ═══════════════════════════════════════════════
        # BÖLÜM 3: Fiyat & Stok
        # ═══════════════════════════════════════════════
        price_card = self._card("Fiyat & Stok")

        # Fiyat satırı: 4 alan yan yana
        price_row = ctk.CTkFrame(price_card, fg_color="transparent")
        price_row.pack(fill="x", pady=(0, 6))
        for i in range(4):
            price_row.columnconfigure(i, weight=1)

        self.price_usd_entry = self._grid_field(price_row, "Fiyat USD *", "0", 0)
        self.sale_price_usd_entry = self._grid_field(price_row, "Ind. USD", "", 1)
        self.price_entry = self._grid_field(price_row, "Fiyat TRY *", "0", 2)
        self.sale_price_entry = self._grid_field(price_row, "Ind. TRY", "", 3)

        # Kur + indirim bilgi satırı
        info_row = ctk.CTkFrame(price_card, fg_color="transparent")
        info_row.pack(fill="x", pady=(0, 12))

        self.rate_label = ctk.CTkLabel(
            info_row, text=f"$1 = {self._exchange_rate:.2f} TL",
            font=FONTS["small_bold"], text_color=COLORS["accent_light"])
        self.rate_label.pack(side="left")

        ctk.CTkButton(
            info_row, text="Kuru Guncelle", width=90, height=24,
            font=FONTS["tiny"], fg_color=COLORS["bg_input"],
            hover_color=COLORS["border_light"], command=self._refresh_rate
        ).pack(side="left", padx=(8, 0))

        self.discount_label = ctk.CTkLabel(
            info_row, text="", font=FONTS["body_bold"],
            text_color=COLORS["success"])
        self.discount_label.pack(side="right")

        ctk.CTkLabel(
            price_card, text="KDV dahil fiyat. USD/TRY otomatik cevirilir.",
            font=FONTS["tiny"], text_color=COLORS["text_muted"]
        ).pack(anchor="w", pady=(0, 12))

        # Bindings
        self.price_usd_entry.bind("<KeyRelease>", self._on_usd_price_change)
        self.sale_price_usd_entry.bind("<KeyRelease>", self._on_usd_sale_change)
        self.price_entry.bind("<KeyRelease>", self._on_try_price_change)
        self.sale_price_entry.bind("<KeyRelease>", self._on_try_sale_change)

        # Stok satırı
        sep = ctk.CTkFrame(price_card, height=1, fg_color=COLORS["border"])
        sep.pack(fill="x", pady=(0, 12))

        stock_row = ctk.CTkFrame(price_card, fg_color="transparent")
        stock_row.pack(fill="x", pady=(0, 4))
        for i in range(4):
            stock_row.columnconfigure(i, weight=1)

        self.stock_entry = self._grid_field(stock_row, "Stok *", "0", 0)
        self.critical_stock_entry = self._grid_field(stock_row, "Kritik Stok", "5", 1)
        self.warranty_entry = self._grid_field(stock_row, "Garanti (ay)", "24", 2)
        self.tax_entry = self._grid_field(stock_row, "KDV %", "20", 3)

        # Stok badge
        self.stock_badge = ctk.CTkLabel(
            price_card, text="● Stokta",
            font=FONTS["body_bold"], text_color=COLORS["success"])
        self.stock_badge.pack(anchor="w", pady=(4, 0))
        self.stock_entry.bind("<KeyRelease>", lambda e: self._update_stock_badge())

        # ═══════════════════════════════════════════════
        # BÖLÜM 4: Durum & Ayarlar (tek satır)
        # ═══════════════════════════════════════════════
        status_card = self._card("Durum & Ayarlar")

        status_row = ctk.CTkFrame(status_card, fg_color="transparent")
        status_row.pack(fill="x")

        self.is_active_var = ctk.BooleanVar(value=True)
        ctk.CTkSwitch(
            status_row, text="Aktif", variable=self.is_active_var,
            font=FONTS["body"], onvalue=True, offvalue=False,
            progress_color=COLORS["accent"], **SWITCH_COLORS,
        ).pack(side="left", padx=(0, 24))

        self.is_featured_var = ctk.BooleanVar(value=False)
        ctk.CTkSwitch(
            status_row, text="One Cikan", variable=self.is_featured_var,
            font=FONTS["body"], onvalue=True, offvalue=False,
            progress_color=COLORS["warning"], **SWITCH_COLORS,
        ).pack(side="left", padx=(0, 24))

        self.is_trending_var = ctk.BooleanVar(value=False)
        ctk.CTkSwitch(
            status_row, text="Trend", variable=self.is_trending_var,
            font=FONTS["body"], onvalue=True, offvalue=False,
            progress_color=COLORS["success"], **SWITCH_COLORS,
        ).pack(side="left", padx=(0, 24))

        # Kargo tipi
        self.shipping_var = ctk.StringVar(value="kargo")
        ship_f = ctk.CTkFrame(status_row, fg_color="transparent")
        ship_f.pack(side="left")
        ctk.CTkLabel(ship_f, text="Teslimat:", font=FONTS["small"],
                     text_color=COLORS["text_muted"]).pack(side="left", padx=(0, 6))
        ctk.CTkOptionMenu(
            ship_f, values=["kargo", "kurulum"],
            variable=self.shipping_var, width=100, height=28,
            font=FONTS["small"], fg_color=COLORS["bg_input"],
            button_color=COLORS["border_light"], **DROPDOWN_COLORS,
        ).pack(side="left")

        # ═══════════════════════════════════════════════
        # BÖLÜM 5: Kısa Açıklama
        # ═══════════════════════════════════════════════
        desc_card = self._card("Kisa Aciklama")

        self.short_desc_entry = ctk.CTkTextbox(
            desc_card, height=70, font=FONTS["body"],
            fg_color=COLORS["bg_input"], corner_radius=8,
            border_width=1, border_color=COLORS["border"],
            text_color=COLORS["text_primary"])
        self.short_desc_entry.pack(fill="x")

        # ═══════════════════════════════════════════════
        # BÖLÜM 6: Sekmeler (Açıklama / Specs / SEO)
        # ═══════════════════════════════════════════════
        tab_frame = ctk.CTkFrame(self, fg_color="transparent")
        tab_frame.pack(fill="x", pady=(20, 0))

        self.active_tab = ctk.StringVar(value="desc")
        self.tab_buttons = {}

        for key, label in [("desc", "Urun Aciklamasi"), ("specs", "Teknik Ozellikler"), ("seo", "SEO")]:
            btn = ctk.CTkButton(
                tab_frame, text=label, height=38, font=FONTS["h4"],
                fg_color=COLORS["bg_card"] if key == "desc" else "transparent",
                hover_color=COLORS["bg_card"],
                text_color=COLORS["accent_light"] if key == "desc" else COLORS["text_secondary"],
                corner_radius=0, command=lambda k=key: self._switch_tab(k)
            )
            btn.pack(side="left", padx=(0, 2))
            self.tab_buttons[key] = btn

        ctk.CTkFrame(self, height=2, fg_color=COLORS["accent"]).pack(fill="x")

        # Tab içerikleri
        self.tab_contents = {}

        # Açıklama tab
        desc_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=0)
        desc_frame.pack(fill="x")
        self.desc_entry = ctk.CTkTextbox(
            desc_frame, height=200, font=FONTS["body"],
            fg_color=COLORS["bg_card"], text_color=COLORS["text_primary"])
        self.desc_entry.pack(fill="x", padx=16, pady=16)
        self.tab_contents["desc"] = desc_frame

        # Specs tab
        specs_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=0)
        self.spec_editor = SpecEditor(specs_frame)
        self.spec_editor.pack(fill="x", padx=16, pady=16)
        self.tab_contents["specs"] = specs_frame

        # SEO tab
        seo_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=0)
        seo_inner = ctk.CTkFrame(seo_frame, fg_color="transparent")
        seo_inner.pack(fill="x", padx=16, pady=16)

        self._field_label(seo_inner, "SEO BASLIK")
        ctk.CTkLabel(seo_inner, text="Google sonuclarinda gorunecek baslik. 50-60 karakter ideal.",
                     font=FONTS["tiny"], text_color=COLORS["text_muted"]).pack(anchor="w", pady=(0, 4))
        seo_title_row = ctk.CTkFrame(seo_inner, fg_color="transparent")
        seo_title_row.pack(fill="x", pady=(0, 14))
        self.seo_title_entry = ctk.CTkEntry(
            seo_title_row, height=36, font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Ornek: Hikvision DS-2CD2143 4MP IP Kamera")
        self.seo_title_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.seo_title_count = ctk.CTkLabel(
            seo_title_row, text="0/60", font=FONTS["small"],
            text_color=COLORS["text_muted"])
        self.seo_title_count.pack(side="right")
        self.seo_title_entry.bind("<KeyRelease>", lambda e: self._update_seo_count())

        self._field_label(seo_inner, "META DESCRIPTION")
        ctk.CTkLabel(seo_inner, text="Basligin altinda gosterilir. 150-160 karakter ideal.",
                     font=FONTS["tiny"], text_color=COLORS["text_muted"]).pack(anchor="w", pady=(0, 4))
        seo_desc_row = ctk.CTkFrame(seo_inner, fg_color="transparent")
        seo_desc_row.pack(fill="x")
        self.seo_desc_entry = ctk.CTkEntry(
            seo_desc_row, height=36, font=FONTS["body"],
            fg_color=COLORS["bg_input"], border_color=COLORS["border"],
            placeholder_text="Ornek: En uygun fiyatla 4MP IP kamera. Ucretsiz kargo...")
        self.seo_desc_entry.pack(side="left", fill="x", expand=True, padx=(0, 8))
        self.seo_desc_count = ctk.CTkLabel(
            seo_desc_row, text="0/160", font=FONTS["small"],
            text_color=COLORS["text_muted"])
        self.seo_desc_count.pack(side="right")
        self.seo_desc_entry.bind("<KeyRelease>", lambda e: self._update_seo_count())

        self.tab_contents["seo"] = seo_frame

        # Başlangıçta sadece desc tab görünür
        self.tab_contents["specs"].pack_forget()
        self.tab_contents["seo"].pack_forget()

        # ═══════════════════════════════════════════════
        # BÖLÜM 7: Aksiyon butonları
        # ═══════════════════════════════════════════════
        btn_bar = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=12,
                                border_width=1, border_color=COLORS["border"])
        btn_bar.pack(fill="x", pady=(24, 10))

        btn_inner = ctk.CTkFrame(btn_bar, fg_color="transparent")
        btn_inner.pack(padx=16, pady=14)

        self.save_btn = ctk.CTkButton(
            btn_inner, text="Kaydet", width=140, height=46,
            font=FONTS["h3"], fg_color=COLORS["success"], hover_color=COLORS["success_hover"],
            corner_radius=10, command=self._save
        )
        self.save_btn.pack(side="left", padx=(0, 12))

        ctk.CTkButton(
            btn_inner, text="Onizle", width=110, height=46,
            font=FONTS["h4"], fg_color=COLORS["purple"], hover_color="#7c3aed",
            corner_radius=10, command=self._preview
        ).pack(side="left", padx=(0, 12))

        ctk.CTkButton(
            btn_inner, text="Kopyala", width=100, height=46,
            font=FONTS["h4"], fg_color=COLORS["info"], hover_color=COLORS["info_hover"],
            corner_radius=10, command=self._duplicate
        ).pack(side="left", padx=(0, 12))

        ctk.CTkButton(
            btn_inner, text="Temizle", width=100, height=46,
            font=FONTS["h4"], fg_color=COLORS["bg_input"], hover_color=COLORS["border_light"],
            corner_radius=10, command=self.clear_form
        ).pack(side="left")

    # ─── HELPERS ─────────────────────────────────────

    def _card(self, title: str) -> ctk.CTkFrame:
        """Başlıklı kart bölümü oluştur."""
        ctk.CTkLabel(self, text=title, font=FONTS["h3"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(20, 8))
        card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=12,
                            border_width=1, border_color=COLORS["border"])
        card.pack(fill="x")
        # İç padding frame
        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="x", padx=20, pady=16)
        return inner

    def _field_label(self, parent, text: str):
        """Küçük label."""
        ctk.CTkLabel(parent, text=text, font=FONTS["small"],
                     text_color=COLORS["text_muted"]).pack(anchor="w", pady=(0, 2))

    def _grid_field(self, parent, label: str, default: str, col: int) -> ctk.CTkEntry:
        """Grid layout'ta alan oluştur."""
        frame = ctk.CTkFrame(parent, fg_color="transparent")
        padx_l = 0 if col == 0 else 6
        padx_r = 0 if col == 3 else 6
        frame.grid(row=0, column=col, sticky="ew", padx=(padx_l, padx_r))
        ctk.CTkLabel(frame, text=label, font=FONTS["tiny"],
                     text_color=COLORS["text_muted"]).pack(anchor="w")
        entry = ctk.CTkEntry(frame, height=36, font=FONTS["body"],
                              fg_color=COLORS["bg_input"], border_color=COLORS["border"])
        entry.pack(fill="x")
        if default:
            entry.insert(0, default)
        return entry

    def _switch_tab(self, key: str):
        self.active_tab.set(key)
        for k, frame in self.tab_contents.items():
            frame.pack_forget()
        for k, frame in self.tab_contents.items():
            if k == key:
                frame.pack(fill="x")
        for k, btn in self.tab_buttons.items():
            if k == key:
                btn.configure(fg_color=COLORS["bg_card"], text_color=COLORS["accent_light"])
            else:
                btn.configure(fg_color="transparent", text_color=COLORS["text_secondary"])

    def _auto_slug(self, event=None):
        name = self.name_entry.get()
        slug = slugify(name)
        self.slug_entry.delete(0, "end")
        self.slug_entry.insert(0, slug)
        # SKU otomatik: slug'dan oluştur (ör: hikvision-ds-2cd → HIK-DS2CD)
        if not self.editing_id:
            sku = slug.upper().replace("-", "")[:12]
            self.sku_entry.delete(0, "end")
            self.sku_entry.insert(0, sku)

    def _calc_discount(self):
        price = safe_float(self.price_entry.get())
        sale = safe_float(self.sale_price_entry.get())
        if price > 0 and sale > 0 and sale < price:
            pct = round((1 - sale / price) * 100)
            self.discount_label.configure(text=f"%{pct} Indirim", text_color=COLORS["success"])
        else:
            self.discount_label.configure(text="")

    def _refresh_rate(self):
        self._exchange_rate = get_exchange_rate()
        self.rate_label.configure(text=f"$1 = {self._exchange_rate:.2f} TL")

    def _set_entry_value(self, entry, value: str):
        self._auto_convert = False
        entry.delete(0, "end")
        entry.insert(0, value)
        self._auto_convert = True

    def _on_usd_price_change(self, event=None):
        if not self._auto_convert:
            return
        usd = safe_float(self.price_usd_entry.get())
        if usd > 0:
            try_val = round(usd * self._exchange_rate, 2)
            self._set_entry_value(self.price_entry, str(try_val))
        self._calc_discount()

    def _on_usd_sale_change(self, event=None):
        if not self._auto_convert:
            return
        usd = safe_float(self.sale_price_usd_entry.get())
        if usd > 0:
            try_val = round(usd * self._exchange_rate, 2)
            self._set_entry_value(self.sale_price_entry, str(try_val))
        self._calc_discount()

    def _on_try_price_change(self, event=None):
        if not self._auto_convert:
            return
        try_val = safe_float(self.price_entry.get())
        if try_val > 0 and self._exchange_rate > 0:
            usd = round(try_val / self._exchange_rate, 2)
            self._set_entry_value(self.price_usd_entry, str(usd))
        self._calc_discount()

    def _on_try_sale_change(self, event=None):
        if not self._auto_convert:
            return
        try_val = safe_float(self.sale_price_entry.get())
        if try_val > 0 and self._exchange_rate > 0:
            usd = round(try_val / self._exchange_rate, 2)
            self._set_entry_value(self.sale_price_usd_entry, str(usd))
        self._calc_discount()

    def _update_stock_badge(self):
        stock = safe_int(self.stock_entry.get())
        critical = safe_int(self.critical_stock_entry.get(), 5)
        if stock <= 0:
            self.stock_badge.configure(text="● Tukendi", text_color=COLORS["danger"])
        elif stock <= critical:
            self.stock_badge.configure(text=f"● Son {stock} adet!", text_color=COLORS["warning"])
        else:
            self.stock_badge.configure(text="● Stokta", text_color=COLORS["success"])

    def _update_seo_count(self):
        t_len = len(self.seo_title_entry.get())
        d_len = len(self.seo_desc_entry.get())
        t_color = COLORS["danger"] if t_len > 60 else COLORS["success"] if t_len > 0 else COLORS["text_muted"]
        d_color = COLORS["danger"] if d_len > 160 else COLORS["success"] if d_len > 0 else COLORS["text_muted"]
        self.seo_title_count.configure(text=f"{t_len}/60", text_color=t_color)
        self.seo_desc_count.configure(text=f"{d_len}/160", text_color=d_color)

    # ─── DATA ────────────────────────────────────────

    def _get_category_id(self) -> str | None:
        name = self.category_var.get()
        for c in self.categories:
            if c["name"] == name:
                return c["id"]
        return None

    def _get_brand_id(self) -> str | None:
        name = self.brand_var.get()
        for b in self.brands:
            if b["name"] == name:
                return b["id"]
        return None

    def _collect_data(self) -> dict:
        slug = self.slug_entry.get().strip()
        sku = self.sku_entry.get().strip()
        # SKU boşsa slug'dan otomatik oluştur
        if not sku:
            sku = slug.upper().replace("-", "")[:12]

        return {
            "name": self.name_entry.get().strip(),
            "sku": sku,
            "slug": slug,
            "category_id": self._get_category_id(),
            "brand_id": self._get_brand_id(),
            "price": safe_float(self.price_entry.get()),
            "sale_price": safe_float(self.sale_price_entry.get()) or None,
            "price_usd": safe_float(self.price_usd_entry.get()),
            "sale_price_usd": safe_float(self.sale_price_usd_entry.get()) or None,
            "stock": safe_int(self.stock_entry.get()),
            "critical_stock": safe_int(self.critical_stock_entry.get(), 5),
            "tax_rate": safe_float(self.tax_entry.get(), 20),
            "warranty_months": safe_int(self.warranty_entry.get(), 24),
            "shipping_type": self.shipping_var.get(),
            "is_active": self.is_active_var.get(),
            "is_featured": self.is_featured_var.get(),
            "is_trending": self.is_trending_var.get(),
            "short_desc": self.short_desc_entry.get("1.0", "end").strip(),
            "description": self.desc_entry.get("1.0", "end").strip(),
            "specs": self.spec_editor.get_specs(),
            "seo_title": self.seo_title_entry.get().strip(),
            "seo_desc": self.seo_desc_entry.get().strip(),
        }

    def _validate(self, data: dict) -> list[str]:
        errors = []
        if not data["name"]:
            errors.append("Urun adi zorunlu")
        if data["sku"] and not self.sb.check_sku_unique(data["sku"], exclude_id=self.editing_id):
            errors.append(f"Bu SKU zaten kullaniliyor: {data['sku']}")
        if not data["category_id"]:
            errors.append("Kategori secilmeli")
        if not data["brand_id"]:
            errors.append("Marka secilmeli")
        if data["price"] <= 0:
            errors.append("Fiyat TRY 0'dan buyuk olmali")
        if data["price_usd"] <= 0:
            errors.append("Fiyat USD 0'dan buyuk olmali")
        if data["stock"] < 0:
            errors.append("Stok negatif olamaz")
        if data.get("sale_price") and data["sale_price"] >= data["price"]:
            errors.append("Indirimli fiyat normal fiyattan dusuk olmali")
        if data.get("sale_price_usd") and data["sale_price_usd"] >= data["price_usd"]:
            errors.append("Indirimli USD fiyat normal USD fiyattan dusuk olmali")
        return errors

    # ─── ACTIONS ─────────────────────────────────────

    def _preview(self):
        data = self._collect_data()
        cat_name = self.category_var.get()
        brand_name = self.brand_var.get()
        data["_preview_images"] = self.image_manager.get_existing_urls() + self.image_manager.get_local_paths()
        open_preview(data, cat_name, brand_name)

    def _save(self):
        data = self._collect_data()
        errors = self._validate(data)
        if errors:
            messagebox.showerror("Dogrulama Hatasi", "\n".join(errors))
            return

        action = "guncelle" if self.editing_id else "ekle"
        msg = f"'{data['name']}' urunu {'guncellenecek' if self.editing_id else 'eklenecek'}.\n\n"
        msg += f"Fiyat: {data['price']} TRY / {data['price_usd']} USD\n"
        msg += f"Stok: {data['stock']}\n"
        msg += f"Kategori: {self.category_var.get()}\n"
        msg += f"Marka: {self.brand_var.get()}\n"
        msg += f"\nDevam etmek istiyor musunuz?"

        if not messagebox.askyesno("Kayit Onay", msg):
            return

        self.save_btn.configure(state="disabled", text="Kaydediliyor...")
        self.update_idletasks()

        def do_save():
            try:
                local_paths = self.image_manager.get_local_paths()
                existing_urls = self.image_manager.get_existing_urls()
                all_urls = list(existing_urls)
                img_errors = []

                for idx, path in enumerate(local_paths):
                    try:
                        storage_path = f"{data['slug']}/{idx + len(existing_urls) + 1}.jpg"
                        url = self.sb.upload_image(path, storage_path)
                        all_urls.append(url)
                    except Exception:
                        try:
                            b64 = self.sb.upload_image_base64(path)
                            all_urls.append(b64)
                        except Exception as img_e:
                            img_errors.append(f"Gorsel {idx+1}: {img_e}")

                data["images"] = all_urls

                if self.editing_id:
                    self.sb.update_product(self.editing_id, data)
                    msg = f"Urun guncellendi: {data['name']}"
                else:
                    result = self.sb.create_product(data)
                    self.editing_id = result.get("id")
                    msg = f"Urun eklendi: {data['name']}"

                if img_errors:
                    msg += f"\n\nUyari: {len(img_errors)} gorsel yuklenemedi:\n" + "\n".join(img_errors)

                self.after(0, lambda: self._on_save_success(msg))
            except Exception as e:
                self.after(0, lambda: self._on_save_error(str(e)))

        threading.Thread(target=do_save, daemon=True).start()

    def _on_save_success(self, msg: str):
        self.save_btn.configure(state="normal", text="Kaydet")
        messagebox.showinfo("Basarili", msg)
        if self.on_saved:
            self.on_saved()

    def _on_save_error(self, error: str):
        self.save_btn.configure(state="normal", text="Kaydet")
        messagebox.showerror("Kayit Hatasi", f"Hata: {error}")

    def _duplicate(self):
        self.editing_id = None
        name = self.name_entry.get()
        self.name_entry.delete(0, "end")
        self.name_entry.insert(0, f"{name} (Kopya)")
        self.sku_entry.delete(0, "end")
        self._auto_slug()
        messagebox.showinfo("Kopyalandi", "Urun kopyalandi. SKU girip kaydedin.")

    # ─── LOAD / CLEAR ───────────────────────────────

    def load_product(self, product: dict, is_copy: bool = False):
        self.clear_form()
        if is_copy:
            self.editing_id = None
        else:
            self.editing_id = product.get("id")

        name = product.get("name", "")
        if is_copy:
            name = f"{name} (Kopya)"
        self.name_entry.insert(0, name)

        if is_copy:
            self.sku_entry.insert(0, "")
        else:
            self.sku_entry.insert(0, product.get("sku", ""))
        self._auto_slug()

        cat = product.get("categories") or {}
        if cat:
            self.category_var.set(cat.get("name", ""))
        elif product.get("category_id"):
            for c in self.categories:
                if c["id"] == product["category_id"]:
                    self.category_var.set(c["name"])
                    break

        brand = product.get("brands") or {}
        if brand:
            self.brand_var.set(brand.get("name", ""))
        elif product.get("brand_id"):
            for b in self.brands:
                if b["id"] == product["brand_id"]:
                    self.brand_var.set(b["name"])
                    break

        self.is_active_var.set(product.get("is_active", True))
        self.is_featured_var.set(product.get("is_featured", False))
        self.is_trending_var.set(product.get("is_trending", False))
        self.shipping_var.set(product.get("shipping_type", "kargo"))

        self.price_entry.delete(0, "end")
        self.price_entry.insert(0, str(product.get("price", "")))
        if product.get("sale_price"):
            self.sale_price_entry.delete(0, "end")
            self.sale_price_entry.insert(0, str(product["sale_price"]))
        self.price_usd_entry.delete(0, "end")
        self.price_usd_entry.insert(0, str(product.get("price_usd", "")))
        if product.get("sale_price_usd"):
            self.sale_price_usd_entry.delete(0, "end")
            self.sale_price_usd_entry.insert(0, str(product["sale_price_usd"]))

        self.tax_entry.delete(0, "end")
        self.tax_entry.insert(0, str(product.get("tax_rate", 20)))
        self.warranty_entry.delete(0, "end")
        self.warranty_entry.insert(0, str(product.get("warranty_months", 24)))

        self.stock_entry.delete(0, "end")
        self.stock_entry.insert(0, str(product.get("stock", 0)))
        self.critical_stock_entry.delete(0, "end")
        self.critical_stock_entry.insert(0, str(product.get("critical_stock", 5)))

        self.short_desc_entry.insert("1.0", product.get("short_desc", ""))
        self.desc_entry.insert("1.0", product.get("description", ""))
        self.spec_editor.set_specs(product.get("specs", {}))

        if not is_copy:
            self.image_manager.set_images(product.get("images", []))

        self.seo_title_entry.insert(0, product.get("seo_title", ""))
        self.seo_desc_entry.insert(0, product.get("seo_desc", ""))
        self._update_seo_count()
        self._calc_discount()
        self._update_stock_badge()

    def clear_form(self):
        self.editing_id = None
        for entry in [self.name_entry, self.sku_entry, self.price_entry,
                      self.sale_price_entry, self.price_usd_entry,
                      self.sale_price_usd_entry, self.seo_title_entry, self.seo_desc_entry]:
            entry.delete(0, "end")

        self.slug_entry.delete(0, "end")

        self.tax_entry.delete(0, "end")
        self.tax_entry.insert(0, "20")
        self.warranty_entry.delete(0, "end")
        self.warranty_entry.insert(0, "24")
        self.stock_entry.delete(0, "end")
        self.stock_entry.insert(0, "0")
        self.critical_stock_entry.delete(0, "end")
        self.critical_stock_entry.insert(0, "5")

        self.price_entry.insert(0, "0")
        self.price_usd_entry.insert(0, "0")

        self.is_active_var.set(True)
        self.is_featured_var.set(False)
        self.is_trending_var.set(False)
        self.shipping_var.set("kargo")

        self.short_desc_entry.delete("1.0", "end")
        self.desc_entry.delete("1.0", "end")

        self.spec_editor.clear()
        self.image_manager.clear()
        self._update_seo_count()
        self.discount_label.configure(text="")
        self.stock_badge.configure(text="● Stokta", text_color=COLORS["success"])

    def refresh_dropdowns(self, categories: list[dict], brands: list[dict]):
        """Kategori ve marka dropdown'larini gunceller."""
        self.categories = categories
        self.brands = brands
        cat_names = [c["name"] for c in categories]
        brand_names = [b["name"] for b in brands]
        self.category_menu.configure(values=cat_names or ["---"])
        self.brand_menu.configure(values=brand_names or ["---"])
