import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Keep credentials in backend/.env, never in source control.  The database
# name is pms_db, which is the PostgreSQL database created for this project.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured. Create backend/.env from "
        "backend/.env.example and provide the PostgreSQL password."
    )

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)

# pool_pre_ping validates pooled connections before use, helping the API
# recover cleanly if PostgreSQL restarts. pg8000's timeout avoids an
# indefinitely blocked API startup when PostgreSQL is not running.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"timeout": 10})

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()
