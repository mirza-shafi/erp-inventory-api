from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.api.dependencies import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut
from app.services.product_service import ProductService

router = APIRouter()

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await ProductService.create_product(db, product)

@router.get("/", response_model=List[ProductOut])
async def get_products(category: str = Query(None, description="Filter by category"), db: AsyncSession = Depends(get_db)):
    return await ProductService.get_products(db, category)

@router.get("/low-stock", response_model=List[ProductOut])
async def get_low_stock_products(db: AsyncSession = Depends(get_db)):
    return await ProductService.get_low_stock(db)

@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await ProductService.get_product_by_id(db, product_id)

@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: uuid.UUID, product: ProductUpdate, db: AsyncSession = Depends(get_db)):
    return await ProductService.update_product(db, product_id, product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await ProductService.delete_product(db, product_id)
