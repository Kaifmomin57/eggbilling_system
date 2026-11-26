from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Dedicated schema for egg billing system
SCHEMA_NAME = "eggbill"

def _build_engine():
    db_url = settings.DATABASE_URL

    # Supabase / Render give a postgres:// URL — SQLAlchemy needs postgresql://
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        return create_engine(db_url, connect_args=connect_args, echo=False)

    # PostgreSQL — use connection pooling params safe for Render free tier
    engine = create_engine(
        db_url,
        connect_args={"options": f"-c search_path={SCHEMA_NAME},public"},
        pool_pre_ping=True,       # auto-reconnect on stale connections
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,         # recycle connections every 5 min
        echo=False,
    )

    # Ensure our custom schema exists
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {SCHEMA_NAME}"))
        conn.commit()

    return engine


engine = _build_engine()

is_sqlite = settings.DATABASE_URL.startswith("sqlite")
metadata = MetaData() if is_sqlite else MetaData(schema=SCHEMA_NAME)
Base = declarative_base(metadata=metadata)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
