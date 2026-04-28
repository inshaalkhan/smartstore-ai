from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderResponse, POStatusUpdate
from app.services.purchase_order import (
    get_all_pos, get_po_by_id, create_po, update_po_status
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/purchase-orders", tags=["purchase-orders"])

@router.get("/", response_model=list[PurchaseOrderResponse])
def list_pos(
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_all_pos(db, supplier_id)

@router.post("/", response_model=PurchaseOrderResponse, status_code=201)
def create(
    po: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_po(db, po)

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_po(
    po_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    po = get_po_by_id(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    return po

@router.patch("/{po_id}/status", response_model=PurchaseOrderResponse)
def update_status(
    po_id: int,
    status_update: POStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    po, error = update_po_status(db, po_id, status_update)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return po

@router.post("/{po_id}/send-email")
def send_email(
    po_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    po = get_po_by_id(db, po_id)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    print(f"[EMAIL MOCK] Sending PO #{po_id} to supplier {po.supplier_id}")
    return {"message": f"PO #{po_id} email sent (mocked)"}