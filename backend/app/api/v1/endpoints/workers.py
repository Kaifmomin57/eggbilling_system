from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import hash_pin, require_admin
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/workers", tags=["Workers"])


def _to_user_out(w: User, default_joined: str = "Recently") -> UserOut:
    joined_str = w.created_at.strftime("%d %b %Y") if w.created_at else default_joined
    return UserOut(
        id=w.id,
        name=w.name,
        phone=w.phone,
        role=w.role,
        is_active=w.is_active,
        joined_date=joined_str,
    )


@router.get("/", response_model=List[UserOut])
def get_workers(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    workers = db.query(User).filter(User.is_deleted == False).all()
    return [_to_user_out(w) for w in workers]


@router.post("/", response_model=UserOut)
def create_worker(
    data: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    phone_clean = data.phone.strip()
    existing = (
        db.query(User)
        .filter(User.phone == phone_clean, User.is_deleted == False)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Worker with this phone already exists"
        )

    worker = User(
        name=data.name.strip(),
        phone=phone_clean,
        pin=hash_pin(data.pin),
        role=data.role,
        is_active=data.is_active,
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return _to_user_out(worker, default_joined="Today")


@router.put("/{worker_id}", response_model=UserOut)
def update_worker(
    worker_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    worker = (
        db.query(User)
        .filter(User.id == worker_id, User.is_deleted == False)
        .first()
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    if data.name is not None:
        worker.name = data.name.strip()
    if data.phone is not None:
        phone_clean = data.phone.strip()
        dup = (
            db.query(User)
            .filter(
                User.phone == phone_clean,
                User.id != worker_id,
                User.is_deleted == False,
            )
            .first()
        )
        if dup:
            raise HTTPException(status_code=400, detail="Phone already in use")
        worker.phone = phone_clean
    if data.pin is not None and data.pin.strip():
        worker.pin = hash_pin(data.pin)
    if data.role is not None and worker.role != "ADMIN":
        worker.role = data.role
    if data.is_active is not None:
        worker.is_active = data.is_active

    db.commit()
    db.refresh(worker)
    return _to_user_out(worker)


@router.delete("/{worker_id}")
def delete_worker(
    worker_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if worker_id == admin.id:
        raise HTTPException(
            status_code=400, detail="Cannot delete your own admin account"
        )

    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    worker.is_active = False
    worker.is_deleted = True
    db.commit()
    return {"message": "Worker deleted successfully"}
