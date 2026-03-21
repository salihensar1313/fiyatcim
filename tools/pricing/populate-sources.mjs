#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServiceClient } from "./shared/db.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const envPath = path.join(repoRoot, ".env.local");

const SEARCH_SITE_BUILDERS = {
  Hepsiburada: (query) => `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`,
  Trendyol: (query) => `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}`,
  n11: (query) => `https://www.n11.com/arama?q=${encodeURIComponent(query)}`,
  "Amazon TR": (query) => `https://www.amazon.com.tr/s?k=${encodeURIComponent(query)}`,
  Akakce: (query) => `https://www.akakce.com/arama/${encodeURIComponent(query)}`,
  Cimri: (query) => `https://www.cimri.com/arama?q=${encodeURIComponent(query)}`,
  GittiGidiyor: (query) => `https://www.gittigidiyor.com/arama/?k=${encodeURIComponent(query)}`,
};

const OFFICIAL_SITE_NAME = "Urun Resmi Sitesi";

const OFFICIAL_SITE_BUILDERS = {
  ajax: ({ model }) => model ? `https://ajax.systems/tr/products/${encodeURIComponent(model)}/` : null,
  hikvision: ({ model }) => model ? `https://www.hikvision.com/tr/products/IP-Products/${encodeURIComponent(model)}/` : null,
  dahua: ({ model }) => model ? `https://www.dahuasecurity.com/tr/products/All-Products/${encodeURIComponent(model)}` : null,
  unv: ({ model }) => model ? `https://www.uniview.com/Products/Details/${encodeURIComponent(model)}` : null,
  uniview: ({ model }) => model ? `https://www.uniview.com/Products/Details/${encodeURIComponent(model)}` : null,
  ezviz: ({ model }) => model ? `https://www.ezviz.com/tr/product/${encodeURIComponent(model)}.html` : null,
  reolink: ({ model }) => model ? `https://reolink.com/tr/product/${encodeURIComponent(model)}/` : null,
  imou: ({ model }) => model ? `https://www.imou.com/tr/product/${encodeURIComponent(model)}.html` : null,
  hilook: ({ model }) => model ? `https://www.hilookglobal.com/products/${encodeURIComponent(model)}.html` : null,
  kale: ({ slug }) => slug ? `https://www.kalealarm.com.tr/urunler/${slug}` : null,
  teknim: ({ slug }) => slug ? `https://www.teknim.com.tr/urunler/${slug}` : null,
  yale: ({ slug }) => slug ? `https://www.yale.com.tr/tr/yale/yale-turkiye/${slug}` : null,
  blitzlock: ({ slug }) => slug ? `https://www.blitzlock.com/urunler/${slug}` : null,
  desi: ({ slug }) => slug ? `https://www.desialarmsistemi.com/urunler/${slug}` : null,
};

loadEnvFile(envPath);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function parseArgs(argv) {
  const args = {
    site: null,
    brand: null,
    dryRun: false,
    forceAssign: false,
    skipAssign: false,
    limit: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--brand") {
      args.brand = argv[index + 1] ?? null;
      index += 1;
    } else if (value === "--site") {
      args.site = argv[index + 1] ?? null;
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--force-assign") {
      args.forceAssign = true;
    } else if (value === "--skip-assign") {
      args.skipAssign = true;
    } else if (value === "--limit") {
      const parsed = Number(argv[index + 1]);
      args.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      index += 1;
    }
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return normalizeText(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractModel(product) {
  const sku = normalizeText(product.sku);
  const name = normalizeText(product.name);
  const tokens = name
    .split(/[\s,()]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const scored = [];
  for (const token of tokens) {
    const cleaned = token.replace(/[^A-Za-z0-9/-]/g, "");
    if (cleaned.length < 4) continue;
    const hasDigit = /\d/.test(cleaned);
    const hasUpper = /[A-Z]/.test(cleaned);
    const hasDash = /[-/]/.test(cleaned);
    if (hasDigit && (hasUpper || hasDash)) {
      scored.push(cleaned);
    }
  }

  if (scored.length > 0) {
    return scored.sort((left, right) => right.length - left.length)[0];
  }

  const skuParts = sku.split("-").filter(Boolean);
  const internalPrefixes = new Set(["AJX", "AJAX", "HIK", "DAH", "UNV", "EZV", "KAL", "DES", "IMO", "HLK", "GST"]);
  if (skuParts.length >= 2 && !internalPrefixes.has(skuParts[0])) {
    return sku;
  }

  return tokens.slice(0, 3).join(" ");
}

function buildSearchQuery(product) {
  const brand = normalizeText(product.brands?.name);
  const model = normalizeText(extractModel(product));
  const nameTokens = normalizeText(product.name).split(" ").slice(0, 4).join(" ");

  return normalizeText([brand, model || nameTokens].filter(Boolean).join(" "));
}

function buildOfficialSiteUrl(product) {
  const brand = normalizeText(product.brands?.name).toLocaleLowerCase("tr-TR");
  const builder = OFFICIAL_SITE_BUILDERS[brand];
  if (!builder) return null;

  const model = normalizeText(extractModel(product));
  const slugBase = normalizeText(product.name)
    .replace(new RegExp(`^${normalizeText(product.brands?.name)}`, "i"), "")
    .trim();

  const slug = slugify(slugBase || product.name);
  return builder({ model, slug, product });
}

function chunk(list, size) {
  const chunks = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
}

async function getAllSites(supabase) {
  const { data, error } = await supabase
    .from("source_sites")
    .select("id, name, base_url, is_active, priority")
    .order("priority", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function fetchProducts(supabase, args) {
  let query = supabase
    .from("products")
    .select("id, sku, name, price_source_id, brand_id, brands(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (args.brand) {
    const { data: brands, error: brandError } = await supabase
      .from("brands")
      .select("id, name")
      .ilike("name", args.brand);

    if (brandError) throw brandError;
    if (!brands?.length) throw new Error(`Marka bulunamadi: ${args.brand}`);
    query = query.in("brand_id", brands.map((brand) => brand.id));
  }

  if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function fetchExistingSources(supabase, productIds, siteIds) {
  const result = new Map();
  for (const productBatch of chunk(productIds, 200)) {
    const { data, error } = await supabase
      .from("price_sources")
      .select("id, product_id, source_site_id, source_url")
      .in("product_id", productBatch)
      .in("source_site_id", siteIds);

    if (error) throw error;
    for (const row of data ?? []) {
      result.set(`${row.product_id}:${row.source_site_id}`, row);
    }
  }
  return result;
}

function buildPayloads(products, selectedSites, existingMap) {
  const payloads = [];
  const siteStats = new Map();
  let duplicateCount = 0;
  let errorCount = 0;

  for (const product of products) {
    for (const site of selectedSites) {
      try {
        let sourceUrl = null;
        if (site.name === OFFICIAL_SITE_NAME) {
          sourceUrl = buildOfficialSiteUrl(product);
        } else {
          const builder = SEARCH_SITE_BUILDERS[site.name];
          if (!builder) continue;
          sourceUrl = builder(buildSearchQuery(product));
        }

        if (!sourceUrl) continue;

        const key = `${product.id}:${site.id}`;
        const existing = existingMap.get(key);
        if (existing) duplicateCount += 1;

        const stat = siteStats.get(site.name) ?? { prepared: 0, duplicates: 0 };
        stat.prepared += 1;
        if (existing) stat.duplicates += 1;
        siteStats.set(site.name, stat);

        payloads.push({
          product_id: product.id,
          source_site_id: site.id,
          source_url: sourceUrl,
          source_sku: product.sku || null,
          source_brand: product.brands?.name ?? null,
          source_title: product.name,
          status: "active",
          match_verified: true,
          verification_method: "auto",
          match_score: 85,
          confidence_score: 50,
          failure_count: 0,
          check_interval_hours: 24,
          manual_review_required: false,
          custom_selectors: {},
          notes: `${site.name} URL pattern ile otomatik populate edildi.`,
        });
      } catch (error) {
        errorCount += 1;
        console.log(
          `[HATA] ${product.sku ?? product.id} / ${site.name}: ${
            error instanceof Error ? error.message : "URL olusturulamadi"
          }`,
        );
      }
    }
  }

  return { payloads, siteStats, duplicateCount, errorCount };
}

async function upsertPriceSources(supabase, rows) {
  let affected = 0;
  for (const batch of chunk(rows, 100)) {
    const { data, error } = await supabase
      .from("price_sources")
      .upsert(batch, {
        onConflict: "product_id,source_site_id",
        ignoreDuplicates: false,
      })
      .select("id, product_id, source_site_id");

    if (error) throw error;
    affected += (data ?? []).length;
    await sleep(100);
  }
  return affected;
}

async function fetchPrimaryAssignments(supabase, productIds, hepsiburadaSiteId) {
  const result = new Map();
  for (const batch of chunk(productIds, 200)) {
    const { data, error } = await supabase
      .from("price_sources")
      .select("id, product_id")
      .eq("source_site_id", hepsiburadaSiteId)
      .eq("status", "active")
      .in("product_id", batch);

    if (error) throw error;
    for (const row of data ?? []) {
      result.set(row.product_id, row.id);
    }
  }
  return result;
}

async function assignPrimarySources(supabase, products, hepsiburadaAssignments, forceAssign) {
  let assigned = 0;
  let skipped = 0;

  for (const product of products) {
    const sourceId = hepsiburadaAssignments.get(product.id);
    if (!sourceId) {
      skipped += 1;
      continue;
    }

    if (product.price_source_id && !forceAssign) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from("products")
      .update({ price_source_id: sourceId })
      .eq("id", product.id);

    if (error) throw error;
    assigned += 1;
  }

  return { assigned, skipped };
}

function selectSites(allSites, args) {
  if (args.site) {
    const selected = allSites.filter((site) => site.name.toLocaleLowerCase("tr-TR") === args.site.toLocaleLowerCase("tr-TR"));
    if (selected.length === 0) {
      throw new Error(`source_sites icinde site bulunamadi: ${args.site}`);
    }
    return selected;
  }

  const supportedNames = new Set([
    ...Object.keys(SEARCH_SITE_BUILDERS),
    OFFICIAL_SITE_NAME,
  ]);

  return allSites.filter((site) => supportedNames.has(site.name));
}

function printDryRun(products, selectedSites) {
  for (const product of products.slice(0, 10)) {
    console.log(`\n[${product.brands?.name ?? "-"}] ${product.name} (${product.sku ?? "-"})`);
    for (const site of selectedSites) {
      const url = site.name === OFFICIAL_SITE_NAME
        ? buildOfficialSiteUrl(product)
        : SEARCH_SITE_BUILDERS[site.name]?.(buildSearchQuery(product));
      if (!url) continue;
      console.log(`  -> ${site.name}: ${url}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = createServiceClient();

  console.log("Populate Sources basliyor...");
  if (args.brand) console.log(`Marka filtresi: ${args.brand}`);
  if (args.site) console.log(`Tek site filtresi: ${args.site}`);
  if (args.limit) console.log(`Limit: ${args.limit}`);
  if (args.dryRun) console.log("Dry-run modu aktif, veritabanina yazilmayacak.");
  if (args.skipAssign) console.log("price_source_id atama kapali.");
  if (args.forceAssign) console.log("Mevcut price_source_id de ezilecek.");

  const allSites = await getAllSites(supabase);
  const selectedSites = selectSites(allSites, args);
  const hepsiburadaSite = allSites.find((site) => site.name === "Hepsiburada") ?? null;
  const products = await fetchProducts(supabase, args);

  console.log(`Toplam ${products.length} urun bulundu.`);
  console.log(`Secilen siteler: ${selectedSites.map((site) => site.name).join(", ")}`);
  if (products.length === 0) return;

  const existingMap = await fetchExistingSources(
    supabase,
    products.map((item) => item.id),
    selectedSites.map((site) => site.id),
  );

  const { payloads, siteStats, duplicateCount, errorCount } = buildPayloads(products, selectedSites, existingMap);

  console.log(`Hazir payload: ${payloads.length} | Duplicate: ${duplicateCount} | Hata: ${errorCount}`);
  for (const [siteName, stats] of siteStats.entries()) {
    console.log(`- ${siteName}: hazir=${stats.prepared}, duplicate=${stats.duplicates}`);
  }

  if (args.dryRun) {
    printDryRun(products, selectedSites);
    return;
  }

  const affected = await upsertPriceSources(supabase, payloads);
  console.log(`price_sources upsert tamamlandi. Etkilenen satir: ${affected}`);

  if (!args.skipAssign && hepsiburadaSite && (!args.site || args.site.toLocaleLowerCase("tr-TR") === "hepsiburada")) {
    const assignments = await fetchPrimaryAssignments(
      supabase,
      products.map((item) => item.id),
      hepsiburadaSite.id,
    );

    const assignmentResult = await assignPrimarySources(
      supabase,
      products,
      assignments,
      args.forceAssign,
    );

    console.log(`Hepsiburada birincil atama tamamlandi. Atanan: ${assignmentResult.assigned}, Atlanan: ${assignmentResult.skipped}`);
  } else if (!args.skipAssign && !hepsiburadaSite) {
    console.log("Hepsiburada source_site bulunamadi, price_source_id atamasi yapilmadi.");
  }

  console.log("Islem tamamlandi.");
}

main().catch((error) => {
  console.error(`Populate Sources hatasi: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
