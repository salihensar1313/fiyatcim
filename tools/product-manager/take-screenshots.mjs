import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const guidesDir = join(__dirname, 'guides');

const sections = [
  { name: 'kategori-kartlari.png', text: 'Ürün Kategorileri' },
  { name: 'one-cikan-urunler.png', text: 'Öne Çıkan Ürünler' },
  { name: 'one-cikan-indirimler.png', text: 'Öne Çıkan İndirimler' },
  { name: 'trend-urunler.png', text: 'Trend Ürünler' },
  { name: 'kampanya-radar.png', text: 'Kampanya Radar' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

  // Close announcement bar
  try { await page.click('button:has-text("Kapat")', { timeout: 2000 }); } catch {}
  await page.waitForTimeout(1500);

  for (const section of sections) {
    try {
      // Find the heading and its closest section-like parent via JS
      const handle = await page.evaluateHandle((text) => {
        const headings = [...document.querySelectorAll('h2, h3')];
        const h = headings.find(el => el.textContent.trim().includes(text));
        if (!h) return null;
        // Walk up to find a section-like container
        let el = h.parentElement;
        while (el && el.tagName !== 'SECTION' && el.tagName !== 'MAIN') {
          // Stop at a large-ish container with some height
          if (el.offsetHeight > 200 && el.classList.length > 0) break;
          el = el.parentElement;
        }
        return el || h.parentElement;
      }, section.text);

      const element = handle.asElement();
      if (!element) {
        console.log(`SKIP: "${section.text}" not found`);
        continue;
      }

      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const filePath = join(guidesDir, section.name);
      await element.screenshot({ path: filePath });
      console.log(`OK: ${section.name}`);
    } catch (e) {
      console.log(`FAIL: ${section.name} — ${e.message}`);
    }
  }

  await browser.close();
  console.log('Done!');
})();
