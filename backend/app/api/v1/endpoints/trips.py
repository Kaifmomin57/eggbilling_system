from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import Trip, TripLoad, User
from app.schemas.schemas import TripCreate, TripOut, TripLoadSchema, TripSettlementSubmit

router = APIRouter(prefix="/trips", tags=["Trips"])

VALID_TRIP_STATUSES = {"DRAFT", "OUT", "SETTLEMENT", "CLOSED"}


def _is_trip_owner(t: Trip, user: User) -> bool:
    if user.role in ("ADMIN", "MANAGER"):
        return True
    return t.worker_id == user.id or (t.worker_phone and t.worker_phone == user.phone)


def build_trip_out(t: Trip) -> TripOut:
    loads = [
        TripLoadSchema(
            egg_type_id=l.egg_type_id,
            egg_type_name=l.egg_type_name,
            qty_loaded_eggs=l.qty_loaded_eggs,
            qty_sold_eggs=l.qty_sold_eggs,
            qty_returned_eggs=l.qty_returned_eggs,
        )
        for l in t.loads
    ]
    return TripOut(
        id=t.id,
        trip_no=t.trip_no,
        worker_id=t.worker_id,
        worker_name=t.worker_name,
        worker_phone=t.worker_phone,
        date=t.date,
        vehicle=t.vehicle,
        status=t.status,
        expected_cash=t.expected_cash,
        expected_online=t.expected_online,
        declared_cash=t.declared_cash,
        declared_online=t.declared_online,
        declared_empty_trays=t.declared_empty_trays,
        loads=loads,
    )


def sync_trip_loads(t: Trip, db: Session):
    from app.models.models import Bill, BillItem

    bill_items = (
        db.query(BillItem.egg_type_id, BillItem.egg_type_name, BillItem.qty_eggs)
        .join(Bill, Bill.id == BillItem.bill_id)
        .filter(Bill.trip_id == t.id, Bill.status == "ACTIVE")
        .all()
    )

    sold_map = {}
    name_map = {}
    for egg_id, name, qty in bill_items:
        sold_map[egg_id] = sold_map.get(egg_id, 0) + (qty or 0)
        name_map[egg_id] = name

    existing_egg_ids = {l.egg_type_id for l in t.loads}
    updated = False

    for load in t.loads:
        if load.egg_type_id in sold_map and load.qty_sold_eggs != sold_map[load.egg_type_id]:
            load.qty_sold_eggs = sold_map[load.egg_type_id]
            updated = True

    for egg_id, sold_qty in sold_map.items():
        if egg_id not in existing_egg_ids:
            new_load = TripLoad(
                trip_id=t.id,
                egg_type_id=egg_id,
                egg_type_name=name_map.get(egg_id, "Egg"),
                qty_loaded_eggs=sold_qty,
                qty_sold_eggs=sold_qty,
                qty_returned_eggs=0,
            )
            db.add(new_load)
            t.loads.append(new_load)
            updated = True

    if updated:
        db.commit()


@router.get("/", response_model=List[TripOut])
def get_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Trip)
    if current_user.role not in ("ADMIN", "MANAGER"):
        query = query.filter(
            or_(
                Trip.worker_id == current_user.id,
                Trip.worker_phone == current_user.phone,
            )
        )
    trips = query.order_by(Trip.created_at.desc()).all()
    for t in trips:
        sync_trip_loads(t, db)
    return [build_trip_out(t) for t in trips]


@router.get("/active", response_model=TripOut)
def get_active_trip(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Trip)
    if current_user.role not in ("ADMIN", "MANAGER"):
        query = query.filter(
            or_(
                Trip.worker_id == current_user.id,
                Trip.worker_phone == current_user.phone,
            )
        )
    trip = (
        query.filter(Trip.status.in_(["OUT", "DRAFT", "SETTLEMENT"]))
        .order_by(Trip.created_at.desc())
        .first()
    )
    if not trip:
        trip = query.order_by(Trip.created_at.desc()).first()
    if not trip:
        raise HTTPException(status_code=404, detail="No trips found")
    sync_trip_loads(trip, db)
    return build_trip_out(trip)


@router.post("/", response_model=TripOut)
def create_trip(
    data: TripCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    count = db.query(Trip).count() + 1
    today_str = datetime.now().strftime("%d%m%y")
    trip_no = f"TRP-{today_str}-{count:02d}"

    trip = Trip(
        trip_no=trip_no,
        worker_id=data.worker_id,
        worker_name=data.worker_name.strip(),
        worker_phone=data.worker_phone.strip(),
        date=data.date,
        vehicle=data.vehicle.strip(),
        status=data.status or "DRAFT",
        expected_cash=0.0,
        expected_online=0.0,
    )
    db.add(trip)
    db.flush()

    for load in data.loads:
        l = TripLoad(
            trip_id=trip.id,
            egg_type_id=load.egg_type_id,
            egg_type_name=load.egg_type_name,
            qty_loaded_eggs=load.qty_loaded_eggs,
            qty_sold_eggs=0,
            qty_returned_eggs=0,
        )
        db.add(l)

    db.commit()
    db.refresh(trip)
    return build_trip_out(trip)


@router.put("/{trip_id}/worker")
def update_trip_worker(
    trip_id: str,
    worker_id: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    worker = db.query(User).filter(User.id == worker_id, User.is_deleted == False).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    trip.worker_id = worker.id
    trip.worker_name = worker.name
    trip.worker_phone = worker.phone
    db.commit()
    return {"message": f"Trip worker_id updated to {worker_id}"}


@router.put("/{trip_id}/status")
def update_trip_status(
    trip_id: str,
    status: str,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    normalized = status.strip().upper()
    if normalized not in VALID_TRIP_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_TRIP_STATUSES))}",
        )

    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    trip.status = normalized
    db.commit()
    return {"message": f"Trip status updated to {trip.status}"}


@router.post("/{trip_id}/confirm-load")
def confirm_trip_load(
    trip_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not _is_trip_owner(trip, current_user):
        raise HTTPException(status_code=403, detail="Not authorized for this trip")

    trip.status = "OUT"
    db.commit()
    return {"message": "Trip load confirmed. Vehicle is OUT for delivery"}


@router.post("/{trip_id}/settlement", response_model=TripOut)
def submit_trip_settlement(
    trip_id: str,
    data: TripSettlementSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if not _is_trip_owner(trip, current_user):
        raise HTTPException(status_code=403, detail="Not authorized for this trip")

    trip.status = "SETTLEMENT"
    trip.declared_cash = data.declared_cash
    trip.declared_online = data.declared_online
    trip.declared_empty_trays = data.declared_empty_trays
    db.commit()
    db.refresh(trip)
    return build_trip_out(trip)
