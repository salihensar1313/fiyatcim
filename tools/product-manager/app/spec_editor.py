"""Teknik özellikler key-value editörü — premium tema."""

import customtkinter as ctk

from app.theme import COLORS, FONTS


class SpecEditor(ctk.CTkFrame):
    """Teknik özellikler (specs) key-value düzenleyici — temiz alternatif satır tasarımı."""

    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        self.configure(fg_color="transparent")
        self.specs: dict[str, str] = {}

        ctk.CTkLabel(self, text="Teknik Ozellikler", font=FONTS["h3"],
                     text_color=COLORS["text_primary"]).pack(anchor="w", pady=(0, 8))

        # Ekleme satırı
        add_row = ctk.CTkFrame(self, fg_color="transparent")
        add_row.pack(fill="x", pady=(0, 8))

        self.key_entry = ctk.CTkEntry(
            add_row, width=180, height=32, placeholder_text="Ozellik Adi",
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            border_color=COLORS["border"])
        self.key_entry.pack(side="left", padx=(0, 4))

        self.val_entry = ctk.CTkEntry(
            add_row, width=220, height=32, placeholder_text="Deger",
            font=FONTS["body"], fg_color=COLORS["bg_input"],
            border_color=COLORS["border"])
        self.val_entry.pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            add_row, text="+ Ekle", width=70, height=32,
            font=FONTS["body"], fg_color=COLORS["success"],
            hover_color=COLORS["success_hover"],
            command=self._add_spec
        ).pack(side="left")

        self.val_entry.bind("<Return>", lambda e: self._add_spec())

        # Özellik listesi
        self.list_frame = ctk.CTkScrollableFrame(self, height=140,
                                                   fg_color=COLORS["bg_card"],
                                                   corner_radius=8,
                                                   border_width=1,
                                                   border_color=COLORS["border"])
        self.list_frame.pack(fill="x")

    def _add_spec(self):
        key = self.key_entry.get().strip()
        val = self.val_entry.get().strip()
        if not key or not val:
            return
        self.specs[key] = val
        self.key_entry.delete(0, "end")
        self.val_entry.delete(0, "end")
        self.key_entry.focus()
        self._refresh_list()

    def _refresh_list(self):
        for widget in self.list_frame.winfo_children():
            widget.destroy()

        if not self.specs:
            ctk.CTkLabel(
                self.list_frame, text="Henuz ozellik eklenmedi",
                font=FONTS["small"], text_color=COLORS["text_muted"]
            ).pack(pady=10)
            return

        for i, (key, val) in enumerate(self.specs.items()):
            bg = COLORS["bg_table"] if i % 2 == 0 else COLORS["bg_table_alt"]
            row = ctk.CTkFrame(self.list_frame, fg_color=bg, corner_radius=4, height=34)
            row.pack(fill="x", padx=2, pady=1)
            row.pack_propagate(False)

            ctk.CTkLabel(
                row, text=key, font=FONTS["body_bold"],
                text_color=COLORS["text_primary"], width=170, anchor="w"
            ).pack(side="left", padx=(10, 4))

            ctk.CTkLabel(
                row, text=val, font=FONTS["body"],
                text_color=COLORS["text_secondary"], anchor="w"
            ).pack(side="left", fill="x", expand=True)

            ctk.CTkButton(
                row, text="x", width=24, height=24, font=FONTS["tiny"],
                fg_color=COLORS["danger"], hover_color=COLORS["danger_hover"],
                command=lambda k=key: self._remove_spec(k)
            ).pack(side="right", padx=4)

    def _remove_spec(self, key: str):
        self.specs.pop(key, None)
        self._refresh_list()

    def get_specs(self) -> dict[str, str]:
        return dict(self.specs)

    def set_specs(self, specs: dict[str, str]):
        self.specs = dict(specs) if specs else {}
        self._refresh_list()

    def clear(self):
        self.specs.clear()
        self._refresh_list()
