from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate

def get_all_suppliers(db: Session):
    return db.query(Supplier).all()

def get_supplier_by_id(db: Session, supplier_id: int):
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()

def create_supplier(db: Session, supplier: SupplierCreate):
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

def update_supplier(db: Session, supplier_id: int, updates: SupplierUpdate):
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        return None
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(supplier, key, value)
    db.commit()
    db.refresh(supplier)
    return supplier

def delete_supplier(db: Session, supplier_id: int):
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        return None
    db.delete(supplier)
    db.commit()
    return supplier