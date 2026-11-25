from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_client_ip,
    get_current_user,
    hash_pin,
    is_hashed_pin,
    login_rate_limiter,
    verify_pin,
)
from app.models.models import User
from app.schemas.auth import WorkerLoginRequest, AdminLoginRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/worker-login", response_model=AuthResponse)
def worker_login(
    payload: WorkerLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    phone_clean = payload.phone.strip()
    pin_clean = payload.pin.strip()
    rate_key = f"worker:{get_client_ip(request)}:{phone_clean}"

    if login_rate_limiter.is_limited(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Bahut zyada galat attempts. 15 minute baad dubara koshish karein.",
        )

    worker = (
        db.query(User)
        .filter(User.phone == phone_clean, User.is_deleted == False)
        .first()
    )

    if not worker or not verify_pin(pin_clean, worker.pin):
        login_rate_limiter.record_hit(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Galat phone number ya PIN! Dubara koshish karein.",
        )

    if not worker.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Aapka account inactive hai. Admin se sampark karein.",
        )

    login_rate_limiter.reset(rate_key)

    # Auto-upgrade legacy plaintext PIN to bcrypt hash
    if not is_hashed_pin(worker.pin):
        worker.pin = hash_pin(pin_clean)
        db.commit()

    token = create_access_token(
        data={"sub": worker.id, "role": worker.role, "phone": worker.phone}
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": worker.id,
            "name": worker.name,
            "phone": worker.phone,
            "role": worker.role,
        },
    )


@router.post("/admin-login", response_model=AuthResponse)
def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    phone_clean = payload.phone.strip()
    password_clean = payload.password.strip()
    rate_key = f"admin:{get_client_ip(request)}:{phone_clean}"

    if login_rate_limiter.is_limited(rate_key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Bahut zyada galat attempts. 15 minute baad dubara koshish karein.",
        )

    admin = (
        db.query(User)
        .filter(
            User.phone == phone_clean,
            User.role == "ADMIN",
            User.is_deleted == False,
        )
        .first()
    )

    if not admin or not verify_pin(password_clean, admin.pin):
        login_rate_limiter.record_hit(rate_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Galat phone number ya Password! Dubara daalein.",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account inactive hai",
        )

    login_rate_limiter.reset(rate_key)

    # Auto-upgrade legacy plaintext PIN to bcrypt hash
    if not is_hashed_pin(admin.pin):
        admin.pin = hash_pin(password_clean)
        db.commit()

    token = create_access_token(
        data={"sub": admin.id, "role": "ADMIN", "phone": admin.phone}
    )

    return AuthResponse(
        access_token=token,
        user={
            "id": admin.id,
            "name": admin.name,
            "phone": admin.phone,
            "role": "ADMIN",
        },
    )


@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role,
    }
