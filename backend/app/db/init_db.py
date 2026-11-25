from sqlalchemy import text
from app.core.database import SessionLocal, engine, SCHEMA_NAME
from app.core.config import settings
from app.core.security import hash_pin, is_hashed_pin
from app.models.models import User, EggType


def _ensure_pin_column_width():
    """Ensure users.pin can hold 60+ char bcrypt hashes even on existing DBs."""
    if settings.DATABASE_URL.startswith("sqlite"):
        return
    try:
        with engine.connect() as conn:
            conn.execute(
                text(f"ALTER TABLE {SCHEMA_NAME}.users ALTER COLUMN pin TYPE VARCHAR(255)")
            )
            conn.commit()
    except Exception:
        pass


def init_db():
    _ensure_pin_column_width()
    db = SessionLocal()
    try:
        # 1. Base Egg Variety configuration (empty stock)
        if db.query(EggType).count() == 0:
            egg_types = [
                EggType(id="egg-white", name="White Table Egg", category="LOW", eggs_per_tray=30, default_rate=6.00, cost_price=5.00, current_stock_trays=0),
                EggType(id="egg-brown", name="Brown Country Egg", category="HIGH", eggs_per_tray=30, default_rate=8.00, cost_price=7.00, current_stock_trays=0),
                EggType(id="egg-desi", name="Pure Desi Egg", category="HIGH", eggs_per_tray=30, default_rate=12.00, cost_price=10.00, current_stock_trays=0),
                EggType(id="egg-double", name="Double Yolk Jumbo", category="HIGH", eggs_per_tray=30, default_rate=9.00, cost_price=8.00, current_stock_trays=0),
            ]
            db.add_all(egg_types)
            db.commit()

        # 2. Only single Admin account (hashed PIN)
        admin = db.query(User).filter(User.role == "ADMIN").first()
        if not admin:
            admin = User(
                id="admin-01",
                name="Shop Admin",
                phone="9999999999",
                pin=hash_pin("admin123"),
                role="ADMIN",
                is_active=True,
            )
            db.add(admin)
            db.commit()

        # 3. Migrate any legacy plaintext PINs in users table to bcrypt hashes
        users = db.query(User).all()
        migrated = False
        for u in users:
            if u.pin and not is_hashed_pin(u.pin):
                u.pin = hash_pin(u.pin)
                migrated = True
        if migrated:
            db.commit()

    finally:
        db.close()
