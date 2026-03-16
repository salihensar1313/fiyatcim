"""Supabase bağlantı katmanı: Auth, Products, Categories, Brands, Storage."""

import json
import os
import base64
import logging
from datetime import datetime, timezone
from pathlib import Path
from supabase import create_client, Client

logger = logging.getLogger("fiyatcim")

CONFIG_PATH = Path(__file__).parent.parent / "config.json"
CONFIG_EXAMPLE_PATH = Path(__file__).parent.parent / "config.example.json"


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        if CONFIG_EXAMPLE_PATH.exists():
            raise FileNotFoundError(
                "config.json bulunamadi. config.example.json dosyasini config.json olarak kopyalayip "
                "Supabase bilgilerinizi girin."
            )
        raise FileNotFoundError("config.json bulunamadi.")
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)
    # Zorunlu alanlari kontrol et
    if not config.get("supabase_url") or not config.get("supabase_anon_key"):
        raise ValueError("config.json icinde supabase_url ve supabase_anon_key zorunludur.")
    return config


class SupabaseManager:
    """Supabase bağlantı ve CRUD operasyonları."""

    def __init__(self):
        config = load_config()
        self.url = config["supabase_url"]
        self.anon_key = config["supabase_anon_key"]
        self.client: Client = create_client(self.url, self.anon_key)
        self.user = None

    # ─── AUTH ───────────────────────────────────────────

    def sign_in(self, email: str, password: str) -> dict:
        """Email + sifre ile giris. Hata varsa exception firlatir."""
        # Input validation
        if not email or not isinstance(email, str) or len(email) > 254:
            raise ValueError("Gecersiz e-posta adresi")
        if not password or not isinstance(password, str) or len(password) > 256:
            raise ValueError("Gecersiz sifre")
        email = email.strip().lower()

        res = self.client.auth.sign_in_with_password({
            "email": email,
            "password": password,
        })
        self.user = res.user
        return {"id": res.user.id, "email": res.user.email}

    def sign_out(self):
        self.client.auth.sign_out()
        self.user = None

    def get_user_email(self) -> str:
        return self.user.email if self.user else ""

    # ─── PRODUCTS ───────────────────────────────────────

    def get_products(self) -> list[dict]:
        """Tüm aktif ürünleri çeker (silinmemiş)."""
        res = (
            self.client.table("products")
            .select("*, categories(id, name, slug), brands(id, name, slug)")
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get_product(self, product_id: str) -> dict | None:
        res = (
            self.client.table("products")
            .select("*")
            .eq("id", product_id)
            .single()
            .execute()
        )
        return res.data

    def check_sku_unique(self, sku: str, exclude_id: str | None = None) -> bool:
        """SKU benzersizlik kontrolu. True = kullanilabilir."""
        q = (self.client.table("products")
             .select("id", count="exact")
             .eq("sku", sku)
             .is_("deleted_at", "null"))
        if exclude_id:
            q = q.neq("id", exclude_id)
        res = q.execute()
        return (res.count or 0) == 0

    def check_slug_unique(self, slug: str, exclude_id: str | None = None) -> bool:
        """Slug benzersizlik kontrolu. True = kullanilabilir."""
        q = (self.client.table("products")
             .select("id", count="exact")
             .eq("slug", slug)
             .is_("deleted_at", "null"))
        if exclude_id:
            q = q.neq("id", exclude_id)
        res = q.execute()
        return (res.count or 0) == 0

    def create_product(self, data: dict) -> dict:
        """Yeni ürün oluşturur. id, created_at, updated_at otomatik."""
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at", "updated_at", "categories", "brands", "category", "brand", "reviews")}
        res = self.client.table("products").insert(clean).execute()
        product = res.data[0] if res.data else {}
        if product:
            self._audit_log("product_create", product.get("id"), None, product)
        return product

    def update_product(self, product_id: str, data: dict, expected_updated_at: str | None = None) -> dict:
        """Mevcut ürünü günceller. Optimistic locking destekli."""
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at", "categories", "brands", "category", "brand", "reviews")}
        q = self.client.table("products").update(clean).eq("id", product_id)
        if expected_updated_at:
            q = q.eq("updated_at", expected_updated_at)
        res = q.execute()
        if expected_updated_at and not res.data:
            raise Exception("Bu urun baskasi tarafindan degistirilmis. Lütfen sayfayi yenileyip tekrar deneyin.")
        product = res.data[0] if res.data else {}
        if product:
            self._audit_log("product_update", product_id, None, clean)
        return product

    def soft_delete_product(self, product_id: str):
        """Ürünü soft-delete eder."""
        self.client.table("products").update({
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "is_active": False,
        }).eq("id", product_id).execute()
        self._audit_log("product_delete", product_id, None, None)

    def bulk_update_products(self, product_ids: list[str], data: dict) -> dict:
        """Birden fazla ürünü günceller. Basari/hata sayisi döner."""
        success = 0
        errors = []
        for pid in product_ids:
            try:
                self.update_product(pid, data)
                success += 1
            except Exception as e:
                errors.append(f"{pid}: {e}")
        return {"success": success, "errors": errors}

    def bulk_delete_products(self, product_ids: list[str]) -> dict:
        """Birden fazla ürünü soft-delete eder. Basari/hata sayisi döner."""
        success = 0
        errors = []
        for pid in product_ids:
            try:
                self.soft_delete_product(pid)
                success += 1
            except Exception as e:
                errors.append(f"{pid}: {e}")
        return {"success": success, "errors": errors}

    # ─── CATEGORIES ─────────────────────────────────────

    def get_categories(self) -> list[dict]:
        res = (
            self.client.table("categories")
            .select("*")
            .order("sort_order")
            .execute()
        )
        return res.data or []

    def create_category(self, data: dict) -> dict:
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at", "updated_at", "product_count")}
        res = self.client.table("categories").insert(clean).execute()
        return res.data[0] if res.data else {}

    def update_category(self, cat_id: str, data: dict) -> dict:
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at", "product_count")}
        res = self.client.table("categories").update(clean).eq("id", cat_id).execute()
        return res.data[0] if res.data else {}

    def get_category_product_count(self, cat_id: str) -> int:
        """Kategoriye bagli urun sayisini döner."""
        res = (self.client.table("products")
               .select("id", count="exact")
               .eq("category_id", cat_id)
               .is_("deleted_at", "null")
               .execute())
        return res.count or 0

    def delete_category(self, cat_id: str):
        count = self.get_category_product_count(cat_id)
        if count > 0:
            raise Exception(f"Bu kategoriye bagli {count} urun var. Önce urunleri baska kategoriye tasiyin.")
        self.client.table("categories").delete().eq("id", cat_id).execute()

    # ─── BRANDS ─────────────────────────────────────────

    def get_brands(self) -> list[dict]:
        res = (
            self.client.table("brands")
            .select("*")
            .order("name")
            .execute()
        )
        return res.data or []

    def create_brand(self, data: dict) -> dict:
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at", "updated_at")}
        res = self.client.table("brands").insert(clean).execute()
        return res.data[0] if res.data else {}

    def update_brand(self, brand_id: str, data: dict) -> dict:
        clean = {k: v for k, v in data.items() if k not in ("id", "created_at")}
        res = self.client.table("brands").update(clean).eq("id", brand_id).execute()
        return res.data[0] if res.data else {}

    def get_brand_product_count(self, brand_id: str) -> int:
        """Markaya bagli urun sayisini döner."""
        res = (self.client.table("products")
               .select("id", count="exact")
               .eq("brand_id", brand_id)
               .is_("deleted_at", "null")
               .execute())
        return res.count or 0

    def delete_brand(self, brand_id: str):
        count = self.get_brand_product_count(brand_id)
        if count > 0:
            raise Exception(f"Bu markaya bagli {count} urun var. Önce urunleri baska markaya tasiyin.")
        self.client.table("brands").delete().eq("id", brand_id).execute()

    # ─── ORDERS ────────────────────────────────────────

    def get_orders(self, status_filter: str | None = None,
                   search: str | None = None, limit: int = 50) -> list[dict]:
        """Siparisleri ceker (order_items tek sorguda)."""
        q = self.client.table("orders").select("*, order_items(*)").order("created_at", desc=True).limit(limit)
        if status_filter:
            q = q.eq("status", status_filter)
        res = q.execute()
        orders = res.data or []

        # order_items join'den gelir, items key'ine tasi
        for order in orders:
            order["items"] = order.pop("order_items", [])

        if search:
            s = search.lower()
            orders = [o for o in orders if
                      s in (o.get("order_no") or "").lower() or
                      s in (o.get("customer_email") or "").lower()]

        return orders

    def get_order(self, order_id: str) -> dict | None:
        """Tek siparis detayi + items."""
        res = self.client.table("orders").select("*").eq("id", order_id).single().execute()
        order = res.data
        if order:
            items_res = (
                self.client.table("order_items")
                .select("*")
                .eq("order_id", order_id)
                .execute()
            )
            order["items"] = items_res.data or []
        return order

    def get_order_count(self) -> int:
        res = self.client.table("orders").select("id", count="exact").execute()
        return res.count or 0

    def get_orders_today_count(self) -> int:
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00+00:00")
        res = (
            self.client.table("orders")
            .select("id", count="exact")
            .gte("created_at", today)
            .execute()
        )
        return res.count or 0

    def get_total_revenue(self) -> float:
        res = (
            self.client.table("orders")
            .select("total")
            .eq("payment_status", "success")
            .execute()
        )
        return sum(float(o.get("total", 0)) for o in (res.data or []))

    def get_recent_orders(self, limit: int = 10) -> list[dict]:
        res = (
            self.client.table("orders")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []

    def update_order_status(self, order_id: str, new_status: str):
        """Siparis durumunu gunceller ve log ekler."""
        order = self.client.table("orders").select("status").eq("id", order_id).single().execute()
        old_status = order.data.get("status") if order.data else ""

        self.client.table("orders").update({"status": new_status}).eq("id", order_id).execute()

        log_data = {
            "order_id": order_id,
            "old_status": old_status,
            "new_status": new_status,
        }
        if self.user and self.user.id:
            log_data["changed_by"] = self.user.id
        try:
            self.client.table("order_status_logs").insert(log_data).execute()
        except Exception as e:
            logger.warning("order_status_logs insert hatasi (RLS?): %s", e)

    def update_order_tracking(self, order_id: str, tracking_no: str,
                               shipping_company: str | None = None):
        data = {"tracking_no": tracking_no}
        if shipping_company:
            data["shipping_company"] = shipping_company
        self.client.table("orders").update(data).eq("id", order_id).execute()

    def get_order_status_logs(self, order_id: str) -> list[dict]:
        res = (
            self.client.table("order_status_logs")
            .select("*")
            .eq("order_id", order_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    # ─── DASHBOARD HELPERS ─────────────────────────────

    def get_active_product_count(self) -> int:
        res = (
            self.client.table("products")
            .select("id", count="exact")
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .execute()
        )
        return res.count or 0

    def get_critical_stock_products(self, limit: int = 20) -> list[dict]:
        res = (
            self.client.table("products")
            .select("id, name, sku, stock, critical_stock")
            .eq("is_active", True)
            .is_("deleted_at", "null")
            .gt("stock", 0)
            .order("stock")
            .limit(limit)
            .execute()
        )
        # Sadece stock <= critical_stock olanlari filtrele
        return [p for p in (res.data or [])
                if p.get("stock", 0) <= p.get("critical_stock", 5)]

    # ─── STORAGE (GÖRSELLER) ────────────────────────────

    def upload_image(self, file_path: str, storage_path: str) -> str:
        """Görseli Supabase Storage'a yükler, public URL döner."""
        bucket = "product-images"
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        content_type = "image/jpeg"
        if file_path.lower().endswith(".png"):
            content_type = "image/png"
        elif file_path.lower().endswith(".webp"):
            content_type = "image/webp"

        self.client.storage.from_(bucket).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )

        public_url = self.client.storage.from_(bucket).get_public_url(storage_path)
        return public_url

    def delete_image(self, storage_path: str):
        """Storage'dan görsel siler."""
        self.client.storage.from_("product-images").remove([storage_path])

    def upload_image_base64(self, file_path: str) -> str:
        """Görseli base64 olarak encode eder (Storage yoksa fallback)."""
        from PIL import Image
        import io

        img = Image.open(file_path)
        if img.width > 1200:
            ratio = 1200 / img.width
            img = img.resize((1200, int(img.height * ratio)), Image.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    # ─── AUDIT LOG ──────────────────────────────────────

    def _audit_log(self, action: str, entity_id: str | None,
                   old_data: dict | None, new_data: dict | None):
        """Urun degisikliklerini loglar (sessiz — hata atarsa yutulur)."""
        try:
            logger.info(
                "AUDIT | action=%s entity=%s user=%s",
                action, entity_id,
                self.user.email if self.user else "unknown"
            )
        except Exception:
            pass
