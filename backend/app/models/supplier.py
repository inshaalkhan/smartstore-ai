from sqlalchemy import Column, Integer, String, JSON
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    categories = Column(JSON, default=[])
    lead_time_days = Column(Integer, default=3)