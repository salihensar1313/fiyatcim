"""Müşteri Yönetimi: liste, detay, premium atama, toplu mail."""

import customtkinter as ctk
from tkinter import messagebox
import threading
from datetime import datetime

from app.theme import COLORS, FONTS, SPACING


class CustomerManager(ctk.CTkFrame):
    """Müşteri yönetim sayfası — liste, premium, mail."""

    def __init__(self, master, sb_manager, **kwargs):
        super().__init__(master, fg_color="transparent", **kwargs)
        self.sb = sb_manager
        self.customers: list[dict] = []
        self.selected_ids: set[str] = []
        self._build_ui()

    # ─── UI ────────────────────────────────────────────────

    def _build_ui(self):
        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", pady=(0, 8))

        ctk.CTkLabel(
            header, text="Müşteriler",
            font=FONTS["h2"], text_color=COLORS["text_primary"]
        ).pack(side="left")

        # Stats frame
        self.stats_frame = ctk.CTkFrame(header, fg_color="transparent")
        self.stats_frame.pack(side="right")
        self.lbl_total = ctk.CTkLabel(
            self.stats_frame, text="Toplam: -",
            font=FONTS["small"], text_color=COLORS["text_muted"]
        )
        self.lbl_total.pack(side="left", padx=(0, 12))
        self.lbl_premium = ctk.CTkLabel(
            self.stats_frame, text="Premium: -",
            font=FONTS["small"], text_color=COLORS["gold"]
        )
        self.lbl_premium.pack(side="left")

        # Toolbar
        toolbar = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=8, height=44)
        toolbar.pack(fill="x", pady=(0, 8))

        self.search_var = ctk.StringVar()
        self.search_entry = ctk.CTkEntry(
            toolbar, placeholder_text="Ara (isim, email, telefon)...",
            textvariable=self.search_var, width=260, height=32,
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            border_color=COLORS["border"], corner_radius=6
        )
        self.search_entry.pack(side="left", padx=8, pady=6)
        self.search_var.trace_add("write", lambda *_: self._filter())

        self.premium_filter = ctk.CTkCheckBox(
            toolbar, text="Sadece Premium", font=FONTS["small"],
            fg_color=COLORS["gold"], hover_color=COLORS["warning"],
            text_color=COLORS["text_primary"],
            command=self._filter
        )
        self.premium_filter.pack(side="left", padx=8)

        ctk.CTkButton(
            toolbar, text="Yenile", width=80, height=30,
            font=FONTS["small"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=6,
            command=self.refresh
        ).pack(side="right", padx=8, pady=6)

        # Action buttons
        action_bar = ctk.CTkFrame(self, fg_color="transparent")
        action_bar.pack(fill="x", pady=(0, 8))

        self.btn_premium = ctk.CTkButton(
            action_bar, text="⭐ Premium Ver", width=130, height=32,
            font=FONTS["small"], fg_color=COLORS["warning"],
            hover_color=COLORS["warning_hover"], corner_radius=6,
            text_color="#000", command=self._grant_premium
        )
        self.btn_premium.pack(side="left", padx=(0, 6))

        self.btn_revoke = ctk.CTkButton(
            action_bar, text="Premium Kaldır", width=130, height=32,
            font=FONTS["small"], fg_color=COLORS["danger_muted"],
            hover_color=COLORS["danger"], corner_radius=6,
            command=self._revoke_premium
        )
        self.btn_revoke.pack(side="left", padx=(0, 6))

        self.btn_mail = ctk.CTkButton(
            action_bar, text="📧 Toplu Mail", width=120, height=32,
            font=FONTS["small"], fg_color=COLORS["info"],
            hover_color=COLORS["info_hover"], corner_radius=6,
            command=self._show_mail_dialog
        )
        self.btn_mail.pack(side="left", padx=(0, 6))

        self.btn_premium_mail = ctk.CTkButton(
            action_bar, text="🏆 Premium Teklif Mail", width=160, height=32,
            font=FONTS["small"], fg_color=COLORS["purple"],
            hover_color="#9333ea", corner_radius=6,
            command=self._send_premium_offer
        )
        self.btn_premium_mail.pack(side="left", padx=(0, 6))

        # Düzenleme / Silme / Ban butonları
        action_bar2 = ctk.CTkFrame(self, fg_color="transparent")
        action_bar2.pack(fill="x", pady=(0, 8))

        ctk.CTkButton(
            action_bar2, text="✏️ Düzenle", width=100, height=32,
            font=FONTS["small"], fg_color=COLORS["accent"],
            hover_color=COLORS["accent_hover"], corner_radius=6,
            command=self._edit_customer
        ).pack(side="left", padx=(0, 6))

        ctk.CTkButton(
            action_bar2, text="🚫 Banla", width=100, height=32,
            font=FONTS["small"], fg_color=COLORS["warning_muted"],
            hover_color=COLORS["warning"], corner_radius=6,
            command=self._ban_customer
        ).pack(side="left", padx=(0, 6))

        ctk.CTkButton(
            action_bar2, text="✅ Ban Kaldır", width=110, height=32,
            font=FONTS["small"], fg_color=COLORS["success_muted"],
            hover_color=COLORS["success"], corner_radius=6,
            command=self._unban_customer
        ).pack(side="left", padx=(0, 6))

        ctk.CTkButton(
            action_bar2, text="🗑️ Sil", width=80, height=32,
            font=FONTS["small"], fg_color=COLORS["danger"],
            hover_color=COLORS["danger_hover"], corner_radius=6,
            command=self._delete_customer
        ).pack(side="left")

        self.lbl_selected = ctk.CTkLabel(
            action_bar, text="0 seçili",
            font=FONTS["small"], text_color=COLORS["text_muted"]
        )
        self.lbl_selected.pack(side="right")

        # Table
        table_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=8)
        table_frame.pack(fill="both", expand=True)

        # Table header
        hdr = ctk.CTkFrame(table_frame, fg_color=COLORS["bg_table_header"], corner_radius=0, height=36)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)

        cols = [("", 30), ("İsim", 180), ("Email", 220), ("Telefon", 120),
                ("Premium", 80), ("Sipariş", 70), ("Kayıt", 90)]
        for text, w in cols:
            ctk.CTkLabel(
                hdr, text=text, width=w, font=FONTS["small"],
                text_color=COLORS["text_muted"], anchor="w"
            ).pack(side="left", padx=4)

        # Scrollable rows
        self.rows_frame = ctk.CTkScrollableFrame(
            table_frame, fg_color="transparent",
            scrollbar_fg_color=COLORS["scrollbar_bg"],
            scrollbar_button_color=COLORS["scrollbar_thumb"],
            scrollbar_button_hover_color=COLORS["scrollbar_thumb_hover"],
        )
        self.rows_frame.pack(fill="both", expand=True)

        # Detail panel (bottom)
        self.detail_frame = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=8, height=120)
        self.detail_frame.pack(fill="x", pady=(8, 0))
        self.detail_label = ctk.CTkLabel(
            self.detail_frame, text="Bir müşteri seçin...",
            font=FONTS["body"], text_color=COLORS["text_muted"]
        )
        self.detail_label.pack(padx=16, pady=12, anchor="w")

    # ─── Data Loading ──────────────────────────────────────

    def refresh(self):
        """Müşteri listesini yeniden yükle."""
        self._set_loading(True)

        def _worker():
            try:
                premium_only = self.premium_filter.get() == 1
                customers = self.sb.get_customers(premium_only=premium_only)
                total = self.sb.get_customer_count()
                premium_count = self.sb.get_premium_count()
            except Exception as e:
                self.after(0, lambda: messagebox.showerror("Hata", f"Veriler yüklenemedi:\n{e}"))
                self.after(0, lambda: self._set_loading(False))
                return
            self.after(0, lambda: self._on_data_loaded(customers, total, premium_count))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_data_loaded(self, customers, total, premium_count):
        self.customers = customers
        self.selected_ids = set()
        self.lbl_total.configure(text=f"Toplam: {total}")
        self.lbl_premium.configure(text=f"Premium: {premium_count}")
        self.lbl_selected.configure(text="0 seçili")
        self._render_table()
        self._set_loading(False)

    def _filter(self, *_):
        search = self.search_var.get().strip().lower()
        premium_only = self.premium_filter.get() == 1

        filtered = self.customers
        if search:
            filtered = [c for c in filtered if
                        search in (c.get("email") or "").lower() or
                        search in (c.get("full_name") or "").lower() or
                        search in (c.get("phone") or "").lower()]
        if premium_only:
            filtered = [c for c in filtered if c.get("is_premium")]

        self._render_table(filtered)

    def _set_loading(self, loading: bool):
        if loading:
            for widget in self.rows_frame.winfo_children():
                widget.destroy()
            ctk.CTkLabel(
                self.rows_frame, text="Yükleniyor...",
                font=FONTS["body"], text_color=COLORS["text_muted"]
            ).pack(pady=40)

    # ─── Table Rendering ───────────────────────────────────

    def _render_table(self, customers=None):
        if customers is None:
            customers = self.customers

        for widget in self.rows_frame.winfo_children():
            widget.destroy()

        if not customers:
            ctk.CTkLabel(
                self.rows_frame, text="Müşteri bulunamadı.",
                font=FONTS["body"], text_color=COLORS["text_muted"]
            ).pack(pady=40)
            return

        for idx, cust in enumerate(customers):
            bg = COLORS["bg_table_alt"] if idx % 2 else "transparent"
            row = ctk.CTkFrame(self.rows_frame, fg_color=bg, height=36, corner_radius=0)
            row.pack(fill="x", pady=0)
            row.pack_propagate(False)

            # Checkbox
            cb_var = ctk.BooleanVar(value=cust["id"] in self.selected_ids)
            cb = ctk.CTkCheckBox(
                row, text="", width=30, height=20,
                variable=cb_var,
                fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
                command=lambda cid=cust["id"], v=cb_var: self._toggle_select(cid, v)
            )
            cb.pack(side="left", padx=4)

            # Name
            name = cust.get("full_name") or "-"
            ctk.CTkLabel(
                row, text=name[:22], width=180, font=FONTS["body"],
                text_color=COLORS["text_primary"], anchor="w"
            ).pack(side="left", padx=4)

            # Email
            email = cust.get("email") or "-"
            email_lbl = ctk.CTkLabel(
                row, text=email[:28], width=220, font=FONTS["small"],
                text_color=COLORS["text_secondary"], anchor="w", cursor="hand2"
            )
            email_lbl.pack(side="left", padx=4)
            email_lbl.bind("<Button-1>", lambda e, c=cust: self._show_detail(c))

            # Phone
            phone = cust.get("phone") or "-"
            ctk.CTkLabel(
                row, text=phone, width=120, font=FONTS["small"],
                text_color=COLORS["text_secondary"], anchor="w"
            ).pack(side="left", padx=4)

            # Premium badge
            is_premium = cust.get("is_premium", False)
            if is_premium:
                ctk.CTkLabel(
                    row, text="⭐ PREMIUM", width=80, font=FONTS["badge"],
                    text_color=COLORS["gold"], anchor="w"
                ).pack(side="left", padx=4)
            else:
                ctk.CTkLabel(
                    row, text="Standart", width=80, font=FONTS["badge"],
                    text_color=COLORS["text_muted"], anchor="w"
                ).pack(side="left", padx=4)

            # Order count placeholder
            ctk.CTkLabel(
                row, text="-", width=70, font=FONTS["small"],
                text_color=COLORS["text_muted"], anchor="center"
            ).pack(side="left", padx=4)

            # Registration date
            created = cust.get("created_at", "")[:10] if cust.get("created_at") else "-"
            ctk.CTkLabel(
                row, text=created, width=90, font=FONTS["small"],
                text_color=COLORS["text_muted"], anchor="w"
            ).pack(side="left", padx=4)

    # ─── Selection ─────────────────────────────────────────

    def _toggle_select(self, customer_id: str, var: ctk.BooleanVar):
        if var.get():
            self.selected_ids.add(customer_id)
        else:
            self.selected_ids.discard(customer_id)
        self.lbl_selected.configure(text=f"{len(self.selected_ids)} seçili")

    def _get_selected_customers(self) -> list[dict]:
        return [c for c in self.customers if c["id"] in self.selected_ids]

    # ─── Detail Panel ──────────────────────────────────────

    def _show_detail(self, cust: dict):
        for w in self.detail_frame.winfo_children():
            w.destroy()

        name = cust.get("full_name") or "İsimsiz"
        email = cust.get("email") or "-"
        phone = cust.get("phone") or "-"
        is_premium = cust.get("is_premium", False)
        expires = cust.get("premium_expires_at", "")[:10] if cust.get("premium_expires_at") else "-"
        created = cust.get("created_at", "")[:10] if cust.get("created_at") else "-"

        info_frame = ctk.CTkFrame(self.detail_frame, fg_color="transparent")
        info_frame.pack(fill="x", padx=16, pady=12)

        # Row 1
        r1 = ctk.CTkFrame(info_frame, fg_color="transparent")
        r1.pack(fill="x")
        ctk.CTkLabel(r1, text=name, font=FONTS["h3"], text_color=COLORS["text_primary"]).pack(side="left")
        if is_premium:
            ctk.CTkLabel(r1, text="  ⭐ PREMIUM", font=FONTS["body"], text_color=COLORS["gold"]).pack(side="left")

        # Row 2
        r2 = ctk.CTkFrame(info_frame, fg_color="transparent")
        r2.pack(fill="x", pady=(4, 0))
        ctk.CTkLabel(r2, text=f"📧 {email}", font=FONTS["small"], text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 16))
        ctk.CTkLabel(r2, text=f"📱 {phone}", font=FONTS["small"], text_color=COLORS["text_secondary"]).pack(side="left", padx=(0, 16))
        ctk.CTkLabel(r2, text=f"📅 Kayıt: {created}", font=FONTS["small"], text_color=COLORS["text_muted"]).pack(side="left", padx=(0, 16))
        if is_premium:
            ctk.CTkLabel(r2, text=f"Bitiş: {expires}", font=FONTS["small"], text_color=COLORS["gold"]).pack(side="left")

    # ─── Premium Actions ───────────────────────────────────

    def _grant_premium(self):
        selected = self._get_selected_customers()
        if not selected:
            messagebox.showwarning("Uyarı", "En az 1 müşteri seçin.")
            return

        names = ", ".join(c.get("full_name") or c.get("email", "?") for c in selected[:5])
        if len(selected) > 5:
            names += f" ve {len(selected) - 5} diğer"

        if not messagebox.askyesno("Premium Ver",
                                    f"{len(selected)} müşteriye 1 yıl Premium verilecek:\n\n{names}\n\nDevam?"):
            return

        def _worker():
            ok, fail = 0, 0
            for c in selected:
                try:
                    self.sb.grant_premium(c["id"])
                    ok += 1
                except Exception:
                    fail += 1
            self.after(0, lambda: self._on_premium_done(ok, fail, "verildi"))

        threading.Thread(target=_worker, daemon=True).start()

    def _revoke_premium(self):
        selected = self._get_selected_customers()
        premium_selected = [c for c in selected if c.get("is_premium")]
        if not premium_selected:
            messagebox.showwarning("Uyarı", "Premium müşteri seçin.")
            return

        if not messagebox.askyesno("Premium Kaldır",
                                    f"{len(premium_selected)} müşteriden Premium kaldırılacak. Devam?"):
            return

        def _worker():
            ok, fail = 0, 0
            for c in premium_selected:
                try:
                    self.sb.revoke_premium(c["id"])
                    ok += 1
                except Exception:
                    fail += 1
            self.after(0, lambda: self._on_premium_done(ok, fail, "kaldırıldı"))

        threading.Thread(target=_worker, daemon=True).start()

    def _on_premium_done(self, ok, fail, action):
        msg = f"Premium {action}: {ok} başarılı"
        if fail:
            msg += f", {fail} başarısız"
        messagebox.showinfo("Sonuç", msg)
        self.refresh()

    # ─── Edit / Delete / Ban ──────────────────────────────

    def _edit_customer(self):
        selected = self._get_selected_customers()
        if len(selected) != 1:
            messagebox.showwarning("Uyarı", "Düzenlemek için tam 1 müşteri seçin.")
            return
        cust = selected[0]

        dialog = ctk.CTkToplevel(self)
        dialog.title(f"Müşteri Düzenle — {cust.get('email', '')}")
        dialog.geometry("450x350")
        dialog.attributes("-topmost", True)
        dialog.configure(fg_color=COLORS["bg_primary"])

        fields = {}
        for label, key, val in [
            ("Ad", "ad", (cust.get("full_name") or "").split()[0] if cust.get("full_name") else ""),
            ("Soyad", "soyad", " ".join((cust.get("full_name") or "").split()[1:]) if cust.get("full_name") else ""),
            ("Telefon", "telefon", cust.get("phone") or ""),
        ]:
            ctk.CTkLabel(dialog, text=f"{label}:", font=FONTS["body"],
                          text_color=COLORS["text_primary"]).pack(padx=16, pady=(12, 2), anchor="w")
            var = ctk.StringVar(value=val)
            ctk.CTkEntry(dialog, textvariable=var, width=400, height=32,
                          font=FONTS["body"], fg_color=COLORS["bg_input"],
                          border_color=COLORS["border"]).pack(padx=16)
            fields[key] = var

        def _save():
            data = {k: v.get().strip() for k, v in fields.items()}
            dialog.destroy()

            def _worker():
                try:
                    self.sb.update_customer(cust["id"], data)
                    self.after(0, lambda: messagebox.showinfo("Başarılı", "Müşteri güncellendi."))
                    self.after(0, self.refresh)
                except Exception as e:
                    self.after(0, lambda: messagebox.showerror("Hata", f"Güncelleme başarısız:\n{e}"))

            threading.Thread(target=_worker, daemon=True).start()

        ctk.CTkButton(dialog, text="💾 Kaydet", width=200, height=36,
                       font=FONTS["body"], fg_color=COLORS["accent"],
                       hover_color=COLORS["accent_hover"], corner_radius=8,
                       command=_save).pack(pady=20)

    def _delete_customer(self):
        selected = self._get_selected_customers()
        if not selected:
            messagebox.showwarning("Uyarı", "En az 1 müşteri seçin.")
            return

        emails = ", ".join(c.get("email", "?") for c in selected[:5])
        if not messagebox.askyesno(
            "⚠️ Müşteri Sil",
            f"{len(selected)} müşteri kalıcı olarak silinecek:\n\n{emails}\n\n"
            "Bu işlem geri alınamaz! Devam?",
            icon="warning"
        ):
            return

        def _worker():
            ok, fail = 0, 0
            for c in selected:
                if self.sb.delete_customer(c["id"]):
                    ok += 1
                else:
                    fail += 1
            msg = f"Silindi: {ok}"
            if fail:
                msg += f", Başarısız: {fail}"
            self.after(0, lambda: messagebox.showinfo("Sonuç", msg))
            self.after(0, self.refresh)

        threading.Thread(target=_worker, daemon=True).start()

    def _ban_customer(self):
        selected = self._get_selected_customers()
        if not selected:
            messagebox.showwarning("Uyarı", "En az 1 müşteri seçin.")
            return

        emails = ", ".join(c.get("email", "?") for c in selected[:5])
        if not messagebox.askyesno(
            "🚫 Müşteri Banla",
            f"{len(selected)} müşteri banlanacak:\n\n{emails}\n\n"
            "Banlanan müşteriler giriş yapamaz. Devam?"
        ):
            return

        def _worker():
            ok, fail = 0, 0
            for c in selected:
                if self.sb.ban_customer(c["id"], ban=True):
                    ok += 1
                else:
                    fail += 1
            msg = f"Banlandı: {ok}"
            if fail:
                msg += f", Başarısız: {fail}"
            self.after(0, lambda: messagebox.showinfo("Sonuç", msg))
            self.after(0, self.refresh)

        threading.Thread(target=_worker, daemon=True).start()

    def _unban_customer(self):
        selected = self._get_selected_customers()
        if not selected:
            messagebox.showwarning("Uyarı", "En az 1 müşteri seçin.")
            return

        def _worker():
            ok, fail = 0, 0
            for c in selected:
                if self.sb.ban_customer(c["id"], ban=False):
                    ok += 1
                else:
                    fail += 1
            msg = f"Ban kaldırıldı: {ok}"
            if fail:
                msg += f", Başarısız: {fail}"
            self.after(0, lambda: messagebox.showinfo("Sonuç", msg))
            self.after(0, self.refresh)

        threading.Thread(target=_worker, daemon=True).start()

    # ─── Mail Actions ──────────────────────────────────────

    def _show_mail_dialog(self):
        selected = self._get_selected_customers()
        if not selected:
            messagebox.showwarning("Uyarı", "En az 1 müşteri seçin.")
            return

        dialog = ctk.CTkToplevel(self)
        dialog.title(f"Toplu Mail — {len(selected)} alıcı")
        dialog.geometry("500x400")
        dialog.attributes("-topmost", True)
        dialog.configure(fg_color=COLORS["bg_primary"])

        ctk.CTkLabel(dialog, text="Konu:", font=FONTS["body"],
                      text_color=COLORS["text_primary"]).pack(padx=16, pady=(16, 4), anchor="w")
        subject_var = ctk.StringVar(value="Fiyatcim — Özel Kampanya")
        ctk.CTkEntry(dialog, textvariable=subject_var, width=460, height=32,
                      font=FONTS["body"], fg_color=COLORS["bg_input"],
                      border_color=COLORS["border"]).pack(padx=16)

        ctk.CTkLabel(dialog, text="İçerik (HTML):", font=FONTS["body"],
                      text_color=COLORS["text_primary"]).pack(padx=16, pady=(12, 4), anchor="w")
        body_text = ctk.CTkTextbox(dialog, width=460, height=200,
                                    font=FONTS["body"], fg_color=COLORS["bg_input"],
                                    border_color=COLORS["border"], text_color=COLORS["text_primary"])
        body_text.pack(padx=16)
        body_text.insert("1.0", "<h2>Merhaba!</h2>\n<p>Fiyatcim.com'da sizi bekleyen fırsatları kaçırmayın.</p>")

        def _send():
            subject = subject_var.get().strip()
            html = body_text.get("1.0", "end").strip()
            if not subject or not html:
                messagebox.showwarning("Uyarı", "Konu ve içerik zorunludur.")
                return

            dialog.destroy()

            def _worker():
                ok, fail = 0, 0
                for c in selected:
                    email = c.get("email")
                    if not email:
                        continue
                    try:
                        if self.sb.send_campaign_email(email, subject, html):
                            ok += 1
                        else:
                            fail += 1
                    except Exception:
                        fail += 1
                self.after(0, lambda: messagebox.showinfo(
                    "Mail Sonucu", f"Gönderildi: {ok}, Başarısız: {fail}"))

            threading.Thread(target=_worker, daemon=True).start()

        ctk.CTkButton(dialog, text=f"📧 {len(selected)} Kişiye Gönder",
                       width=200, height=36, font=FONTS["body"],
                       fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
                       corner_radius=8, command=_send).pack(pady=16)

    def _send_premium_offer(self):
        """Premium olmayan seçili müşterilere Premium teklif maili gönder."""
        selected = self._get_selected_customers()
        non_premium = [c for c in selected if not c.get("is_premium")]
        if not non_premium:
            messagebox.showwarning("Uyarı", "Premium olmayan müşteri seçin.")
            return

        if not messagebox.askyesno(
            "Premium Teklif",
            f"{len(non_premium)} müşteriye Premium teklif maili gönderilecek. Devam?"
        ):
            return

        subject = "🏆 Fiyatcim Premium ile Ayrıcalıklı Alışveriş!"
        html = """
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;border-radius:12px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">🏆 Premium Üyelik</h1>
            <p style="color:#fff;margin:8px 0 0;font-size:16px">Ayrıcalıklar sizi bekliyor!</p>
          </div>
          <div style="padding:24px 0">
            <h2 style="margin:0 0 16px;color:#333">Premium Avantajları:</h2>
            <ul style="padding-left:20px;color:#555;line-height:2">
              <li><strong>Ücretsiz Kargo</strong> — Tüm siparişlerde</li>
              <li><strong>Ücretsiz Kurulum</strong> — Profesyonel ekip</li>
              <li><strong>7/24 Teknik Destek</strong> — Öncelikli destek hattı</li>
              <li><strong>Altın Tema</strong> — Özel Premium arayüz</li>
              <li><strong>Erken Erişim</strong> — Kampanyalardan ilk siz haberdar olun</li>
            </ul>
          </div>
          <div style="text-align:center;padding:16px 0">
            <a href="https://www.fiyatcim.com/premium" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-size:18px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:8px">
              Premium'a Geç — Sadece ₺2.500
            </a>
          </div>
          <p style="text-align:center;color:#888;font-size:12px;margin-top:24px">
            Bu e-posta Fiyatcim.com tarafından gönderilmiştir.
          </p>
        </div>
        """

        def _worker():
            ok, fail = 0, 0
            for c in non_premium:
                email = c.get("email")
                if not email:
                    continue
                try:
                    if self.sb.send_campaign_email(email, subject, html):
                        ok += 1
                    else:
                        fail += 1
                except Exception:
                    fail += 1
            self.after(0, lambda: messagebox.showinfo(
                "Premium Teklif", f"Gönderildi: {ok}, Başarısız: {fail}"))

        threading.Thread(target=_worker, daemon=True).start()
