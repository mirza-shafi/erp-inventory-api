from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import engine, Base
from app.api.endpoints.product import router as product_router
from app.utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup Database (Using create_all for simplicity. Alembic is better for prod)
    async with engine.begin() as conn:
        logger.info("Initializing Database...")
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred. Please try again later."},
    )

app.include_router(product_router, prefix="/api/v1/products", tags=["Products"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

import os
# Mount frontend dashboard (Ensure the frontend folder exists)
os.makedirs("frontend", exist_ok=True)
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
