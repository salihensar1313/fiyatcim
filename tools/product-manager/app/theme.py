"""Fiyatcim Premium Tema — merkezi renk ve stil tanımları."""

# ─── Renk Paleti ────────────────────────────────────────────
COLORS = {
    # Arka planlar
    "bg_primary": "#0f0f1a",
    "bg_secondary": "#13132a",
    "bg_card": "#1a1a2e",
    "bg_card_hover": "#222240",
    "bg_nav": "#0a0a14",
    "bg_nav_logo": "#07070e",
    "bg_input": "#16162a",
    "bg_table": "#14142a",
    "bg_table_alt": "#181830",
    "bg_table_header": "#1e1e38",

    # Vurgu renkleri
    "accent": "#6366f1",
    "accent_hover": "#4f46e5",
    "accent_light": "#818cf8",
    "accent_muted": "#3730a3",

    # Durum renkleri
    "success": "#22c55e",
    "success_hover": "#16a34a",
    "success_muted": "#166534",
    "warning": "#f59e0b",
    "warning_hover": "#d97706",
    "warning_muted": "#854d0e",
    "danger": "#ef4444",
    "danger_hover": "#dc2626",
    "danger_muted": "#991b1b",
    "info": "#3b82f6",
    "info_hover": "#2563eb",
    "info_muted": "#1e40af",

    # Metin renkleri
    "text_primary": "#f1f5f9",
    "text_secondary": "#94a3b8",
    "text_muted": "#64748b",
    "text_accent": "#a5b4fc",
    "text_on_accent": "#ffffff",

    # Kenarlıklar
    "border": "#2d2d4a",
    "border_light": "#3d3d5c",
    "border_focus": "#6366f1",

    # Özel
    "brand_red": "#ef4444",
    "brand_red_dark": "#7f1d1d",
    "gold": "#fbbf24",
    "purple": "#a855f7",
    "emerald": "#10b981",
    "cyan": "#06b6d4",

    # Scrollbar
    "scrollbar_bg": "#16162a",
    "scrollbar_thumb": "#2d2d4a",
    "scrollbar_thumb_hover": "#3d3d5c",
}

# ─── Font Tanımları ─────────────────────────────────────────
FONTS = {
    "h1": ("Segoe UI", 22, "bold"),
    "h2": ("Segoe UI", 18, "bold"),
    "h3": ("Segoe UI", 15, "bold"),
    "h4": ("Segoe UI", 13, "bold"),
    "body": ("Segoe UI", 12),
    "body_bold": ("Segoe UI", 12, "bold"),
    "small": ("Segoe UI", 11),
    "small_bold": ("Segoe UI", 11, "bold"),
    "tiny": ("Segoe UI", 10),
    "mono": ("Consolas", 12),
    "nav": ("Segoe UI", 13),
    "nav_bold": ("Segoe UI", 13, "bold"),
    "badge": ("Segoe UI", 9, "bold"),
    "logo": ("Segoe UI", 22, "bold"),
    "logo_sub": ("Segoe UI", 11),
}

# ─── Spacing ────────────────────────────────────────────────
SPACING = {
    "card_pad_x": 16,
    "card_pad_y": 14,
    "section_gap": 16,
    "item_gap": 8,
    "nav_pad": 10,
    "page_pad": 20,
}

# ─── Treeview Stilleri ──────────────────────────────────────
TREEVIEW_STYLE = {
    "background": COLORS["bg_table"],
    "foreground": COLORS["text_primary"],
    "fieldbackground": COLORS["bg_table"],
    "rowheight": 38,
    "font": FONTS["body"],
}

TREEVIEW_HEADING_STYLE = {
    "background": COLORS["bg_table_header"],
    "foreground": COLORS["text_secondary"],
    "font": FONTS["body_bold"],
}

TREEVIEW_MAP = {
    "background": [("selected", COLORS["accent"])],
    "foreground": [("selected", "#ffffff")],
}

# ─── Sipariş Durumları ──────────────────────────────────────
ORDER_STATUS_LABELS = {
    "pending_payment": "Odeme Bekleniyor",
    "paid": "Odeme Alindi",
    "preparing": "Hazirlaniyor",
    "shipped": "Kargoya Verildi",
    "delivered": "Teslim Edildi",
    "cancelled": "Iptal Edildi",
    "refunded": "Iade Edildi",
}

ORDER_STATUS_COLORS = {
    "pending_payment": COLORS["warning"],
    "paid": COLORS["info"],
    "preparing": COLORS["accent"],
    "shipped": COLORS["cyan"],
    "delivered": COLORS["success"],
    "cancelled": COLORS["danger"],
    "refunded": COLORS["purple"],
}

PAYMENT_STATUS_LABELS = {
    "pending": "Bekliyor",
    "success": "Basarili",
    "failed": "Basarisiz",
    "refunded": "Iade",
}

# Durum geçiş kuralları
ORDER_TRANSITIONS = {
    "pending_payment": ["paid", "cancelled"],
    "paid": ["preparing", "cancelled", "refunded"],
    "preparing": ["shipped", "cancelled"],
    "shipped": ["delivered"],
    "delivered": ["refunded"],
    "cancelled": [],
    "refunded": [],
}

# ─── Dropdown / OptionMenu / ComboBox ortak koyu renkler ──
DROPDOWN_COLORS = {
    "dropdown_fg_color": COLORS["bg_card"],
    "dropdown_text_color": COLORS["text_primary"],
    "dropdown_hover_color": COLORS["accent"],
}

# ─── CTkSwitch ortak koyu renkler ─────────────────────────
SWITCH_COLORS = {
    "button_color": COLORS["border_light"],
    "button_hover_color": COLORS["accent_light"],
}

# ─── CTkTextbox ortak koyu renkler ────────────────────────
TEXTBOX_COLORS = {
    "fg_color": COLORS["bg_input"],
    "text_color": COLORS["text_primary"],
    "border_color": COLORS["border"],
}


def bind_treeview_scroll(tree):
    """Treeview'a mouse wheel scroll desteği ekle (Windows + Linux/Mac)."""
    def _on_mousewheel(event):
        tree.yview_scroll(-1 * (event.delta // 120), "units")

    tree.bind("<MouseWheel>", _on_mousewheel)
    # Linux desteği
    tree.bind("<Button-4>", lambda e: tree.yview_scroll(-3, "units"))
    tree.bind("<Button-5>", lambda e: tree.yview_scroll(3, "units"))


def apply_dark_scrollbar(style):
    """ttk.Scrollbar'ları koyu tema ile ayarla."""
    style.configure("Vertical.TScrollbar",
                    background=COLORS["scrollbar_thumb"],
                    troughcolor=COLORS["scrollbar_bg"],
                    borderwidth=0,
                    relief="flat",
                    arrowsize=0)
    style.map("Vertical.TScrollbar",
              background=[("active", COLORS["scrollbar_thumb_hover"]),
                          ("!disabled", COLORS["scrollbar_thumb"])])
    style.configure("Horizontal.TScrollbar",
                    background=COLORS["scrollbar_thumb"],
                    troughcolor=COLORS["scrollbar_bg"],
                    borderwidth=0,
                    relief="flat",
                    arrowsize=0)
    style.map("Horizontal.TScrollbar",
              background=[("active", COLORS["scrollbar_thumb_hover"]),
                          ("!disabled", COLORS["scrollbar_thumb"])])
