from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
import os

def create_sample_invoice():
    filename = "../docs/sample_invoice_1.pdf"
    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 20)
    c.drawString(2*cm, height - 2*cm, "INVOICE")

    c.setFont("Helvetica", 12)
    c.drawString(2*cm, height - 3*cm, "Supplier: Agro Traders")
    c.drawString(2*cm, height - 3.6*cm, "Email: agro@traders.com")
    c.drawString(2*cm, height - 4.2*cm, "Invoice Date: 2026-04-29")
    c.drawString(2*cm, height - 4.8*cm, "Invoice #: INV-2026-001")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(2*cm, height - 6*cm, "Product")
    c.drawString(9*cm, height - 6*cm, "Qty")
    c.drawString(12*cm, height - 6*cm, "Unit Price")
    c.drawString(16*cm, height - 6*cm, "Total")

    c.setFont("Helvetica", 12)
    c.drawString(2*cm, height - 7*cm, "Basmati Rice")
    c.drawString(9*cm, height - 7*cm, "50")
    c.drawString(12*cm, height - 7*cm, "85.50")
    c.drawString(16*cm, height - 7*cm, "4275.00")

    c.drawString(2*cm, height - 7.6*cm, "Toor Dal")
    c.drawString(9*cm, height - 7.6*cm, "30")
    c.drawString(12*cm, height - 7.6*cm, "120.00")
    c.drawString(16*cm, height - 7.6*cm, "3600.00")

    c.drawString(2*cm, height - 8.2*cm, "Wheat Flour")
    c.drawString(9*cm, height - 8.2*cm, "100")
    c.drawString(12*cm, height - 8.2*cm, "45.00")
    c.drawString(16*cm, height - 8.2*cm, "4500.00")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(12*cm, height - 9.5*cm, "Grand Total:")
    c.drawString(16*cm, height - 9.5*cm, "12375.00")

    c.save()
    print(f"Invoice created: {filename}")

create_sample_invoice()