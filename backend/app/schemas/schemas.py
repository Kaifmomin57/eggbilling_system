from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field


# User / Worker
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=6, max_length=20)
    role: Literal["DELIVERY", "MANAGER", "ADMIN"] = "DELIVERY"
    is_active: bool = True


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=6, max_length=20)
    pin: str = Field(..., min_length=4, max_length=20)
    role: Literal["DELIVERY", "MANAGER"] = "DELIVERY"
    is_active: bool = True


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=6, max_length=20)
    pin: Optional[str] = Field(default=None, min_length=4, max_length=20)
    role: Optional[Literal["DELIVERY", "MANAGER"]] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    is_active: bool
    joined_date: Optional[str] = None

    class Config:
        from_attributes = True


# Egg Type
class EggTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: Literal["HIGH", "LOW"] = "LOW"
    eggs_per_tray: int = Field(default=30, gt=0, le=500)
    default_rate: float = Field(..., ge=0, le=10000)
    cost_price: float = Field(..., ge=0, le=10000)
    current_stock_trays: int = Field(default=0, ge=0)
    is_active: bool = True


class EggTypeCreate(BaseModel):
    id: Optional[str] = Field(default=None, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    category: Literal["HIGH", "LOW"] = "LOW"
    eggs_per_tray: int = Field(default=30, gt=0, le=500)
    default_rate: float = Field(..., ge=0, le=10000)
    cost_price: float = Field(..., ge=0, le=10000)
    current_stock_trays: Optional[int] = Field(default=0, ge=0)


class EggTypeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[Literal["HIGH", "LOW"]] = None
    eggs_per_tray: Optional[int] = Field(default=None, gt=0, le=500)
    default_rate: Optional[float] = Field(default=None, ge=0, le=10000)
    cost_price: Optional[float] = Field(default=None, ge=0, le=10000)
    current_stock_trays: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None


class EggTypeOut(EggTypeBase):
    id: str

    class Config:
        from_attributes = True


# Customer Rate
class CustomerRateSchema(BaseModel):
    egg_type_id: str = Field(..., min_length=1, max_length=50)
    rate: float = Field(..., ge=0, le=10000)


# Customer
class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    phone: str = Field(default="", max_length=20)
    area: str = Field(default="Main Area", max_length=255)
    notes: Optional[str] = Field(default=None, max_length=1000)


class CustomerCreate(CustomerBase):
    opening_due: Optional[float] = Field(default=0.0, ge=0, le=10000000)


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    area: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=1000)


class CustomerOut(CustomerBase):
    id: str
    due_amount: float
    pending_trays: int
    rates: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True


# Stock Entry
class StockEntryCreate(BaseModel):
    date: str = Field(..., min_length=1, max_length=30)
    egg_type_id: str = Field(..., min_length=1, max_length=50)
    qty_trays: int = Field(..., gt=0, le=100000)
    purchase_rate_per_egg: float = Field(..., ge=0, le=10000)
    supplier: Optional[str] = Field(default="Direct Purchase", max_length=150)
    notes: Optional[str] = Field(default=None, max_length=1000)


class StockEntryOut(BaseModel):
    id: str
    date: str
    egg_type_id: str
    egg_type_name: str
    qty_trays: int
    purchase_rate_per_egg: float
    supplier: str
    notes: Optional[str] = None
    total_cost: float

    class Config:
        from_attributes = True


# Trip Load
class TripLoadSchema(BaseModel):
    egg_type_id: str = Field(..., min_length=1, max_length=50)
    egg_type_name: str = Field(..., min_length=1, max_length=100)
    qty_loaded_eggs: int = Field(..., ge=0, le=1000000)
    qty_sold_eggs: int = Field(default=0, ge=0)
    qty_returned_eggs: int = Field(default=0, ge=0)


class TripCreate(BaseModel):
    worker_id: Optional[str] = Field(default=None, max_length=36)
    worker_name: str = Field(..., min_length=1, max_length=100)
    worker_phone: str = Field(..., min_length=1, max_length=20)
    date: str = Field(..., min_length=1, max_length=30)
    vehicle: str = Field(..., min_length=1, max_length=100)
    status: Literal["DRAFT", "OUT", "SETTLEMENT", "CLOSED"] = "DRAFT"
    loads: List[TripLoadSchema]


class TripSettlementSubmit(BaseModel):
    declared_cash: float = Field(..., ge=0, le=10000000)
    declared_online: float = Field(..., ge=0, le=10000000)
    declared_empty_trays: int = Field(..., ge=0, le=100000)


class TripOut(BaseModel):
    id: str
    trip_no: str
    worker_id: Optional[str] = None
    worker_name: str
    worker_phone: str
    date: str
    vehicle: str
    status: str
    expected_cash: float
    expected_online: float
    declared_cash: Optional[float] = None
    declared_online: Optional[float] = None
    declared_empty_trays: Optional[int] = None
    loads: List[TripLoadSchema] = []

    class Config:
        from_attributes = True


# Bill Items
class BillItemSchema(BaseModel):
    egg_type_id: str = Field(..., min_length=1, max_length=50)
    egg_type_name: str = Field(..., min_length=1, max_length=100)
    qty_eggs: int = Field(..., gt=0, le=1000000)
    rate: float = Field(..., ge=0, le=10000)
    amount: float = Field(..., ge=0, le=10000000)


# Bill
class BillCreate(BaseModel):
    trip_id: Optional[str] = Field(default=None, max_length=36)
    customer_id: str = Field(..., min_length=1, max_length=36)
    customer_name: str = Field(..., min_length=1, max_length=150)
    customer_phone: str = Field(default="", max_length=20)
    items: List[BillItemSchema] = Field(..., min_length=1)
    total_amount: float = Field(..., ge=0, le=10000000)
    paid_cash: float = Field(default=0.0, ge=0, le=10000000)
    paid_online: float = Field(default=0.0, ge=0, le=10000000)
    due_amount: float = Field(default=0.0, ge=0, le=10000000)
    payment_mode: Literal["CASH", "ONLINE", "MIX", "DUE"] = "CASH"
    trays_given: int = Field(default=0, ge=0, le=100000)
    trays_returned: int = Field(default=0, ge=0, le=100000)


class BillOut(BillCreate):
    id: str
    bill_no: str
    customer_pending_trays_after: int
    customer_due_after: float
    status: str
    created_at_time: Optional[str] = None

    class Config:
        from_attributes = True


# Damage
class DamageCreate(BaseModel):
    worker_name: str = Field(..., min_length=1, max_length=100)
    egg_type_name: str = Field(..., min_length=1, max_length=100)
    category: Literal["HIGH", "LOW"] = "LOW"
    qty_eggs: int = Field(..., gt=0, le=100000)
    loss_amount: float = Field(..., ge=0, le=10000000)
    reason: str = Field(..., min_length=2, max_length=500)


class DamageOut(DamageCreate):
    id: str
    date: str
    status: str

    class Config:
        from_attributes = True


# Payment Collect
class PaymentCollect(BaseModel):
    amount: float = Field(..., gt=0, le=10000000)
    mode: Literal["CASH", "ONLINE"] = "CASH"
    notes: Optional[str] = Field(default=None, max_length=500)
