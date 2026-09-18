import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Trade-off note: DATABASE_URL defaults to local SQLite for zero-setup dev.
# In production (Render), set DATABASE_URL to a Postgres connection string.
# Sites are stored as GeoJSON (JSON column) rather than native PostGIS geometry
# columns -- this keeps the schema portable across SQLite/Postgres and avoids
# needing the PostGIS extension enabled during the hackathon window, while still
# giving the frontend real GeoJSON polygons to render on Mapbox. Documented as a
# deliberate scope trade-off in the README.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./darukaa.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
