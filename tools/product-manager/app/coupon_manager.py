"""Kupon yönetimi: oluşturma, düzenleme, silme, kullanım takibi."""

import customtkinter as ctk
import threading
from datetime import datetime, timedelta
from tkinter import ttk, messagebox

from app.theme import (
    COLORS, FONTS, TREEVIEW_STYLE, TREEVIEW_HEADING_STYLE,
    TREEVIEW_MAP, apply_dark_scrollbar, bind_treeview_scroll,
)
from app.utils import format_price


class CouponManager(ctk.CTkFrame):
    """Kupon oluşturma, düzenleme ve yönetim sayfası."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, **kwargs)
        self.sb = sb_manager
        self.coupons: list[dict] = []
        self.configure(fg_color="transparent")
        self._build_ui()

    # ─────────────────────────── UI ───────────────────────────
    def _build_ui(self):
        # ─── Başlık ───
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(header, text="Kupon Yonetimi", font=FONTS["h2"],
                     text_color=COLORS["text_primary"]).pack(side="left")

        self.lbl_stats = ctk.CTkLabel(header, text="", font=FONTS["small"],
                                       text_color=COLORS["gold"])
        self.lbl_stats.pack(side="right", padx=10)

        btn_refresh = ctk.CTkButton(header, text="Yenile", width=80,
                                     fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
                                     command=self.refresh)
        btn_refresh.pack(side="right")

        # ─── Arama & Filtre ───
        filter_row = ctk.CTkFrame(self, fg_color="transparent")
        filter_row.pack(fill="x", pady=(0, 8))

        self.search_var = ctk.StringVar()
        ctk.CTkEntry(filter_row, textvariable=self.search_var, width=250,
                     placeholder_text="Kupon kodu ara...",
                     fg_color=COLORS["card_bg"], border_color=COLORS["border"],
                     text_color=COLORS["text_primary"]).pack(side="left", padx=(0, 8))
        self.search_var.trace_add("write", lambda *_: self._filter_table())

        self.filter_active = ctk.BooleanVar(value=False)
        ctk.CTkCheckBox(filter_row, text="Sadece Aktif", variable=self.filter_active,
                        command=self._filter_table,
                        text_color=COLORS["text_primary"]).pack(side="left", padx=(0, 16))

        # ─── Butonlar ───
        btn_row = ctk.CTkFrame(self, fg_color="transparent")
        btn_row.pack(fill="x", pady=(0, 8))

        ctk.CTkButton(btn_row, text="+ Yeni Kupon", width=120,
                      fg_color="#22c55e", hover_color="#16a34a",
                      command=self._new_coupon).pack(side="left", padx=(0, 6))

        ctk.CTkButton(btn_row, text="Duzenle", width=100,
                      fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
                      command=self._edit_coupon).pack(side="left", padx=(0, 6))

        ctk.CTkButton(btn_row, text="Aktif/Pasif", width=100,
                      fg_color="#f59e0b", hover_color="#d97706",
                      command=self._toggle_active).pack(side="left", padx=(0, 6))

        ctk.CTkButton(btn_row, text="Sil", width=80,
                      fg_color="#ef4444", hover_color="#dc2626",
                      command=self._delete_coupon).pack(side="left")

        # ─── Tablo ───
        cols = ("code", "type", "value", "min_cart", "max_uses", "used", "active", "expiry")
        col_widths = {"code": 140, "type": 80, "value": 80, "min_cart": 100,
                      "max_uses": 80, "used": 80, "active": 70, "expiry": 120}
        col_names = {"code": "Kupon Kodu", "type": "Tür", "value": "Değer",
                     "min_cart": "Min Sepet", "max_uses": "Max Kull.",
                     "used": "Kullanılan", "active": "Durum", "expiry": "Bitiş Tarihi"}

        tree_frame = ctk.CTkFrame(self, fg_color=COLORS["card_bg"],
                                   corner_radius=8, border_width=1,
                                   border_color=COLORS["border"])
        tree_frame.pack(fill="both", expand=True, pady=(0, 8))

        style = ttk.Style()
        style.configure("Coupon.Treeview", **TREEVIEW_STYLE)
        style.configure("Coupon.Treeview.Heading", **TREEVIEW_HEADING_STYLE)
        style.map("Coupon.Treeview", **TREEVIEW_MAP)

        self.tree = ttk.Treeview(tree_frame, columns=cols, show="headings",
                                  style="Coupon.Treeview", selectmode="browse")

        for c in cols:
            self.tree.heading(c, text=col_names[c])
            self.tree.column(c, width=col_widths.get(c, 100), anchor="center")
        self.tree.column("code", anchor="w")

        vsb = ctk.CTkScrollbar(tree_frame, command=self.tree.yview)
        self.tree.configure(yscrollcommand=vsb.set)
        self.tree.pack(side="left", fill="both", expand=True)
        vsb.pack(side="right", fill="y")
        apply_dark_scrollbar(self.tree, vsb)
        bind_treeview_scroll(self.tree)

    # ─────────────────────────── DATA ───────────────────────────
    def refresh(self):
        """Kuponları DB'den çek."""
        threading.Thread(target=self._load, daemon=True).start()

    def _load(self):
        try:
            data = self.sb.supabase.table("coupons").select("*").order("created_at", desc=True).execute()
            self.coupons = data.data or []
            self.after(0, self._render_table)
        except Exception as e:
            self.after(0, lambda: messagebox.showerror("Hata", f"Kuponlar yuklenemedi:\n{e}"))

    def _render_table(self, filtered=None):
        self.tree.delete(*self.tree.get_children())
        items = filtered if filtered is not None else self.coupons
        active_count = sum(1 for c in items if c.get("active"))

        for c in items:
            code = c.get("code", "")
            ctype = "Yüzde" if c.get("type") == "percent" else "Tutar"
            value = f"%{c.get('value', 0)}" if c.get("type") == "percent" else format_price(c.get("value", 0))
            min_cart = format_price(c.get("min_cart", 0))
            max_uses = str(c.get("max_uses", "∞")) if c.get("max_uses") else "∞"
            used = str(c.get("used_count", 0))
            active = "✅ Aktif" if c.get("active") else "❌ Pasif"
            expiry = c.get("expiry", "-") or "-"
            if expiry != "-":
                try:
                    expiry = datetime.fromisoformat(expiry.replace("Z", "+00:00")).strftime("%d.%m.%Y")
                except Exception:
                    pass

            self.tree.insert("", "end", iid=c.get("id", code), values=(
                code, ctype, value, min_cart, max_uses, used, active, expiry
            ))

        self.lbl_stats.configure(text=f"Toplam: {len(items)}  |  Aktif: {active_count}")

    def _filter_table(self, *_):
        q = self.search_var.get().strip().lower()
        only_active = self.filter_active.get()
        filtered = self.coupons
        if q:
            filtered = [c for c in filtered if q in (c.get("code", "") or "").lower()]
        if only_active:
            filtered = [c for c in filtered if c.get("active")]
        self._render_table(filtered)

    def _get_selected(self) -> dict | None:
        sel = self.tree.selection()
        if not sel:
            messagebox.showwarning("Uyari", "Bir kupon secin.")
            return None
        cid = sel[0]
        return next((c for c in self.coupons if c.get("id") == cid), None)

    # ─────────────────────────── CRUD ───────────────────────────
    def _new_coupon(self):
        self._show_form()

    def _edit_coupon(self):
        c = self._get_selected()
        if c:
            self._show_form(c)

    def _show_form(self, existing: dict | None = None):
        """Kupon oluşturma/düzenleme popup'ı."""
        win = ctk.CTkToplevel(self)
        win.title("Kupon Duzenle" if existing else "Yeni Kupon")
        win.geometry("420x520")
        win.resizable(False, False)
        win.grab_set()
        win.configure(fg_color=COLORS["bg"])

        pad = {"padx": 12, "pady": (4, 0)}

        ctk.CTkLabel(win, text="Kupon Kodu:", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        code_var = ctk.StringVar(value=existing.get("code", "") if existing else "")
        ctk.CTkEntry(win, textvariable=code_var, fg_color=COLORS["card_bg"],
                     border_color=COLORS["border"], text_color=COLORS["text_primary"]).pack(fill="x", padx=12, pady=(2, 0))

        ctk.CTkLabel(win, text="Tür:", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        type_var = ctk.StringVar(value=existing.get("type", "percent") if existing else "percent")
        ctk.CTkSegmentedButton(win, values=["percent", "fixed"],
                                variable=type_var,
                                fg_color=COLORS["card_bg"],
                                selected_color=COLORS["accent"]).pack(fill="x", padx=12, pady=(2, 0))

        ctk.CTkLabel(win, text="Değer (% veya ₺):", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        value_var = ctk.StringVar(value=str(existing.get("value", "")) if existing else "")
        ctk.CTkEntry(win, textvariable=value_var, fg_color=COLORS["card_bg"],
                     border_color=COLORS["border"], text_color=COLORS["text_primary"]).pack(fill="x", padx=12, pady=(2, 0))

        ctk.CTkLabel(win, text="Minimum Sepet Tutarı (₺):", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        min_cart_var = ctk.StringVar(value=str(existing.get("min_cart", 0)) if existing else "0")
        ctk.CTkEntry(win, textvariable=min_cart_var, fg_color=COLORS["card_bg"],
                     border_color=COLORS["border"], text_color=COLORS["text_primary"]).pack(fill="x", padx=12, pady=(2, 0))

        ctk.CTkLabel(win, text="Maksimum Kullanım (boş = sınırsız):", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        max_uses_var = ctk.StringVar(value=str(existing.get("max_uses", "")) if existing and existing.get("max_uses") else "")
        ctk.CTkEntry(win, textvariable=max_uses_var, fg_color=COLORS["card_bg"],
                     border_color=COLORS["border"], text_color=COLORS["text_primary"]).pack(fill="x", padx=12, pady=(2, 0))

        ctk.CTkLabel(win, text="Bitiş Tarihi (YYYY-MM-DD, boş = süresiz):", font=FONTS["small"],
                     text_color=COLORS["text_secondary"]).pack(anchor="w", **pad)
        expiry_val = ""
        if existing and existing.get("expiry"):
            try:
                expiry_val = datetime.fromisoformat(existing["expiry"].replace("Z", "+00:00")).strftime("%Y-%m-%d")
            except Exception:
                expiry_val = existing["expiry"][:10] if existing.get("expiry") else ""
        expiry_var = ctk.StringVar(value=expiry_val)
        ctk.CTkEntry(win, textvariable=expiry_var, fg_color=COLORS["card_bg"],
                     border_color=COLORS["border"], text_color=COLORS["text_primary"]).pack(fill="x", padx=12, pady=(2, 0))

        active_var = ctk.BooleanVar(value=existing.get("active", True) if existing else True)
        ctk.CTkCheckBox(win, text="Aktif", variable=active_var,
                        text_color=COLORS["text_primary"]).pack(anchor="w", padx=12, pady=(12, 0))

        def save():
            code = code_var.get().strip().upper()
            if not code:
                messagebox.showwarning("Uyari", "Kupon kodu bos olamaz.")
                return
            try:
                val = float(value_var.get())
            except ValueError:
                messagebox.showwarning("Uyari", "Gecersiz deger.")
                return

            payload = {
                "code": code,
                "type": type_var.get(),
                "value": val,
                "min_cart": float(min_cart_var.get() or 0),
                "max_uses": int(max_uses_var.get()) if max_uses_var.get().strip() else None,
                "expiry": expiry_var.get().strip() or None,
                "active": active_var.get(),
            }

            try:
                if existing:
                    self.sb.supabase.table("coupons").update(payload).eq("id", existing["id"]).execute()
                    messagebox.showinfo("Basarili", f"Kupon {code} guncellendi.")
                else:
                    payload["used_count"] = 0
                    self.sb.supabase.table("coupons").insert(payload).execute()
                    messagebox.showinfo("Basarili", f"Kupon {code} olusturuldu.")
                win.destroy()
                self.refresh()
            except Exception as e:
                messagebox.showerror("Hata", str(e))

        ctk.CTkButton(win, text="Kaydet", fg_color="#22c55e", hover_color="#16a34a",
                      font=FONTS["button"], command=save).pack(fill="x", padx=12, pady=(20, 8))

    def _toggle_active(self):
        c = self._get_selected()
        if not c:
            return
        new_active = not c.get("active", True)
        try:
            self.sb.supabase.table("coupons").update({"active": new_active}).eq("id", c["id"]).execute()
            messagebox.showinfo("Basarili", f"{c['code']} {'aktif' if new_active else 'pasif'} yapildi.")
            self.refresh()
        except Exception as e:
            messagebox.showerror("Hata", str(e))

    def _delete_coupon(self):
        c = self._get_selected()
        if not c:
            return
        if not messagebox.askyesno("Onay", f"{c['code']} kuponunu silmek istiyor musunuz?"):
            return
        try:
            self.sb.supabase.table("coupons").delete().eq("id", c["id"]).execute()
            messagebox.showinfo("Basarili", f"{c['code']} silindi.")
            self.refresh()
        except Exception as e:
            messagebox.showerror("Hata", str(e))
