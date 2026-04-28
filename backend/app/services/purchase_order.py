from sqlalchemy.orm import Session
from app.models.purchase_order import PurchaseOrder, POLineItem
from app.schemas.purchase_order import PurchaseOrderCreate, POStatusUpdate

VALID_TRANSITIONS = {
    "draft": "sent",
    "sent": "acknowledged",
    "acknowledged": "received"
}

def get_all_pos(db: Session, supplier_id: int = None):
    query = db.query(PurchaseOrder)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    return query.order_by(PurchaseOrder.created_at.desc()).all()

def get_po_by_id(db: Session, po_id: int):
    return db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()

def create_po(db: Session, po: PurchaseOrderCreate):
    db_po = PurchaseOrder(supplier_id=po.supplier_id, status="draft")
    db.add(db_po)
    db.flush()
    for item in po.line_items:
        db_item = POLineItem(po_id=db_po.id, **item.model_dump())
        db.add(db_item)
    db.commit()
    db.refresh(db_po)
    return db_po

def update_po_status(db: Session, po_id: int, status_update: POStatusUpdate):
    po = get_po_by_id(db, po_id)
    if not po:
        return None, "PO not found"
    expected_next = VALID_TRANSITIONS.get(po.status)
    if status_update.status != expected_next:
        return None, f"Invalid transition. Current: {po.status}, next must be: {expected_next}"
    po.status = status_update.status
    db.commit()
    db.refresh(po)
    return po, None