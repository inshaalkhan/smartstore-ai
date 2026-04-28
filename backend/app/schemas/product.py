from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ProductCreate(BaseModel):
    name: str
    sku: str
    category: str
    stock_qty: int
    unit_price: float
    expiry_date: Optional[date] = None
    reorder_threshold: int = 10
    supplier_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stock_qty: Optional[int] = None
    unit_price: Optional[float] = None
    expiry_date: Optional[date] = None
    reorder_threshold: Optional[int] = None
    supplier_id: Optional[int] = None

class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    category: str
    stock_qty: int
    unit_price: float
    expiry_date: Optional[date] = None
    reorder_threshold: int
    is_active: bool
    supplier_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockHistoryResponse(BaseModel):
    id: int
    product_id: int
    change_qty: int
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True