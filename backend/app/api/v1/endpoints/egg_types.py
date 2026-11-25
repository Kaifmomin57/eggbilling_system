import re
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import EggType, User
from app.schemas.schemas import EggTypeOut, EggTypeCreate, EggTypeUpdate

router = APIRouter(prefix="/egg-types", tags=["Egg Types"])


@router.get("/", response_model=List[EggTypeOut])
def get_egg_types(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    return db.query(EggType).filter(EggType.is_active == True).all()


@router.get("/{egg_type_id}", response_model=EggTypeOut)
def get_egg_type(
    egg_type_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    egg = (
        db.query(EggType)
        .filter(EggType.id == egg_type_id, EggType.is_active == True)
        .first()
    )
    if not egg:
        raise HTTPException(status_code=404, detail="Egg type not found")
    return egg


@router.post("/", response_model=EggTypeOut, status_code=status.HTTP_201_CREATED)
def create_egg_type(
    egg_in: EggTypeCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    egg_id = egg_in.id
    if not egg_id:
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", egg_in.name.lower()).strip("-")
        egg_id = f"egg-{slug}" if slug else f"egg-{uuid.uuid4().hex[:8]}"

    existing = db.query(EggType).filter(EggType.id == egg_id).first()
    if existing:
        egg_id = f"{egg_id}-{uuid.uuid4().hex[:4]}"

    egg = EggType(
        id=egg_id,
        name=egg_in.name.strip(),
        category=egg_in.category,
        eggs_per_tray=egg_in.eggs_per_tray,
        default_rate=egg_in.default_rate,
        cost_price=egg_in.cost_price,
        current_stock_trays=egg_in.current_stock_trays or 0,
        is_active=True,
    )
    db.add(egg)
    db.commit()
    db.refresh(egg)
    return egg


@router.put("/{egg_type_id}", response_model=EggTypeOut)
def update_egg_type(
    egg_type_id: str,
    egg_in: EggTypeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    egg = db.query(EggType).filter(EggType.id == egg_type_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Egg type not found")

    update_data = egg_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(egg, field, val)

    db.commit()
    db.refresh(egg)
    return egg


@router.delete("/{egg_type_id}")
def delete_egg_type(
    egg_type_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    egg = db.query(EggType).filter(EggType.id == egg_type_id).first()
    if not egg:
        raise HTTPException(status_code=404, detail="Egg type not found")

    egg.is_active = False
    db.commit()
    return {"message": "Egg type removed successfully"}
