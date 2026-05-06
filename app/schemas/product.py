from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ProductBase(BaseModel):
    sku: str = Field(..., max_length=50, description="Stock Keeping Unit / Barcode")
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: int = Field(..., ge=0, description="Stock quantity cannot be negative")
    cost_price: float = Field(..., ge=0, description="Total cost to procure item")
    price: float = Field(..., ge=0, description="Selling price")
    category: Optional[str] = None
    location: Optional[str] = Field(None, max_length=50, description="Warehouse Location/Bin")
    supplier: Optional[str] = Field(None, max_length=100, description="Vendor/Supplier Info")
    status: Optional[str] = Field("Active", description="Active or Discontinued")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    category: Optional[str] = None
    location: Optional[str] = None
    supplier: Optional[str] = None
    status: Optional[str] = None

class ProductOut(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
