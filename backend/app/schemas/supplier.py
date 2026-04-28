from pydantic import BaseModel
from typing import Optional, List

class SupplierCreate(BaseModel):
    name: str
    email: str
    categories: List[str] = []
    lead_time_days: int = 3

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    categories: Optional[List[str]] = None
    lead_time_days: Optional[int] = None

class SupplierResponse(BaseModel):
    id: int
    name: str
    email: str
    categories: List[str]
    lead_time_days: int

    class Config:
        from_attributes = True