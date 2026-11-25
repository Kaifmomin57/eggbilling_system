from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import DamageRecord, User
from app.schemas.schemas import DamageCreate, DamageOut

router = APIRouter(prefix="/damages", tags=["Damages"])

VALID_DAMAGE_STATUSES = {"PENDING", "APPROVED", "REJECTED"}


@router.get("/", response_model=List[DamageOut])
def get_damages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(DamageRecord)
    if current_user.role not in ("ADMIN", "MANAGER"):
        query = query.filter(DamageRecord.worker_name == current_user.name)
    return query.order_by(DamageRecord.created_at.desc()).all()


@router.post("/", response_model=DamageOut)
def report_damage(
    data: DamageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Prevent worker name spoofing: force authenticated user's name for non-admins
    reporter_name = (
        data.worker_name.strip()
        if current_user.role in ("ADMIN", "MANAGER")
        else current_user.name
    )

    dmg = DamageRecord(
        date=datetime.now().strftime("%d %b %Y"),
        worker_name=reporter_name,
        egg_type_name=data.egg_type_name.strip(),
        category=data.category,
        qty_eggs=data.qty_eggs,
        loss_amount=data.loss_amount,
        status="PENDING",
        reason=data.reason.strip(),
    )
    db.add(dmg)
    db.commit()
    db.refresh(dmg)
    return dmg


@router.put("/{damage_id}/status", response_model=DamageOut)
def update_damage_status(
    damage_id: str,
    status: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    normalized = status.strip().upper()
    if normalized not in VALID_DAMAGE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_DAMAGE_STATUSES))}",
        )

    dmg = db.query(DamageRecord).filter(DamageRecord.id == damage_id).first()
    if not dmg:
        raise HTTPException(status_code=404, detail="Damage record not found")

    dmg.status = normalized
    db.commit()
    db.refresh(dmg)
    return dmg
