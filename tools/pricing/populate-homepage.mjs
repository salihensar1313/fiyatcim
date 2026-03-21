#!/usr/bin/env node
/**
 * Ana sayfa urunlerini doldurma scripti
 * - Farkli markalardan karisik urunler secilir
 * - is_featured, is_trending, sale_price atamalari yapilir
 * - Tum ana sayfa bolumleri dolar
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../../.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  console.log('=== ANA SAYFA URUN DOLDURMA ===\n');

  // Tum aktif urunleri cek (fiyati > 0 olanlar)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, sku, price, sale_price, stock, is_featured, is_trending, brand:brands(name), category:categories(name)')
    .eq('is_active', true)
    .gt('price', 0)
    .gt('stock', 0)
    .is('deleted_at', null)
    .order('name');

  if (error) { console.error('Hata:', error.message); return; }
  console.log(`Aktif urun sayisi (fiyat > 0): ${products.length}\n`);

  // Marka bazli gruplama
  const byBrand = {};
  for (const p of products) {
    const brand = p.brand?.name || 'Diger';
    if (!byBrand[brand]) byBrand[brand] = [];
    byBrand[brand].push(p);
  }

  const brands = Object.keys(byBrand).sort();
  console.log(`Marka sayisi: ${brands.length}`);
  brands.forEach(b => console.log(`  ${b}: ${byBrand[b].length} urun`));

  // ============================================================
  // 1. FEATURED PRODUCTS — 12 urun (her markadan 1'er, karisik)
  // ============================================================
  console.log('\n--- FEATURED URUNLER ---');

  // Oncelikli markalar (populer)
  const priorityBrands = ['Ajax', 'Hikvision', 'Dahua', 'Ezviz', 'Reolink', 'Imou', 'UNV', 'HiLook', 'Desi', 'Yale', 'Kale', 'Teknim'];
  const featuredIds = [];

  for (const brand of priorityBrands) {
    if (byBrand[brand] && byBrand[brand].length > 0) {
      // Her markadan 1 populer (fiyati makul, gorseli olan) urun sec
      const candidates = shuffle(byBrand[brand]);
      featuredIds.push(candidates[0].id);
      console.log(`  [FEATURED] ${brand}: ${candidates[0].name} (${candidates[0].price} TL)`);
    }
  }

  // ============================================================
  // 2. TRENDING PRODUCTS — 8 urun (farkli markalardan)
  // ============================================================
  console.log('\n--- TRENDING URUNLER ---');

  const trendingBrands = ['Ajax', 'Hikvision', 'Ezviz', 'Reolink', 'Dahua', 'Imou', 'Desi', 'Kale'];
  const trendingIds = [];

  for (const brand of trendingBrands) {
    if (byBrand[brand] && byBrand[brand].length > 1) {
      // Featured'da olmayan bir urun sec
      const candidates = shuffle(byBrand[brand]).filter(p => !featuredIds.includes(p.id));
      if (candidates.length > 0) {
        trendingIds.push(candidates[0].id);
        console.log(`  [TRENDING] ${brand}: ${candidates[0].name} (${candidates[0].price} TL)`);
      }
    }
  }

  // ============================================================
  // 3. SALE PRICES — 20 urune indirim (BestSellers + FlashSale)
  // ============================================================
  console.log('\n--- INDIRIMLI URUNLER ---');

  const usedIds = new Set([...featuredIds, ...trendingIds]);
  const saleProducts = [];

  // Her markadan 1-2 indirimli urun
  const saleBrands = ['Ajax', 'Hikvision', 'Dahua', 'Ezviz', 'Reolink', 'Imou', 'UNV', 'HiLook', 'Desi', 'Yale', 'Kale', 'Teknim', 'Sens', 'GST', 'Blitzlock'];

  for (const brand of saleBrands) {
    if (!byBrand[brand]) continue;
    const candidates = shuffle(byBrand[brand]).filter(p => !usedIds.has(p.id) && p.price > 100);

    // 1-2 urun sec
    const count = Math.min(2, candidates.length);
    for (let i = 0; i < count; i++) {
      const p = candidates[i];
      // %10-%30 arasi rastgele indirim
      const discountPct = 10 + Math.floor(Math.random() * 21);
      const salePrice = Math.round(p.price * (1 - discountPct / 100));

      saleProducts.push({
        id: p.id,
        sale_price: salePrice,
        discountPct,
        // Ilk 8 urune flash sale (1 hafta sonra bitis)
        flash: saleProducts.length < 8
      });
      usedIds.add(p.id);
      console.log(`  [SALE ${discountPct}%] ${brand}: ${p.name} — ${p.price} TL → ${salePrice} TL${saleProducts.length <= 8 ? ' ⚡FLASH' : ''}`);
    }
  }

  // ============================================================
  // 4. VERITABANI GUNCELLEME
  // ============================================================
  console.log('\n--- VERITABANI GUNCELLEME ---');

  // Onceki featured/trending temizle
  console.log('Onceki featured/trending temizleniyor...');
  await supabase.from('products').update({ is_featured: false }).eq('is_featured', true);
  await supabase.from('products').update({ is_trending: false }).eq('is_trending', true);

  // Featured ata
  let successCount = 0;
  for (const id of featuredIds) {
    const { error } = await supabase.from('products').update({ is_featured: true }).eq('id', id);
    if (!error) successCount++;
  }
  console.log(`Featured atandi: ${successCount}/${featuredIds.length}`);

  // Trending ata
  successCount = 0;
  for (const id of trendingIds) {
    const { error } = await supabase.from('products').update({ is_trending: true }).eq('id', id);
    if (!error) successCount++;
  }
  console.log(`Trending atandi: ${successCount}/${trendingIds.length}`);

  // Sale price ata
  successCount = 0;
  const now = new Date();
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const item of saleProducts) {
    const updateData = { sale_price: item.sale_price };
    if (item.flash) {
      updateData.sale_ends_at = oneWeekLater.toISOString();
    }
    const { error } = await supabase.from('products').update(updateData).eq('id', item.id);
    if (!error) successCount++;
  }
  console.log(`Indirim atandi: ${successCount}/${saleProducts.length}`);

  // ============================================================
  // OZET
  // ============================================================
  console.log('\n=== SONUC ===');
  console.log(`Featured urunler: ${featuredIds.length} (FeaturedProducts bolumu)`);
  console.log(`Trending urunler: ${trendingIds.length} (TrendingProducts bolumu)`);
  console.log(`Indirimli urunler: ${saleProducts.length} (BestSellers + FlashSale)`);
  console.log(`Flash Sale urunler: ${saleProducts.filter(s => s.flash).length} (sayac ile)`);
  console.log(`RandomProducts: Otomatik (her yuklemede 12 rastgele urun)`);
  console.log('\nAna sayfa artik dolu! Sayfayi yenile.');
}

main().catch(console.error);
