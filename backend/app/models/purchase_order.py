from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(String, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    line_items = relationship("POLineItem", back_populates="purchase_order")

class POLineItem(Base):
    __tablename__ = "po_line_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_name = Column(String, nullable=False)
    qty = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="line_items")