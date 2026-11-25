from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.models import Customer, CustomerRate, EggType, Payment, User
from app.schemas.schemas import (
    CustomerCreate,
    CustomerUpdate,
    CustomerOut,
    CustomerRateSchema,
    PaymentCollect,
)

router = APIRouter(prefix="/customers", tags=["Customers"])


def build_customer_out(c: Customer) -> CustomerOut:
    rates_dict: Dict[str, float] = {}
    if c.rates:
        for r in c.rates:
            rates_dict[r.egg_type_id] = r.rate

    return CustomerOut(
        id=c.id,
        name=c.name,
        phone=c.phone,
        area=c.area or "Main Area",
        due_amount=c.due_amount,
        pending_trays=c.pending_trays,
        notes=c.notes,
        rates=rates_dict,
    )


@router.get("/", response_model=List[CustomerOut])
def get_customers(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    customers = db.query(Customer).filter(Customer.is_active == True).all()
    return [build_customer_out(c) for c in customers]


@router.post("/", response_model=CustomerOut)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = Customer(
        name=data.name.strip(),
        phone=data.phone.strip(),
        area=data.area.strip() if data.area else "Main Area",
        due_amount=data.opening_due or 0.0,
        pending_trays=0,
        notes=data.notes.strip() if data.notes else None,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return build_customer_out(customer)


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_active == True)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if data.name is not None:
        customer.name = data.name.strip()
    if data.phone is not None:
        customer.phone = data.phone.strip()
    if data.area is not None:
        customer.area = data.area.strip()
    if data.notes is not None:
        customer.notes = data.notes.strip()

    db.commit()
    db.refresh(customer)
    return build_customer_out(customer)


@router.post("/{customer_id}/rates")
def set_customer_rate(
    customer_id: str,
    data: CustomerRateSchema,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_active == True)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    egg = (
        db.query(EggType)
        .filter(EggType.id == data.egg_type_id, EggType.is_active == True)
        .first()
    )
    if not egg:
        raise HTTPException(status_code=404, detail="Egg type not found")

    existing_rate = (
        db.query(CustomerRate)
        .filter(
            CustomerRate.customer_id == customer_id,
            CustomerRate.egg_type_id == data.egg_type_id,
        )
        .first()
    )

    if existing_rate:
        existing_rate.rate = data.rate
    else:
        new_rate = CustomerRate(
            customer_id=customer_id,
            egg_type_id=data.egg_type_id,
            rate=data.rate,
        )
        db.add(new_rate)

    db.commit()
    return {"message": "Rate updated successfully", "rate": data.rate}


@router.post("/{customer_id}/collect-payment", response_model=CustomerOut)
def collect_payment(
    customer_id: str,
    data: PaymentCollect,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_active == True)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.due_amount = max(0.0, customer.due_amount - data.amount)

    payment = Payment(
        customer_id=customer_id,
        amount=data.amount,
        mode=data.mode,
        date=datetime.now().strftime("%d %b %Y"),
        notes=data.notes,
    )
    db.add(payment)
    db.commit()
    db.refresh(customer)
    return build_customer_out(customer)
