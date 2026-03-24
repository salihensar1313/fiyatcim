"""Supabase bağlantı katmanı: Auth, Products, Categories, Brands, Storage."""

import json
import os
import base64
import logging
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from supabase import create_client, Client
from dotenv import dotenv_values

logger = logging.getLogger("fiyatcim")

CONFIG_PATH = Path(__file__).parent.parent / "config.json"
CONFIG_EXAMPLE_PATH = Path(__file__).parent.parent / "config.example.json"
PROJECT_ROOT = Path(__file__).resolve().parents[3]
ROOT_ENV_PATH = PROJECT_ROOT / ".env.local"


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

    CACHE_TTL = 30  # seconds

    def __init__(self):
        config = load_config()
        self.url = config["supabase_url"]
        self.anon_key = config["supabase_anon_key"]
        self.client: Client = create_client(self.url, self.anon_key)
        self.user = None
        self._pricing_service_client: Client | None = None
        self._pricing_env_cache: dict | None = None
        self._product_cache: list[dict] | None = None
        self._product_cache_time: float = 0

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

    def get_user_id(self) -> str | None:
        return self.user.id if self.user else None

    def _get_root_env(self) -> dict:
        """Proje kök .env.local dosyasını oku."""
        if ROOT_ENV_PATH.exists():
            return dotenv_values(ROOT_ENV_PATH)
        return {}

    def _load_pricing_env(self) -> dict:
        if self._pricing_env_cache is not None:
            return self._pricing_env_cache

        file_env = dotenv_values(ROOT_ENV_PATH) if ROOT_ENV_PATH.exists() else {}
        merged = {
            **file_env,
            **{k: v for k, v in os.environ.items() if v is not None},
        }
        self._pricing_env_cache = merged
        return merged

    def check_pricing_batch_requirements(self) -> dict:
        """Pricing batch icin gerekli env degiskenlerini kontrol eder.

        Returns:
            {"ok": bool, "missing": list[str], "env_path": str}
        """
        env = self._load_pricing_env()
        required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
        missing = [key for key in required if not env.get(key)]
        return {
            "ok": len(missing) == 0,
            "missing": missing,
            "env_path": str(ROOT_ENV_PATH),
        }

    def _get_pricing_service_client(self) -> Client:
        if self._pricing_service_client is not None:
            return self._pricing_service_client

        env = self._load_pricing_env()
        url = env.get("NEXT_PUBLIC_SUPABASE_URL") or self.url
        service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY")
        if not service_role_key:
            raise RuntimeError(
                f"SUPABASE_SERVICE_ROLE_KEY eksik.\n\n"
                f"Aranan dosya: {ROOT_ENV_PATH}\n"
                f"Gerekli env: SUPABASE_SERVICE_ROLE_KEY\n\n"
                f"Otomatik pricing batch runner service role key gerektirir.\n"
                f".env.local dosyasina SUPABASE_SERVICE_ROLE_KEY=... satirini ekleyin."
            )

        self._pricing_service_client = create_client(url, service_role_key)
        return self._pricing_service_client

    def _normalize_batch_filters(self, filters: dict | None = None) -> dict:
        source = filters or {}
        normalized = {
            "siteId": source.get("siteId"),
            "status": source.get("status"),
            "productId": source.get("productId"),
            "brandId": source.get("brandId"),
            "categoryId": source.get("categoryId"),
            "manualReviewRequired": source.get("manualReviewRequired"),
            "selectedOnly": bool(source.get("selectedOnly", False)),
            "confidenceMin": source.get("confidenceMin"),
            "confidenceMax": source.get("confidenceMax"),
            "checkedBeforeHours": source.get("checkedBeforeHours"),
        }
        return {
            key: value for key, value in normalized.items()
            if value not in (None, "", [])
        }

    # ─── PRODUCTS ───────────────────────────────────────

    def get_products(self, force_refresh: bool = False) -> list[dict]:
        """Tüm aktif ürünleri çeker (silinmemiş). Sonucu cache'ler."""
        import time
        now = time.time()
        if (not force_refresh
                and self._product_cache is not None
                and (now - self._product_cache_time) < self.CACHE_TTL):
            return self._product_cache
        res = (
            self.client.table("products")
            .select("*, categories(id, name, slug), brands(id, name, slug)")
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
        )
        self._product_cache = res.data or []
        self._product_cache_time = now
        return self._product_cache

    def invalidate_cache(self):
        """Ürün cache'ini temizle — create/update/delete sonrası çağır."""
        self._product_cache = None
        self._product_cache_time = 0

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
        self.invalidate_cache()
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
        self.invalidate_cache()
        return product

    def soft_delete_product(self, product_id: str):
        """Ürünü soft-delete eder."""
        self.client.table("products").update({
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "is_active": False,
        }).eq("id", product_id).execute()
        self._audit_log("product_delete", product_id, None, None)
        self.invalidate_cache()

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

    # ─── PRICING ────────────────────────────────────────

    def get_product_pricing_snapshot(self, product_id: str) -> dict:
        """Pricing verilerini toplu ceker: sources, history, decisions, alerts."""
        snapshot = {
            "sources": [],
            "history": [],
            "decisions": [],
            "alerts": [],
            "product_pricing": {},
        }
        try:
            # Urun pricing alanlari
            prod_res = (
                self.client.table("products")
                .select("price, sale_price, cost_price, cost_currency, price_locked, price_source_id, last_price_update")
                .eq("id", product_id)
                .single()
                .execute()
            )
            snapshot["product_pricing"] = prod_res.data or {}
        except Exception as e:
            logger.warning("Pricing product read hatasi: %s", e)

        try:
            # Fiyat kaynaklari
            src_res = (
                self.client.table("price_sources")
                .select("*, source_sites(name, base_url)")
                .eq("product_id", product_id)
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            snapshot["sources"] = src_res.data or []
        except Exception as e:
            logger.warning("Pricing sources read hatasi: %s", e)

        try:
            # Fiyat gecmisi
            hist_res = (
                self.client.table("price_history")
                .select("*")
                .eq("product_id", product_id)
                .order("created_at", desc=True)
                .limit(30)
                .execute()
            )
            snapshot["history"] = hist_res.data or []
        except Exception as e:
            logger.warning("Pricing history read hatasi: %s", e)

        try:
            # Fiyatlandirma kararlari
            dec_res = (
                self.client.table("pricing_decisions")
                .select("*")
                .eq("product_id", product_id)
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            snapshot["decisions"] = dec_res.data or []
        except Exception as e:
            logger.warning("Pricing decisions read hatasi: %s", e)

        try:
            # Fiyat alarmlari
            alert_res = (
                self.client.table("price_alerts")
                .select("*")
                .eq("product_id", product_id)
                .order("created_at", desc=True)
                .limit(20)
                .execute()
            )
            snapshot["alerts"] = alert_res.data or []
        except Exception as e:
            logger.warning("Pricing alerts read hatasi: %s", e)

        return snapshot

    def get_pricing_jobs(self, limit: int = 20) -> list[dict]:
        """Son pricing job kayitlarini getirir."""
        client = self._get_pricing_service_client()
        res = (
            client.table("pricing_jobs")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data or []

    def get_pricing_job(self, job_id: str) -> dict | None:
        """Tek pricing job kaydini getirir."""
        client = self._get_pricing_service_client()
        res = (
            client.table("pricing_jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )
        return res.data or None

    def start_pricing_batch_job(self, filters: dict | None = None,
                                job_type: str = "batch_price_update") -> dict:
        """Pricing batch job olusturur ve node runner'i arka planda baslatir."""
        client = self._get_pricing_service_client()
        normalized_filters = self._normalize_batch_filters(filters)
        dedupe_key = f"{job_type}:{json.dumps(normalized_filters, sort_keys=True, ensure_ascii=False)}"

        existing_res = (
            client.table("pricing_jobs")
            .select("*")
            .eq("type", job_type)
            .in_("status", ["pending", "running"])
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        for job in (existing_res.data or []):
            metadata = job.get("metadata") or {}
            if metadata.get("dedupe_key") == dedupe_key:
                raise RuntimeError(f"Benzer bir batch job zaten calisiyor: {job.get('id')}")

        payload = {
            "type": job_type,
            "status": "pending",
            "total_items": 0,
            "processed_items": 0,
            "success_count": 0,
            "failure_count": 0,
            "skipped_count": 0,
            "triggered_by": self.get_user_id(),
            "filters": normalized_filters,
            "metadata": {
                "dedupe_key": dedupe_key,
                "requested_at": datetime.now(timezone.utc).isoformat(),
                "requested_via": "desktop_product_manager",
            },
        }

        job_res = client.table("pricing_jobs").insert(payload).execute()
        if not job_res.data:
            raise RuntimeError("Pricing job olusturulamadi")

        job = job_res.data[0]

        try:
            self._spawn_pricing_batch_runner(job["id"])
        except Exception as exc:
            client.table("pricing_jobs").update({
                "status": "failed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "metadata": {
                    **(job.get("metadata") or {}),
                    "error_summary": str(exc),
                },
            }).eq("id", job["id"]).execute()
            raise

        try:
            client.table("audit_logs").insert({
                "user_id": self.get_user_id(),
                "action": "pricing.job.start",
                "entity_type": "pricing_job",
                "entity_id": job["id"],
                "old_value": None,
                "new_value": {
                    "type": job_type,
                    "filters": normalized_filters,
                    "dedupe_key": dedupe_key,
                },
            }).execute()
        except Exception as exc:
            logger.warning("Pricing job audit log yazilamadi: %s", exc)

        return job

    def _spawn_pricing_batch_runner(self, job_id: str):
        """Node pricing batch runner'i arka planda baslatir."""
        env = self._load_pricing_env()
        script_path = PROJECT_ROOT / "tools" / "pricing" / "cli.mjs"
        if not script_path.exists():
            raise RuntimeError(f"Pricing CLI bulunamadi: {script_path}")

        child_env = os.environ.copy()
        for key, value in env.items():
            if value is not None:
                child_env[str(key)] = str(value)

        creationflags = 0
        if os.name == "nt":
            creationflags = getattr(subprocess, "DETACHED_PROCESS", 0) | getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)

        subprocess.Popen(
            ["node", str(script_path), "--job-id", job_id],
            cwd=str(PROJECT_ROOT),
            env=child_env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags,
            close_fds=True,
        )

    def get_source_sites(self) -> list[dict]:
        """Aktif kaynak siteleri listeler."""
        res = (
            self.client.table("source_sites")
            .select("id, name, base_url, is_active")
            .eq("is_active", True)
            .order("name")
            .execute()
        )
        return res.data or []

    def get_product_price_sources(self, product_id: str) -> list[dict]:
        """Bir urune ait tum price_sources kayitlarini getirir."""
        res = (
            self.client.table("price_sources")
            .select("*, source_sites(name, base_url)")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return res.data or []

    def create_price_source(self, data: dict) -> dict:
        """Yeni price source olusturur. Default: manual_review, unverified."""
        payload = {
            "product_id": data["product_id"],
            "source_site_id": data["source_site_id"],
            "source_url": data["source_url"],
            "source_sku": data.get("source_sku") or None,
            "source_brand": data.get("source_brand") or None,
            "source_title": data.get("source_title") or None,
            "notes": data.get("notes") or None,
            "status": "manual_review",
            "match_verified": False,
            "manual_review_required": True,
            "confidence_score": 0,
            "failure_count": 0,
            "check_interval_hours": 24,
            "custom_selectors": {},
        }
        res = self.client.table("price_sources").insert(payload).execute()
        return res.data[0] if res.data else {}

    def set_product_price_source(self, product_id: str, source_id: str) -> dict:
        """Urune aktif fiyat kaynagi atar (products.price_source_id)."""
        res = (
            self.client.table("products")
            .update({"price_source_id": source_id})
            .eq("id", product_id)
            .execute()
        )
        return res.data[0] if res.data else {}

    def update_price_source_status(self, source_id: str, status: str) -> dict:
        """Price source status gunceller."""
        res = (
            self.client.table("price_sources")
            .update({"status": status})
            .eq("id", source_id)
            .execute()
        )
        return res.data[0] if res.data else {}

    # ─── BULK SOURCE HELPERS ─────────────────────────────

    def get_all_source_sites(self) -> list[dict]:
        """Tum kaynak siteleri listeler (aktif/pasif)."""
        res = (
            self.client.table("source_sites")
            .select("id, name, base_url, is_active")
            .order("priority")
            .execute()
        )
        return res.data or []

    def find_product_by_sku(self, sku: str) -> dict | None:
        """SKU ile urun arar. Bulamazsa None doner."""
        res = (
            self.client.table("products")
            .select("id, name, sku, brand_id, brands(name)")
            .eq("sku", sku)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def find_products_by_skus(self, skus: list[str]) -> dict[str, dict]:
        """Birden fazla SKU ile urun arar. {sku: product} dict doner."""
        if not skus:
            return {}
        result = {}
        # Supabase in_ filtresi
        batch_size = 50
        for i in range(0, len(skus), batch_size):
            batch = skus[i:i + batch_size]
            res = (
                self.client.table("products")
                .select("id, name, sku, brand_id, price_source_id, brands(name)")
                .in_("sku", batch)
                .is_("deleted_at", "null")
                .execute()
            )
            for p in (res.data or []):
                result[p["sku"]] = p
        return result

    def get_existing_price_sources(self, product_ids: list[str]) -> set[tuple[str, str]]:
        """Mevcut (product_id, source_site_id) ciftlerini doner."""
        if not product_ids:
            return set()
        pairs = set()
        batch_size = 50
        for i in range(0, len(product_ids), batch_size):
            batch = product_ids[i:i + batch_size]
            res = (
                self.client.table("price_sources")
                .select("product_id, source_site_id")
                .in_("product_id", batch)
                .execute()
            )
            for r in (res.data or []):
                pairs.add((r["product_id"], r["source_site_id"]))
        return pairs

    def bulk_create_price_sources(self, records: list[dict]) -> list[dict]:
        """Toplu price_source insert. Her kayit icin default degerler atar."""
        if not records:
            return []
        payloads = []
        for r in records:
            payloads.append({
                "product_id": r["product_id"],
                "source_site_id": r["source_site_id"],
                "source_url": r["source_url"],
                "source_sku": r.get("source_sku") or None,
                "source_brand": r.get("source_brand") or None,
                "source_title": r.get("source_title") or None,
                "notes": r.get("notes") or None,
                "status": "manual_review",
                "match_verified": False,
                "manual_review_required": True,
                "confidence_score": 0,
                "failure_count": 0,
                "check_interval_hours": 24,
                "custom_selectors": {},
            })
        # Supabase batch insert (max ~100 per call)
        results = []
        batch_size = 100
        for i in range(0, len(payloads), batch_size):
            batch = payloads[i:i + batch_size]
            res = self.client.table("price_sources").insert(batch).execute()
            results.extend(res.data or [])
        return results

    def auto_assign_single_sources(self) -> dict:
        """Tek kaynagi olan urunlerde otomatik price_source_id atar.
        Sadece price_source_id NULL olan urunleri etkiler.
        Returns: {assigned: int, skipped: int}"""
        # Tek kaynagi olan ve price_source_id bos olan urunleri bul
        res = self.client.rpc("auto_assign_single_sources", {}).execute()
        if res.data:
            return res.data
        # RPC yoksa manuel yap
        return self._auto_assign_single_sources_manual()

    def _auto_assign_single_sources_manual(self) -> dict:
        """RPC olmadan tek kaynakli urunlere aktif kaynak atar."""
        # price_source_id NULL olan urunleri bul
        products_res = (
            self.client.table("products")
            .select("id")
            .is_("price_source_id", "null")
            .is_("deleted_at", "null")
            .limit(1000)
            .execute()
        )
        products = products_res.data or []
        if not products:
            return {"assigned": 0, "skipped": 0}

        product_ids = [p["id"] for p in products]
        assigned = 0
        skipped = 0

        # Her urunun kaynak sayisini kontrol et
        for pid in product_ids:
            src_res = (
                self.client.table("price_sources")
                .select("id")
                .eq("product_id", pid)
                .neq("status", "disabled")
                .neq("status", "invalid_match")
                .execute()
            )
            sources = src_res.data or []
            if len(sources) == 1:
                source_id = sources[0]["id"]
                self.client.table("products").update(
                    {"price_source_id": source_id}
                ).eq("id", pid).execute()
                self.client.table("price_sources").update(
                    {"status": "active"}
                ).eq("id", source_id).execute()
                assigned += 1
            else:
                skipped += 1

        return {"assigned": assigned, "skipped": skipped}

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

    # ─── Müşteriler (Profiles) ─────────────────────────────
    # DB şeması: profiles(user_id, ad, soyad, telefon, role, avatar, is_premium, premium_expires_at, updated_at)
    # Email auth.users'da — admin API ile alınır

    def get_customers(self, search: str = "", premium_only: bool = False) -> list[dict]:
        """Tüm müşterileri getir — auth.users başlangıç, profiles ile birleştir."""
        # 1) auth.users'dan tüm kullanıcıları al (email, created_at)
        auth_users = self._get_auth_users()

        # 2) profiles tablosundan tüm profilleri al
        res = self.client.table("profiles").select(
            "user_id, ad, soyad, telefon, role, avatar, is_premium, premium_expires_at, updated_at"
        ).execute()
        profile_map = {}
        for p in (res.data or []):
            profile_map[p.get("user_id", "")] = p

        # 3) Birleştir — auth.users temel, profiles zenginleştirme
        customers = []
        for u in auth_users:
            uid = u["id"]
            profile = profile_map.get(uid, {})
            is_premium = profile.get("is_premium", False)

            if premium_only and not is_premium:
                continue

            ad = profile.get("ad") or ""
            soyad = profile.get("soyad") or ""
            full_name = f"{ad} {soyad}".strip() or u.get("email", "").split("@")[0]

            c = {
                "id": uid,
                "email": u.get("email", ""),
                "full_name": full_name,
                "phone": profile.get("telefon") or "",
                "is_premium": is_premium,
                "premium_expires_at": profile.get("premium_expires_at"),
                "created_at": u.get("created_at", ""),
                "avatar": profile.get("avatar"),
                "has_profile": bool(profile),
            }
            customers.append(c)

        if search:
            s = search.lower()
            customers = [c for c in customers if
                         s in (c.get("email") or "").lower() or
                         s in (c.get("full_name") or "").lower() or
                         s in (c.get("phone") or "").lower()]
        return customers

    def _get_auth_users(self) -> list[dict]:
        """auth.users admin API'den tüm kullanıcıları al."""
        import urllib.request
        users = []
        try:
            req = urllib.request.Request(
                f"{self.url}/auth/v1/admin/users?per_page=1000",
                headers={
                    "apikey": self.anon_key,
                    "Authorization": f"Bearer {self._get_service_key()}",
                },
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode())
                users = data.get("users", [])
        except Exception as e:
            logger.warning("Auth users cekme hatasi: %s", e)
        return users

    def _get_service_key(self) -> str:
        """Service role key'i env'den al."""
        env = self._get_root_env()
        return env.get("SUPABASE_SERVICE_ROLE_KEY", self.anon_key)

    def get_customer(self, user_id: str) -> dict | None:
        """Tek müşteri detayı."""
        res = self.client.table("profiles").select("*").eq("user_id", user_id).maybe_single().execute()
        return res.data

    def get_customer_orders(self, user_id: str) -> list[dict]:
        """Müşterinin siparişlerini getir."""
        res = (self.client.table("orders")
               .select("id, order_no, status, payment_status, subtotal, shipping, discount, total, created_at")
               .eq("user_id", user_id)
               .order("created_at", desc=True)
               .execute())
        return res.data or []

    def get_customer_count(self) -> int:
        """Toplam müşteri sayısı (auth.users'dan)."""
        users = self._get_auth_users()
        return len(users)

    def get_premium_count(self) -> int:
        """Premium müşteri sayısı."""
        res = (self.client.table("profiles")
               .select("user_id", count="exact")
               .eq("is_premium", True)
               .execute())
        return res.count or 0

    def grant_premium(self, user_id: str, days: int = 365) -> dict:
        """Müşteriye premium ver."""
        from datetime import timedelta
        expires = datetime.now(timezone.utc) + timedelta(days=days)
        res = (self.client.table("profiles")
               .update({
                   "is_premium": True,
                   "premium_expires_at": expires.isoformat(),
               })
               .eq("user_id", user_id)
               .execute())
        return (res.data or [{}])[0]

    def revoke_premium(self, user_id: str) -> dict:
        """Müşteriden premiumu kaldır."""
        res = (self.client.table("profiles")
               .update({
                   "is_premium": False,
                   "premium_expires_at": None,
               })
               .eq("user_id", user_id)
               .execute())
        return (res.data or [{}])[0]

    def send_campaign_email(self, to_email: str, subject: str, html: str) -> bool:
        """Kampanya maili gönder (web API üzerinden)."""
        import urllib.request
        import urllib.error
        env = self._get_root_env()
        resend_key = env.get("RESEND_API_KEY", "")
        if not resend_key:
            logger.warning("RESEND_API_KEY bulunamadi, mail gonderilemedi")
            return False
        payload = json.dumps({
            "from": "Fiyatcim <noreply@fiyatcim.com>",
            "to": to_email,
            "subject": subject,
            "html": html,
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            headers={
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status == 200
        except Exception as e:
            logger.error("Mail gonderme hatasi: %s", e)
            return False
