import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

class Product(Base):
    __tablename__ = "erp_inventory_items"  # New table for fresh schema without migration errors

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    sku = Column(String, unique=True, index=True, nullable=False) # Barcode/SKU
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    cost_price = Column(Float, nullable=False, default=0.0) # Purchasing Cost
    price = Column(Float, nullable=False, default=0.0)      # Selling Margin
    category = Column(String, index=True, nullable=True)
    location = Column(String, nullable=True)  # Warehouse Bin/Aisle
    supplier = Column(String, nullable=True)  # Vendor tracking
    status = Column(String, default="Active") # Operational state
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
