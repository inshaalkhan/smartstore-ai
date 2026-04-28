from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, StockHistoryResponse
from app.services.product import (
    get_all_products, get_product_by_id,
    create_product, update_product,
    delete_product, get_stock_history, get_forecast
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/")
def list_products(
    page: int = 1,
    page_size: int = 10,
    category: Optional[str] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    products, total = get_all_products(db, page, page_size, category, status, keyword)
    return {"total": total, "page": page, "page_size": page_size, "products": products}

@router.post("/", response_model=ProductResponse, status_code=201)
def create(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return create_product(db, product)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}", response_model=ProductResponse)
def update(
    product_id: int,
    updates: ProductUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = update_product(db, product_id, updates)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.delete("/{product_id}")
def delete(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = delete_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@router.get("/{product_id}/history", response_model=list[StockHistoryResponse])
def stock_history(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_stock_history(db, product_id)

@router.get("/{product_id}/forecast")
def forecast(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"product_id": product_id, "forecast": get_forecast(db, product_id)}