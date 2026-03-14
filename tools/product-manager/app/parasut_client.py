"""Parasut E-Fatura API stub — API anahtarlari girilince calisacak."""

import json
from pathlib import Path

CONFIG_PATH = Path(__file__).parent.parent / "config.json"


class ParasutClient:
    """Parasut API istemcisi. Simdilik stub — anahtarlar girilince aktif olacak."""

    def __init__(self):
        self.config = self._load_config()
        self.company_id = self.config.get("parasut_company_id", "")
        self.client_id = self.config.get("parasut_client_id", "")
        self.client_secret = self.config.get("parasut_client_secret", "")
        self.username = self.config.get("parasut_username", "")
        self.password = self.config.get("parasut_password", "")
        self._token = None

    def _load_config(self) -> dict:
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def is_configured(self) -> bool:
        """Parasut API anahtarlari girilmis mi?"""
        return bool(
            self.company_id and
            self.client_id and
            self.client_secret and
            self.username and
            self.password
        )

    def _get_token(self) -> str:
        """OAuth2 token al (stub)."""
        if not self.is_configured():
            raise RuntimeError("Parasut API yapilandirilmamis. "
                               "config.json'a parasut_* alanlari ekleyin.")
        # TODO: Gercek OAuth2 token alma
        # POST https://api.parasut.com/oauth/token
        raise NotImplementedError("Parasut token alma henuz uygulanmadi. "
                                   "API anahtarlarinizi aldiktan sonra bu "
                                   "fonksiyon tamamlanacak.")

    def create_contact(self, contact_data: dict) -> dict:
        """Parasut'ta musteri/carisi olustur (stub)."""
        # TODO: POST /v4/{company_id}/contacts
        raise NotImplementedError("Parasut iletisim olusturma henuz uygulanmadi.")

    def create_sales_invoice(self, invoice_data: dict) -> dict:
        """Satis faturasi olustur (stub)."""
        # TODO: POST /v4/{company_id}/sales_invoices
        raise NotImplementedError("Parasut fatura olusturma henuz uygulanmadi.")

    def convert_to_einvoice(self, invoice_id: str) -> dict:
        """E-fatura'ya donustur (stub)."""
        # TODO: POST /v4/{company_id}/e_invoices
        raise NotImplementedError("Parasut e-fatura donusturme henuz uygulanmadi.")

    def get_invoice_status(self, invoice_id: str) -> dict:
        """Fatura durumunu sorgula (stub)."""
        raise NotImplementedError("Parasut fatura durumu sorgulama henuz uygulanmadi.")
