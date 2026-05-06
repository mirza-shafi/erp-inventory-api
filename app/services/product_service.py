from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
import uuid

class ProductService:
    @staticmethod
    async def create_product(db: AsyncSession, product: ProductCreate) -> Product:
        # Check uniqueness
        query = select(Product).where(Product.name == product.name)
        result = await db.execute(query)
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Product name already exists")
        
        new_product = Product(**product.model_dump())
        db.add(new_product)
        await db.commit()
        await db.refresh(new_product)
        return new_product

    @staticmethod
    async def get_products(db: AsyncSession, category: str = None) -> list[Product]:
        query = select(Product)
        if category:
            query = query.where(Product.category == category)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product:
        query = select(Product).where(Product.id == product_id)
        result = await db.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product

    @staticmethod
    async def get_low_stock(db: AsyncSession) -> list[Product]:
        query = select(Product).where(Product.quantity < 5)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def update_product(db: AsyncSession, product_id: uuid.UUID, obj_in: ProductUpdate) -> Product:
        product = await ProductService.get_product_by_id(db, product_id)
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Check uniqueness if name is updated
        if "name" in update_data and update_data["name"] != product.name:
            query = select(Product).where(Product.name == update_data["name"])
            result = await db.execute(query)
            if result.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Product name already exists")

        for field, value in update_data.items():
            setattr(product, field, value)
            
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def delete_product(db: AsyncSession, product_id: uuid.UUID):
        product = await ProductService.get_product_by_id(db, product_id)
        await db.delete(product)
        await db.commit()
