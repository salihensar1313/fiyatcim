"""Ürün önizleme: tarayıcıda ürün sayfası görünümü."""

import os
import tempfile
import webbrowser
from pathlib import Path

from app.utils import format_price, format_price_usd


def generate_preview_html(product_data: dict, category_name: str, brand_name: str) -> str:
    """Ürün verilerinden önizleme HTML'i oluşturur."""
    name = product_data.get("name", "Urun Adi")
    price = product_data.get("price", 0)
    sale_price = product_data.get("sale_price")
    price_usd = product_data.get("price_usd", 0)
    sale_price_usd = product_data.get("sale_price_usd")
    stock = product_data.get("stock", 0)
    short_desc = product_data.get("short_desc", "")
    description = product_data.get("description", "")
    specs = product_data.get("specs", {})
    images = product_data.get("_preview_images", [])
    seo_title = product_data.get("seo_title", name)
    warranty = product_data.get("warranty_months", 24)

    # Görseller HTML
    images_html = ""
    if images:
        for idx, img_path in enumerate(images):
            if img_path.startswith("http") or img_path.startswith("data:"):
                src = img_path
            else:
                src = Path(img_path).as_uri() if os.path.exists(img_path) else img_path
            active = "active" if idx == 0 else ""
            images_html += f'<img class="gallery-img {active}" src="{src}" alt="{name}" onclick="showImg(this)">\n'
    else:
        images_html = '<div class="no-image">Gorsel Yok</div>'

    # Specs tablo
    specs_html = ""
    if specs:
        specs_html = '<table class="specs-table">\n'
        for k, v in specs.items():
            specs_html += f"<tr><td class='spec-key'>{k}</td><td class='spec-val'>{v}</td></tr>\n"
        specs_html += "</table>"

    # Fiyat
    if sale_price and float(sale_price) > 0:
        price_html = f"""
        <span class="old-price">{format_price(float(price))}</span>
        <span class="sale-price">{format_price(float(sale_price))}</span>
        """
    else:
        price_html = f'<span class="price">{format_price(float(price))}</span>'

    # Stok durumu
    if stock <= 0:
        stock_html = '<span class="stock out">Tukendi</span>'
    elif stock <= 5:
        stock_html = f'<span class="stock critical">Son {stock} adet!</span>'
    else:
        stock_html = f'<span class="stock ok">Stokta ({stock} adet)</span>'

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Onizleme: {seo_title}</title>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1e293b; }}
.header {{ background: #1a1a2e; color: white; padding: 12px 24px; }}
.header h1 {{ font-size: 18px; color: #ef4444; display: inline; }}
.header span {{ color: #94a3b8; font-size: 13px; margin-left: 12px; }}
.preview-badge {{ background: #f59e0b; color: #000; padding: 4px 12px; border-radius: 4px;
    font-size: 12px; font-weight: bold; float: right; margin-top: 2px; }}
.container {{ max-width: 1200px; margin: 0 auto; padding: 24px; }}
.breadcrumb {{ font-size: 13px; color: #64748b; margin-bottom: 20px; }}
.breadcrumb a {{ color: #3b82f6; text-decoration: none; }}
.product-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }}
.gallery {{ }}
.gallery-img {{ width: 100%; border-radius: 12px; cursor: pointer; display: none;
    border: 1px solid #e2e8f0; }}
.gallery-img.active {{ display: block; }}
.thumbs {{ display: flex; gap: 8px; margin-top: 12px; }}
.thumbs img {{ width: 64px; height: 64px; object-fit: cover; border-radius: 8px;
    border: 2px solid transparent; cursor: pointer; }}
.thumbs img:hover, .thumbs img.active {{ border-color: #ef4444; }}
.no-image {{ background: #e2e8f0; height: 400px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 18px; }}
.info {{ }}
.brand {{ font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }}
.product-name {{ font-size: 28px; font-weight: 700; margin: 8px 0 16px; line-height: 1.3; }}
.price {{ font-size: 28px; font-weight: 700; color: #1e293b; }}
.sale-price {{ font-size: 28px; font-weight: 700; color: #ef4444; }}
.old-price {{ font-size: 18px; color: #94a3b8; text-decoration: line-through; margin-right: 12px; }}
.stock {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px;
    font-weight: 600; margin-top: 12px; }}
.stock.ok {{ background: #dcfce7; color: #16a34a; }}
.stock.critical {{ background: #fef3c7; color: #d97706; }}
.stock.out {{ background: #fee2e2; color: #dc2626; }}
.short-desc {{ margin-top: 16px; color: #475569; line-height: 1.6; }}
.badges {{ display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }}
.badge {{ background: #f1f5f9; padding: 8px 16px; border-radius: 8px; font-size: 13px; color: #334155; }}
.tabs {{ margin-top: 40px; border-bottom: 2px solid #e2e8f0; }}
.tab {{ display: inline-block; padding: 12px 24px; font-size: 14px; color: #64748b; cursor: pointer;
    border-bottom: 2px solid transparent; margin-bottom: -2px; }}
.tab.active {{ color: #ef4444; border-bottom-color: #ef4444; font-weight: 600; }}
.tab-content {{ padding: 24px 0; line-height: 1.8; color: #475569; }}
.specs-table {{ width: 100%; border-collapse: collapse; }}
.specs-table tr:nth-child(odd) {{ background: #f8fafc; }}
.specs-table td {{ padding: 10px 16px; border-bottom: 1px solid #e2e8f0; }}
.spec-key {{ font-weight: 600; color: #1e293b; width: 40%; }}
.spec-val {{ color: #475569; }}
</style>
</head>
<body>
<div class="header">
    <h1>Temiz Is</h1>
    <span>Urun Onizlemesi</span>
    <span class="preview-badge">ONIZLEME</span>
</div>
<div class="container">
    <div class="breadcrumb">
        <a href="#">Urunler</a> &gt; <a href="#">{category_name}</a> &gt; {name}
    </div>
    <div class="product-grid">
        <div class="gallery">
            {images_html}
            <div class="thumbs" id="thumbs"></div>
        </div>
        <div class="info">
            <div class="brand">{brand_name}</div>
            <h1 class="product-name">{name}</h1>
            <div>{price_html}</div>
            {stock_html}
            <p class="short-desc">{short_desc}</p>
            <div class="badges">
                <span class="badge">{warranty} Ay Garanti</span>
                <span class="badge">{"Ucretsiz Kargo" if float(price) >= 2000 else "Kargo Ucretli"}</span>
                <span class="badge">{category_name}</span>
            </div>
        </div>
    </div>
    <div class="tabs">
        <span class="tab active" onclick="showTab('desc')">Urun Aciklamasi</span>
        <span class="tab" onclick="showTab('specs')">Teknik Ozellikler</span>
    </div>
    <div class="tab-content" id="tab-desc">
        {description or '<em>Aciklama eklenmedi</em>'}
    </div>
    <div class="tab-content" id="tab-specs" style="display:none;">
        {specs_html or '<em>Teknik ozellik eklenmedi</em>'}
    </div>
</div>
<script>
function showImg(el) {{
    document.querySelectorAll('.gallery-img').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}}
function showTab(tab) {{
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.style.display='none');
    document.getElementById('tab-' + tab).style.display = 'block';
    event.target.classList.add('active');
}}
// Thumbnails
const imgs = document.querySelectorAll('.gallery-img');
const thumbs = document.getElementById('thumbs');
imgs.forEach((img, i) => {{
    const t = document.createElement('img');
    t.src = img.src;
    t.onclick = () => {{ showImg(img); }};
    if(i === 0) t.classList.add('active');
    thumbs.appendChild(t);
}});
</script>
</body>
</html>"""
    return html


def open_preview(product_data: dict, category_name: str, brand_name: str):
    """Önizleme HTML'ini geçici dosyaya yazar ve tarayıcıda açar."""
    html = generate_preview_html(product_data, category_name, brand_name)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(html)
        webbrowser.open(f"file://{f.name}")
