from PIL import Image, ImageDraw, ImageFont
import os

def create_invoice_png():
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)

    draw.text((50, 30), "INVOICE", fill='black')
    draw.text((50, 80), "Supplier: Agro Traders", fill='black')
    draw.text((50, 110), "Invoice Date: 2026-04-29", fill='black')
    draw.text((50, 140), "Invoice #: INV-2026-002", fill='black')

    draw.text((50, 200), "Product          Qty    Unit Price    Total", fill='black')
    draw.line([(50, 220), (750, 220)], fill='black', width=1)

    draw.text((50, 240), "Basmati Rice      50      85.50       4275.00", fill='black')
    draw.text((50, 270), "Toor Dal          30     120.00       3600.00", fill='black')
    draw.text((50, 300), "Wheat Flour      100      45.00       4500.00", fill='black')

    draw.line([(50, 330), (750, 330)], fill='black', width=1)
    draw.text((50, 350), "Grand Total:                         12375.00", fill='black')

    output_path = "../docs/sample_invoice_2.png"
    img.save(output_path)
    print(f"Invoice PNG created: {output_path}")

create_invoice_png()