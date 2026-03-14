"""PDF Fatura olusturma — reportlab ile A4 fatura."""

import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (SimpleDocTemplate, Table, TableStyle,
                                 Paragraph, Spacer, HRFlowable)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Turkce karakter destegi icin font kaydi
_font_registered = False


def _register_fonts():
    """Sistem fontlarindan Turkce destekli font bul ve kaydet."""
    global _font_registered
    if _font_registered:
        return

    # Windows'ta Segoe UI veya Arial kullan
    font_dirs = [
        os.path.join(os.environ.get("WINDIR", "C:\\Windows"), "Fonts"),
        "/usr/share/fonts/truetype",
    ]

    font_candidates = [
        ("SegoeUI", "segoeui.ttf", "segoeuib.ttf"),
        ("Arial", "arial.ttf", "arialbd.ttf"),
    ]

    for font_name, regular, bold in font_candidates:
        for font_dir in font_dirs:
            regular_path = os.path.join(font_dir, regular)
            bold_path = os.path.join(font_dir, bold)
            if os.path.exists(regular_path):
                try:
                    pdfmetrics.registerFont(TTFont(font_name, regular_path))
                    if os.path.exists(bold_path):
                        pdfmetrics.registerFont(TTFont(f"{font_name}-Bold", bold_path))
                    _font_registered = True
                    return font_name
                except Exception:
                    continue

    _font_registered = True
    return "Helvetica"  # Fallback


def _get_font():
    name = _register_fonts()
    return name or "Helvetica"


# Sirket bilgileri
COMPANY_INFO = {
    "name": "Fiyatcim.com",
    "title": "Fiyatcim Alarm ve Guvenlik Sistemleri",
    "address": "Adapazari / SAKARYA",
    "phone": "0 (507) 297 06 97",
    "email": "info@fiyatcim.com",
    "web": "www.fiyatcim.com",
}


def generate_invoice_pdf(order: dict, output_path: str) -> str:
    """Siparis verisinden PDF fatura olusturur.

    Args:
        order: Siparis dict'i (items, shipping_address, invoice_info dahil)
        output_path: Kaydedilecek dosya yolu

    Returns:
        Kaydedilen dosya yolu
    """
    font = _get_font()
    font_bold = f"{font}-Bold" if font != "Helvetica" else "Helvetica-Bold"

    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
    )

    elements = []

    # ─── Stiller ──────────────────────────────
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "InvTitle", fontName=font_bold, fontSize=18,
        textColor=colors.HexColor("#1a1a2e"), spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "InvSubtitle", fontName=font, fontSize=10,
        textColor=colors.HexColor("#64748b"), spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        "InvBody", fontName=font, fontSize=10,
        textColor=colors.HexColor("#333333"), leading=14,
    ))
    styles.add(ParagraphStyle(
        "InvBold", fontName=font_bold, fontSize=10,
        textColor=colors.HexColor("#1a1a2e"), leading=14,
    ))
    styles.add(ParagraphStyle(
        "InvSmall", fontName=font, fontSize=8,
        textColor=colors.HexColor("#94a3b8"), leading=10,
    ))

    # ─── Header ───────────────────────────────
    elements.append(Paragraph(COMPANY_INFO["name"], styles["InvTitle"]))
    elements.append(Paragraph(COMPANY_INFO["title"], styles["InvSubtitle"]))
    elements.append(Paragraph(
        f"{COMPANY_INFO['address']} | {COMPANY_INFO['phone']} | {COMPANY_INFO['email']}",
        styles["InvSmall"],
    ))
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width="100%", thickness=1,
                                 color=colors.HexColor("#e2e8f0")))
    elements.append(Spacer(1, 6 * mm))

    # ─── Fatura Bilgileri ─────────────────────
    order_no = order.get("order_no", "-")
    created = order.get("created_at", "")
    try:
        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        date_str = dt.strftime("%d.%m.%Y")
    except Exception:
        date_str = str(created)[:10]

    info_data = [
        ["FATURA", ""],
        ["Fatura No:", order_no],
        ["Tarih:", date_str],
    ]
    info_table = Table(info_data, colWidths=[80, 200])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, 0), font_bold),
        ("FONTSIZE", (0, 0), (0, 0), 14),
        ("FONTNAME", (0, 1), (-1, -1), font),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 1), (0, -1), colors.HexColor("#64748b")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 6 * mm))

    # ─── Müşteri Bilgileri ────────────────────
    invoice_info = order.get("invoice_info") or {}
    inv_type = invoice_info.get("type", "bireysel")

    elements.append(Paragraph("MUSTERI BILGILERI", styles["InvBold"]))
    elements.append(Spacer(1, 2 * mm))

    if inv_type == "kurumsal":
        elements.append(Paragraph(
            f"Firma: {invoice_info.get('companyName', '-')}", styles["InvBody"]))
        elements.append(Paragraph(
            f"Vergi Dairesi: {invoice_info.get('taxOffice', '-')}", styles["InvBody"]))
        elements.append(Paragraph(
            f"Vergi No: {invoice_info.get('taxNumber', '-')}", styles["InvBody"]))
    else:
        elements.append(Paragraph(
            f"Ad Soyad: {invoice_info.get('fullName', '-')}", styles["InvBody"]))
        tc = invoice_info.get("tcKimlik", "")
        if tc:
            elements.append(Paragraph(f"TC Kimlik: {tc}", styles["InvBody"]))

    # Adres
    addr = order.get("shipping_address")
    if addr and isinstance(addr, dict):
        elements.append(Paragraph(
            f"Adres: {addr.get('address', '')} {addr.get('district', '')} / {addr.get('province', '')}",
            styles["InvBody"],
        ))
        phone = addr.get("phone", "")
        if phone:
            elements.append(Paragraph(f"Telefon: {phone}", styles["InvBody"]))

    email = order.get("customer_email", "")
    if email:
        elements.append(Paragraph(f"E-posta: {email}", styles["InvBody"]))

    elements.append(Spacer(1, 6 * mm))

    # ─── Ürün Tablosu ─────────────────────────
    items = order.get("items", [])
    table_data = [["#", "Urun", "Adet", "Birim Fiyat", "KDV %", "KDV", "Toplam"]]

    subtotal = 0
    total_tax = 0

    for i, item in enumerate(items, 1):
        qty = int(item.get("qty", 1))
        price = float(item.get("price_snapshot", 0))
        sale = item.get("sale_price_snapshot")
        unit_price = float(sale) if sale else price
        tax_rate = float(item.get("tax_rate_snapshot", 20))
        tax_amount = float(item.get("tax_amount", 0))
        if tax_amount == 0:
            # KDV dahil fiyattan hesapla
            base = unit_price / (1 + tax_rate / 100)
            tax_amount = (unit_price - base) * qty

        line_total = unit_price * qty
        subtotal += line_total
        total_tax += tax_amount

        table_data.append([
            str(i),
            item.get("name_snapshot", "-")[:40],
            str(qty),
            f"{unit_price:,.2f} TL",
            f"%{int(tax_rate)}",
            f"{tax_amount:,.2f} TL",
            f"{line_total:,.2f} TL",
        ])

    col_widths = [25, 180, 40, 80, 45, 70, 80]
    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), font_bold),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        # Body
        ("FONTNAME", (0, 1), (-1, -1), font),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("ALIGN", (2, 1), (-1, -1), "RIGHT"),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4 * mm))

    # ─── Toplam Özeti ─────────────────────────
    shipping = float(order.get("shipping", 0))
    discount = float(order.get("discount", 0))
    grand_total = float(order.get("total", subtotal))

    summary_data = [
        ["Ara Toplam:", f"{subtotal:,.2f} TL"],
        ["KDV Toplam:", f"{total_tax:,.2f} TL"],
    ]
    if shipping > 0:
        summary_data.append(["Kargo:", f"{shipping:,.2f} TL"])
    if discount > 0:
        summary_data.append(["Indirim:", f"-{discount:,.2f} TL"])
    summary_data.append(["GENEL TOPLAM:", f"{grand_total:,.2f} TL"])

    summary_table = Table(summary_data, colWidths=[380, 140])
    summary_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -2), font),
        ("FONTSIZE", (0, 0), (-1, -2), 10),
        ("FONTNAME", (0, -1), (-1, -1), font_bold),
        ("FONTSIZE", (0, -1), (-1, -1), 12),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TEXTCOLOR", (0, 0), (-1, -2), colors.HexColor("#64748b")),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#1a1a2e")),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#1a1a2e")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 10 * mm))

    # ─── Footer ───────────────────────────────
    elements.append(HRFlowable(width="100%", thickness=0.5,
                                 color=colors.HexColor("#e2e8f0")))
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(
        f"{COMPANY_INFO['title']} | {COMPANY_INFO['address']} | {COMPANY_INFO['phone']}",
        styles["InvSmall"],
    ))
    elements.append(Paragraph(
        "Bu belge bilgi amaçlidir. Resmi e-fatura icin Parasut entegrasyonunu kullanin.",
        styles["InvSmall"],
    ))

    # Build PDF
    doc.build(elements)
    return output_path
