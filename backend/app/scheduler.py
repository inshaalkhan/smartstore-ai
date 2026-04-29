from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.product import Product
from app.models.purchase_order import PurchaseOrder, POLineItem
from app.models.report import AutomationLog, Report
from datetime import datetime, date, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def get_db():
    db = SessionLocal()
    try:
        return db
    except Exception:
        db.close()
        raise

def low_stock_alert_job():
    logger.info(f"[SCHEDULER] Running low_stock_alert_job at {datetime.now()}")
    db = SessionLocal()
    try:
        low_stock_products = db.query(Product).filter(
            Product.is_active == True,
            Product.stock_qty <= Product.reorder_threshold
        ).all()

        if not low_stock_products:
            log = AutomationLog(
                job_name="low_stock_alert",
                status="success",
                result_summary="No low stock products found"
            )
            db.add(log)
            db.commit()
            logger.info("[SCHEDULER] No low stock products found")
            return

        supplier_groups = {}
        for product in low_stock_products:
            sid = product.supplier_id or 0
            if sid not in supplier_groups:
                supplier_groups[sid] = []
            supplier_groups[sid].append(product)

        pos_created = 0
        for supplier_id, products in supplier_groups.items():
            if supplier_id == 0:
                continue
            po = PurchaseOrder(
                supplier_id=supplier_id,
                status="draft"
            )
            db.add(po)
            db.flush()
            for product in products:
                reorder_qty = max(product.reorder_threshold * 2 - product.stock_qty, 10)
                item = POLineItem(
                    po_id=po.id,
                    product_name=product.name,
                    qty=reorder_qty,
                    unit_price=product.unit_price
                )
                db.add(item)
            pos_created += 1

        log = AutomationLog(
            job_name="low_stock_alert",
            status="success",
            result_summary=f"Found {len(low_stock_products)} low stock products, created {pos_created} draft POs"
        )
        db.add(log)
        db.commit()
        logger.info(f"[SCHEDULER] low_stock_alert_job completed. {pos_created} draft POs created")

    except Exception as e:
        logger.error(f"[SCHEDULER] low_stock_alert_job failed: {e}")
        log = AutomationLog(
            job_name="low_stock_alert",
            status="failed",
            result_summary=str(e)
        )
        db.add(log)
        db.commit()
    finally:
        db.close()


def expiry_alert_job():
    logger.info(f"[SCHEDULER] Running expiry_alert_job at {datetime.now()}")
    db = SessionLocal()
    try:
        expiry_limit = date.today() + timedelta(days=14)
        expiring = db.query(Product).filter(
            Product.is_active == True,
            Product.expiry_date != None,
            Product.expiry_date <= expiry_limit
        ).all()

        if not expiring:
            content = "No products expiring within 14 days."
        else:
            lines = ["# Expiry Alert Report\n"]
            lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            lines.append(f"Products expiring within 14 days: {len(expiring)}\n\n")
            for p in expiring:
                days_left = (p.expiry_date - date.today()).days
                lines.append(f"## {p.name}")
                lines.append(f"- Expiry Date: {p.expiry_date}")
                lines.append(f"- Days Left: {days_left}")
                lines.append(f"- Stock Qty: {p.stock_qty}")
                if days_left <= 3:
                    lines.append("- **Suggested Action: Immediate write-off or return to supplier**")
                elif days_left <= 7:
                    lines.append("- **Suggested Action: Apply discount of 30-50%**")
                else:
                    lines.append("- **Suggested Action: Apply discount of 10-20%**")
                lines.append("")
            content = "\n".join(lines)

        report = Report(type="expiry_alert", content=content)
        db.add(report)

        log = AutomationLog(
            job_name="expiry_alert",
            status="success",
            result_summary=f"Found {len(expiring)} expiring products"
        )
        db.add(log)
        db.commit()
        logger.info(f"[SCHEDULER] expiry_alert_job completed. {len(expiring)} products found")

    except Exception as e:
        logger.error(f"[SCHEDULER] expiry_alert_job failed: {e}")
        log = AutomationLog(
            job_name="expiry_alert",
            status="failed",
            result_summary=str(e)
        )
        db.add(log)
        db.commit()
    finally:
        db.close()


def setup_scheduler():
    scheduler.add_job(
        low_stock_alert_job,
        trigger="cron",
        hour=8,
        minute=0,
        id="low_stock_alert",
        replace_existing=True
    )
    scheduler.add_job(
        expiry_alert_job,
        trigger="cron",
        hour=8,
        minute=30,
        id="expiry_alert",
        replace_existing=True
    )
    logger.info("[SCHEDULER] Jobs registered: low_stock_alert, expiry_alert")