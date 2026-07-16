import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

from app.database import engine
# Import models to ensure they are registered with Base metadata before create_all
from app.models import User, Employee, ParkingSlot, Booking
from app.routers import auth, employees, parking_slots, bookings, dashboard, audit_logs

load_dotenv()

app = FastAPI(
    title="Parking Management System API",
    description="Python FastAPI backend with PostgreSQL integration",
    version="1.0.0"
)

# Configure CORS
origins = [origin.strip() for origin in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]

if "*" in origins:
    raise RuntimeError("CORS_ORIGINS must list explicit origins when credentials are enabled.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(parking_slots.router)
app.include_router(bookings.router)
app.include_router(dashboard.router)
app.include_router(audit_logs.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(status_code=503, detail="PostgreSQL is unavailable") from error

    return {
        "status": "ok",
        "message": "Parking Management System API is running smoothly",
        "service": "fastapi",
        "database": "postgresql"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Parking Management System API. Go to /docs for Swagger documentation."
    }
