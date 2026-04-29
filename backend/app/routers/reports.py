from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.report import AutomationLog, Report

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/logs")
def get_logs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    logs = db.query(AutomationLog).order_by(
        AutomationLog.run_at.desc()
    ).limit(50).all()
    return logs

@router.get("/")
def get_reports(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    reports = db.query(Report).order_by(
        Report.created_at.desc()
    ).limit(20).all()
    return reports

@router.post("/trigger/low-stock")
def trigger_low_stock(current_user = Depends(get_current_user)):
    from app.scheduler import low_stock_alert_job
    low_stock_alert_job()
    return {"message": "Low stock alert job triggered manually"}

@router.post("/trigger/expiry")
def trigger_expiry(current_user = Depends(get_current_user)):
    from app.scheduler import expiry_alert_job
    expiry_alert_job()
    return {"message": "Expiry alert job triggered manually"}