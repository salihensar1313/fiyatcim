"""CSV dışa aktarma + JSON yedekleme/geri yükleme."""

import csv
import json
import os
from tkinter import filedialog, messagebox
from datetime import datetime

import customtkinter as ctk

from app.theme import COLORS, FONTS, SPACING
from app.version import APP_VERSION


def _csv_safe(value) -> str:
    """CSV injection koruması — hücre değeri =, +, -, @ ile başlıyorsa önüne ' ekler."""
    s = str(value) if value is not None else ""
    if s and s[0] in ('=', '+', '-', '@', '\t', '\r'):
        return f"'{s}"
    return s


class CsvExport(ctk.CTkScrollableFrame):
    """CSV / Yedekleme sayfası."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.configure(fg_color="transparent")
        self._build_ui()

    def _build_ui(self):
        ctk.CTkLabel(self, text="CSV / Yedekleme", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 16))

        # ─── CSV Bölümü ──────────────────────
        self._section_label("CSV Disa Aktarma")

        self._action_card(
            title="Urun Listesi",
            desc="Tum urunleri CSV olarak indir (ad, SKU, kategori, marka, fiyat, stok, durum)",
            btn_text="Urun CSV Indir", btn_color=COLORS["info"],
            btn_hover=COLORS["info_hover"], command=self._export_products,
        )

        self._action_card(
            title="Stok Raporu",
            desc="Stok durumu raporu (ad, SKU, stok, kritik esik, durum)",
            btn_text="Stok CSV Indir", btn_color=COLORS["success"],
            btn_hover=COLORS["success_hover"], command=self._export_stock,
        )

        card3 = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                              border_width=1, border_color=COLORS["border"])
        card3.pack(fill="x", pady=(0, 12))
        inner3 = ctk.CTkFrame(card3, fg_color="transparent")
        inner3.pack(fill="x", padx=16, pady=14)
        ctk.CTkLabel(inner3, text="Kategori & Marka", font=FONTS["h4"],
                     text_color=COLORS["text_primary"]).pack(anchor="w")
        row = ctk.CTkFrame(inner3, fg_color="transparent")
        row.pack(fill="x", pady=(8, 0))
        ctk.CTkButton(
            row, text="Kategoriler CSV", width=150, height=36,
            fg_color=COLORS["purple"], hover_color="#7c3aed",
            font=FONTS["body"], command=self._export_categories
        ).pack(side="left", padx=(0, 8))
        ctk.CTkButton(
            row, text="Markalar CSV", width=150, height=36,
            fg_color=COLORS["warning"], hover_color=COLORS["warning_hover"],
            font=FONTS["body"], command=self._export_brands
        ).pack(side="left")

        # ─── JSON Yedekleme Bölümü ───────────
        self._section_label("JSON Yedekleme")

        self._action_card(
            title="Tam Yedek Al (JSON)",
            desc="Tum urunler, kategoriler ve markalar tek JSON dosyasina aktarilir.\nVeri kaybi riskine karsi duzenli yedek alin.",
            btn_text="JSON Yedek Al", btn_color=COLORS["accent"],
            btn_hover=COLORS["accent_hover"], command=self._backup_json,
        )

        self._action_card(
            title="Yedekten Yukle (JSON)",
            desc="Daha once alinan JSON yedeginden verileri geri yukler.\nDikkat: Mevcut veriler uzerine yazilmaz, sadece yeni kayitlar eklenir.",
            btn_text="JSON Yukle", btn_color=COLORS["warning"],
            btn_hover=COLORS["warning_hover"], command=self._restore_json,
        )

    def _section_label(self, text: str):
        sep = ctk.CTkFrame(self, height=1, fg_color=COLORS["border"])
        sep.pack(fill="x", pady=(8, 4))
        ctk.CTkLabel(self, text=text, font=FONTS["h3"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", pady=(4, 8))

    def _action_card(self, title, desc, btn_text, btn_color, btn_hover, command):
        card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=10,
                             border_width=1, border_color=COLORS["border"])
        card.pack(fill="x", pady=(0, 12))
        bar = ctk.CTkFrame(card, width=4, fg_color=btn_color, corner_radius=2)
        bar.pack(side="left", fill="y")
        inner = ctk.CTkFrame(card, fg_color="transparent")
        inner.pack(fill="x", padx=16, pady=14)
        ctk.CTkLabel(inner, text=title, font=FONTS["h4"],
                     text_color=COLORS["text_primary"]).pack(anchor="w")
        ctk.CTkLabel(inner, text=desc, font=FONTS["small"],
                     text_color=COLORS["text_secondary"],
                     wraplength=600, justify="left").pack(anchor="w", pady=(4, 8))
        ctk.CTkButton(
            inner, text=btn_text, width=160, height=36,
            fg_color=btn_color, hover_color=btn_hover,
            font=FONTS["body"], command=command
        ).pack(anchor="w")

    def _export_products(self):
        products = self.sb.get_products()
        if not products:
            messagebox.showinfo("Bilgi", "Aktarilacak urun yok")
            return
        path = filedialog.asksaveasfilename(
            defaultextension=".csv", filetypes=[("CSV", "*.csv")],
            initialfile=f"fiyatcim-urunler-{datetime.now().strftime('%Y%m%d')}.csv")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Ad", "SKU", "Slug", "Kategori", "Marka", "Fiyat TRY",
                           "Indirimli TRY", "Fiyat USD", "Indirimli USD", "Stok",
                           "KDV %", "Garanti (Ay)", "Kargo", "Aktif", "Kisa Aciklama",
                           "SEO Baslik", "SEO Aciklama"])
            for p in products:
                cat = (p.get("categories") or {}).get("name", "")
                brand = (p.get("brands") or {}).get("name", "")
                writer.writerow([
                    _csv_safe(p.get("name", "")), _csv_safe(p.get("sku", "")), _csv_safe(p.get("slug", "")),
                    _csv_safe(cat), _csv_safe(brand), p.get("price", 0), p.get("sale_price", ""),
                    p.get("price_usd", 0), p.get("sale_price_usd", ""),
                    p.get("stock", 0), p.get("tax_rate", 20),
                    p.get("warranty_months", 24), _csv_safe(p.get("shipping_type", "kargo")),
                    "Evet" if p.get("is_active") else "Hayir",
                    _csv_safe(p.get("short_desc", "")), _csv_safe(p.get("seo_title", "")), _csv_safe(p.get("seo_desc", ""))
                ])
        messagebox.showinfo("Basarili", f"{len(products)} urun CSV'ye aktarildi:\n{path}")

    def _export_stock(self):
        products = self.sb.get_products()
        path = filedialog.asksaveasfilename(
            defaultextension=".csv", filetypes=[("CSV", "*.csv")],
            initialfile=f"fiyatcim-stok-{datetime.now().strftime('%Y%m%d')}.csv")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Ad", "SKU", "Stok", "Kritik Esik", "Durum"])
            for p in products:
                stock = p.get("stock", 0)
                critical = p.get("critical_stock", 5)
                if stock <= 0:
                    status = "TUKENDI"
                elif stock <= critical:
                    status = "KRITIK"
                else:
                    status = "Normal"
                writer.writerow([p.get("name", ""), p.get("sku", ""), stock, critical, status])
        messagebox.showinfo("Basarili", f"Stok raporu CSV'ye aktarildi:\n{path}")

    def _export_categories(self):
        categories = self.sb.get_categories()
        path = filedialog.asksaveasfilename(
            defaultextension=".csv", filetypes=[("CSV", "*.csv")],
            initialfile="fiyatcim-kategoriler.csv")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Ad", "Slug", "Sira"])
            for c in categories:
                writer.writerow([c.get("name", ""), c.get("slug", ""), c.get("sort_order", 0)])
        messagebox.showinfo("Basarili", f"Kategoriler CSV'ye aktarildi:\n{path}")

    def _export_brands(self):
        brands = self.sb.get_brands()
        path = filedialog.asksaveasfilename(
            defaultextension=".csv", filetypes=[("CSV", "*.csv")],
            initialfile="fiyatcim-markalar.csv")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["Ad", "Slug"])
            for b in brands:
                writer.writerow([b.get("name", ""), b.get("slug", "")])
        messagebox.showinfo("Basarili", f"Markalar CSV'ye aktarildi:\n{path}")

    def _backup_json(self):
        try:
            products = self.sb.get_products()
            categories = self.sb.get_categories()
            brands = self.sb.get_brands()
        except Exception as e:
            messagebox.showerror("Hata", f"Veriler okunamadi: {e}")
            return
        backup = {
            "version": APP_VERSION,
            "date": datetime.now().isoformat(),
            "products": products,
            "categories": categories,
            "brands": brands,
            "counts": {"products": len(products), "categories": len(categories), "brands": len(brands)},
        }
        path = filedialog.asksaveasfilename(
            defaultextension=".json", filetypes=[("JSON", "*.json")],
            initialfile=f"fiyatcim-yedek-{datetime.now().strftime('%Y%m%d-%H%M')}.json")
        if not path:
            return
        with open(path, "w", encoding="utf-8") as f:
            json.dump(backup, f, ensure_ascii=False, indent=2)
        messagebox.showinfo("Basarili",
            f"Yedek kaydedildi:\n{path}\n\n{len(products)} urun\n{len(categories)} kategori\n{len(brands)} marka")

    def _restore_json(self):
        path = filedialog.askopenfilename(
            filetypes=[("JSON", "*.json"), ("Tum Dosyalar", "*.*")],
            title="Yedek Dosyasi Sec")
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                backup = json.load(f)
        except Exception as e:
            messagebox.showerror("Hata", f"Dosya okunamadi: {e}")
            return
        if not isinstance(backup, dict):
            messagebox.showerror("Hata", "Gecersiz yedek dosyasi formati")
            return
        products = backup.get("products", [])
        categories = backup.get("categories", [])
        brands = backup.get("brands", [])
        if not products and not categories and not brands:
            messagebox.showinfo("Bilgi", "Yedek dosyasinda veri bulunamadi")
            return
        msg = (f"Yedek dosyasi icerigi:\n\n  {len(products)} urun\n  {len(categories)} kategori\n"
               f"  {len(brands)} marka\n\nTarih: {backup.get('date', 'Bilinmiyor')}\n\n"
               f"Mevcut verilerin uzerine yazilmaz, sadece yeni kayitlar eklenir.\n"
               f"Yuklenen urunler PASIF olarak eklenir (manuel aktif etmeniz gerekir).\nDevam?")
        if not messagebox.askyesno("Yedek Yukleme Onay", msg):
            return
        added_cats = added_brands = added_prods = 0
        errors = []
        existing_cats = {c.get("slug") for c in self.sb.get_categories()}
        for cat in categories:
            slug = cat.get("slug", "")
            if slug and slug not in existing_cats:
                try:
                    clean = {k: v for k, v in cat.items() if k not in ("id", "created_at", "updated_at", "product_count")}
                    self.sb.create_category(clean)
                    added_cats += 1
                except Exception as e:
                    errors.append(f"Kategori '{cat.get('name')}': {e}")
        existing_brands = {b.get("slug") for b in self.sb.get_brands()}
        for brand in brands:
            slug = brand.get("slug", "")
            if slug and slug not in existing_brands:
                try:
                    clean = {k: v for k, v in brand.items() if k not in ("id", "created_at", "updated_at")}
                    self.sb.create_brand(clean)
                    added_brands += 1
                except Exception as e:
                    errors.append(f"Marka '{brand.get('name')}': {e}")
        existing_skus = {p.get("sku") for p in self.sb.get_products()}
        for prod in products:
            sku = prod.get("sku", "")
            if sku and sku not in existing_skus:
                try:
                    clean = {k: v for k, v in prod.items()
                             if k not in ("id", "created_at", "updated_at", "categories", "brands", "category", "brand", "reviews")}
                    clean["is_active"] = False  # Güvenlik: pasif olarak ekle
                    self.sb.create_product(clean)
                    added_prods += 1
                except Exception as e:
                    errors.append(f"Urun '{prod.get('name')}': {e}")
        result = f"Yukleme tamamlandi:\n\n  {added_cats} kategori\n  {added_brands} marka\n  {added_prods} urun eklendi"
        if errors:
            result += f"\n\n{len(errors)} hata (ilk 5):\n" + "\n".join(errors[:5])
        messagebox.showinfo("Sonuc", result)
