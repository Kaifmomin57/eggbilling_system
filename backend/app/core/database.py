from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Dedicated schema for egg billing system inside billsystem database
SCHEMA_NAME = "eggbill"

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {"options": f"-c search_path={SCHEMA_NAME},public"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Auto-create the schema if it does not exist before creating tables
if not settings.DATABASE_URL.startswith("sqlite"):
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME}"))
        conn.commit()

metadata = MetaData(schema=SCHEMA_NAME) if not settings.DATABASE_URL.startswith("sqlite") else MetaData()
Base = declarative_base(metadata=metadata)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
