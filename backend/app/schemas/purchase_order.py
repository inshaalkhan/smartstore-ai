from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class POLineItemCreate(BaseModel):
    product_name: str
    qty: int
    unit_price: float

class POLineItemResponse(BaseModel):
    id: int
    product_name: str
    qty: int
    unit_price: float

    class Config:
        from_attributes = True

class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    line_items: List[POLineItemCreate]

class PurchaseOrderResponse(BaseModel):
    id: int
    supplier_id: int
    status: str
    created_at: datetime
    line_items: List[POLineItemResponse] = []

    class Config:
        from_attributes = True

class POStatusUpdate(BaseModel):
    status: str