import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

from app.database import engine, SessionLocal
# Import models to ensure they are registered with Base metadata before create_all
from app.models import User, Employee, ParkingSlot, Booking
from app.routers import auth, employees, parking_slots, bookings, dashboard, audit_logs

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default admin user on startup if no users exist in the database
    from app.models.user import User as UserModel
    from app.dependencies import get_password_hash
    
    db = SessionLocal()
    try:
        if db.query(UserModel).count() == 0:
            admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
            admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "AdminPassword123")
            admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@parkwise.com")
            
            hashed_password = get_password_hash(admin_password)
            default_admin = UserModel(
                username=admin_username,
                email=admin_email,
                hashed_password=hashed_password,
                role="Admin",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print(f"INFO:     Seeded default admin user: {admin_username}")
    except Exception as e:
        print(f"ERROR:    Failed to seed default admin: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="Parking Management System API",
    description="Python FastAPI backend with PostgreSQL integration",
    version="1.0.0",
    lifespan=lifespan
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
