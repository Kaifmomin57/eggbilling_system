from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Bill, BillItem, Customer, Trip, TripLoad, User
from app.schemas.schemas import BillCreate, BillOut, BillItemSchema

router = APIRouter(prefix="/bills", tags=["Bills"])


def build_bill_out(b: Bill) -> BillOut:
    items = [
        BillItemSchema(
            egg_type_id=i.egg_type_id,
            egg_type_name=i.egg_type_name,
            qty_eggs=i.qty_eggs,
            rate=i.rate,
            amount=i.amount,
        )
        for i in b.items
    ]
    return BillOut(
        id=b.id,
        bill_no=b.bill_no,
        trip_id=b.trip_id,
        customer_id=b.customer_id,
        customer_name=b.customer_name,
        customer_phone=b.customer_phone,
        total_amount=b.total_amount,
        paid_cash=b.paid_cash,
        paid_online=b.paid_online,
        due_amount=b.due_amount,
        payment_mode=b.payment_mode,
        trays_given=b.trays_given,
        trays_returned=b.trays_returned,
        customer_pending_trays_after=b.customer_pending_trays_after,
        customer_due_after=b.customer_due_after,
        status=b.status,
        created_at_time=b.created_at_time,
        items=items,
    )


@router.get("/", response_model=List[BillOut])
def get_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role in ("ADMIN", "MANAGER"):
        bills = db.query(Bill).order_by(Bill.created_at.desc()).all()
    else:
        my_trip_ids = [
            t.id
            for t in db.query(Trip.id)
            .filter(
                or_(
                    Trip.worker_id == current_user.id,
                    Trip.worker_phone == current_user.phone,
                )
            )
            .all()
        ]
        if not my_trip_ids:
            return []
        bills = (
            db.query(Bill)
            .filter(Bill.trip_id.in_(my_trip_ids))
            .order_by(Bill.created_at.desc())
            .all()
        )
    return [build_bill_out(b) for b in bills]


@router.post("/", response_model=BillOut)
def create_bill(
    data: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == data.customer_id, Customer.is_active == True)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Server-side financial integrity validation
    computed_total = round(sum(it.qty_eggs * it.rate for it in data.items), 2)
    if abs(computed_total - data.total_amount) > 2.0:
        raise HTTPException(
            status_code=400,
            detail="Bill total does not match item quantities and rates",
        )

    payment_sum = round(data.paid_cash + data.paid_online + data.due_amount, 2)
    if abs(payment_sum - data.total_amount) > 2.0:
        raise HTTPException(
            status_code=400,
            detail="Paid cash + online + due must equal total amount",
        )

    trip = None
    if data.trip_id:
        trip = db.query(Trip).filter(Trip.id == data.trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        if current_user.role not in ("ADMIN", "MANAGER"):
            if trip.worker_id != current_user.id and trip.worker_phone != current_user.phone:
                raise HTTPException(
                    status_code=403, detail="Not authorized to bill on this trip"
                )

    count = db.query(Bill).count() + 1
    today_str = datetime.now().strftime("%d%m%y")
    bill_no = f"EG-{today_str}-{count:03d}"
    now_time = datetime.now().strftime("%I:%M %p")

    net_trays = data.trays_given - data.trays_returned
    new_pending_trays = max(0, customer.pending_trays + net_trays)
    new_due_amount = customer.due_amount + data.due_amount

    customer.pending_trays = new_pending_trays
    customer.due_amount = new_due_amount

    bill = Bill(
        bill_no=bill_no,
        trip_id=data.trip_id,
        customer_id=data.customer_id,
        customer_name=customer.name,
        customer_phone=customer.phone,
        total_amount=data.total_amount,
        paid_cash=data.paid_cash,
        paid_online=data.paid_online,
        due_amount=data.due_amount,
        payment_mode=data.payment_mode,
        trays_given=data.trays_given,
        trays_returned=data.trays_returned,
        customer_pending_trays_after=new_pending_trays,
        customer_due_after=new_due_amount,
        status="ACTIVE",
        created_at_time=now_time,
    )
    db.add(bill)
    db.flush()

    for it in data.items:
        bi = BillItem(
            bill_id=bill.id,
            egg_type_id=it.egg_type_id,
            egg_type_name=it.egg_type_name,
            qty_eggs=it.qty_eggs,
            rate=it.rate,
            amount=round(it.qty_eggs * it.rate, 2),
        )
        db.add(bi)

    if trip:
        if trip.loads:
            for it in data.items:
                load = next((l for l in trip.loads if l.egg_type_id == it.egg_type_id), None)
                if not load:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{it.egg_type_name} is not loaded on this trip",
                    )
                remaining = max(
                    0,
                    load.qty_loaded_eggs - load.qty_sold_eggs - load.qty_returned_eggs,
                )
                if it.qty_eggs > remaining:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough {it.egg_type_name} in trip (requested {it.qty_eggs}, left {remaining})",
                    )

        trip.expected_cash += data.paid_cash
        trip.expected_online += data.paid_online
        for it in data.items:
            load = next((l for l in trip.loads if l.egg_type_id == it.egg_type_id), None)
            if load:
                load.qty_sold_eggs += it.qty_eggs
            else:
                new_load = TripLoad(
                    trip_id=trip.id,
                    egg_type_id=it.egg_type_id,
                    egg_type_name=it.egg_type_name,
                    qty_loaded_eggs=it.qty_eggs,
                    qty_sold_eggs=it.qty_eggs,
                    qty_returned_eggs=0,
                )
                db.add(new_load)

    db.commit()
    db.refresh(bill)
    return build_bill_out(bill)
