from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services.supplier import (
    get_all_suppliers, get_supplier_by_id,
    create_supplier, update_supplier, delete_supplier
)
from app.routers.auth import get_current_user, require_admin

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_all_suppliers(db)

@router.post("/", response_model=SupplierResponse, status_code=201)
def create(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    return create_supplier(db, supplier)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    supplier = get_supplier_by_id(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update(
    supplier_id: int,
    updates: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    supplier = update_supplier(db, supplier_id, updates)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.delete("/{supplier_id}")
def delete(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    supplier = delete_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}