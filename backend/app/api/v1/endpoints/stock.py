from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_admin
from app.models.models import StockEntry, EggType, User
from app.schemas.schemas import StockEntryCreate, StockEntryOut

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("/entries", response_model=List[StockEntryOut])
def get_stock_entries(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    entries = db.query(StockEntry).order_by(StockEntry.created_at.desc()).all()
    result = []
    for e in entries:
        egg_name = e.egg_type.name if e.egg_type else e.egg_type_id
        result.append(
            StockEntryOut(
                id=e.id,
                date=e.date,
                egg_type_id=e.egg_type_id,
                egg_type_name=egg_name,
                qty_trays=e.qty_trays,
                purchase_rate_per_egg=e.purchase_rate_per_egg,
                supplier=e.supplier,
                notes=e.notes,
                total_cost=e.total_cost,
            )
        )
    return result


@router.post("/entries", response_model=StockEntryOut)
def add_stock_entry(
    data: StockEntryCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    egg = (
        db.query(EggType)
        .filter(EggType.id == data.egg_type_id, EggType.is_active == True)
        .first()
    )
    if not egg:
        raise HTTPException(status_code=404, detail="Egg type not found")

    eggs_per_tray = egg.eggs_per_tray or 30
    total_cost = round(data.qty_trays * eggs_per_tray * data.purchase_rate_per_egg, 2)

    entry = StockEntry(
        date=data.date,
        egg_type_id=data.egg_type_id,
        qty_trays=data.qty_trays,
        purchase_rate_per_egg=data.purchase_rate_per_egg,
        supplier=(data.supplier or "Direct Purchase").strip(),
        notes=data.notes,
        total_cost=total_cost,
    )
    db.add(entry)
    egg.current_stock_trays += data.qty_trays
    db.commit()
    db.refresh(entry)

    return StockEntryOut(
        id=entry.id,
        date=entry.date,
        egg_type_id=entry.egg_type_id,
        egg_type_name=egg.name,
        qty_trays=entry.qty_trays,
        purchase_rate_per_egg=entry.purchase_rate_per_egg,
        supplier=entry.supplier,
        notes=entry.notes,
        total_cost=entry.total_cost,
    )


@router.delete("/entries/{entry_id}")
def delete_stock_entry(
    entry_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    entry = db.query(StockEntry).filter(StockEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Stock entry not found")

    egg = db.query(EggType).filter(EggType.id == entry.egg_type_id).first()
    if egg:
        egg.current_stock_trays = max(0, egg.current_stock_trays - entry.qty_trays)

    db.delete(entry)
    db.commit()
    return {"message": "Stock entry removed successfully"}
