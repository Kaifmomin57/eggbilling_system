import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    pin = Column(String(255), nullable=False)
    role = Column(String(20), default="DELIVERY") # DELIVERY, MANAGER, ADMIN
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    trips = relationship("Trip", back_populates="worker")

class EggType(Base):
    __tablename__ = "egg_types"
    
    id = Column(String(50), primary_key=True) # e.g. 'egg-white', 'egg-brown'
    name = Column(String(100), nullable=False)
    category = Column(String(10), default="LOW") # 'HIGH', 'LOW'
    eggs_per_tray = Column(Integer, default=30)
    default_rate = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    current_stock_trays = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    stock_entries = relationship("StockEntry", back_populates="egg_type")
    customer_rates = relationship("CustomerRate", back_populates="egg_type")

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(150), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    area = Column(String(255), default="Main Area")
    due_amount = Column(Float, default=0.0)
    pending_trays = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    bills = relationship("Bill", back_populates="customer")
    rates = relationship("CustomerRate", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer")

class CustomerRate(Base):
    __tablename__ = "customer_rates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    egg_type_id = Column(String(50), ForeignKey("egg_types.id"), nullable=False)
    rate = Column(Float, nullable=False)
    
    customer = relationship("Customer", back_populates="rates")
    egg_type = relationship("EggType", back_populates="customer_rates")

class StockEntry(Base):
    __tablename__ = "stock_entries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    date = Column(String(30), nullable=False)
    egg_type_id = Column(String(50), ForeignKey("egg_types.id"), nullable=False)
    qty_trays = Column(Integer, nullable=False)
    purchase_rate_per_egg = Column(Float, nullable=False)
    supplier = Column(String(150), default="Direct Purchase")
    notes = Column(Text, nullable=True)
    total_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    egg_type = relationship("EggType", back_populates="stock_entries")

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_no = Column(String(50), unique=True, index=True, nullable=False)
    worker_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    worker_name = Column(String(100), nullable=False)
    worker_phone = Column(String(20), nullable=False)
    date = Column(String(30), nullable=False)
    vehicle = Column(String(100), nullable=False)
    status = Column(String(20), default="DRAFT") # DRAFT, OUT, SETTLEMENT, CLOSED
    expected_cash = Column(Float, default=0.0)
    expected_online = Column(Float, default=0.0)
    declared_cash = Column(Float, nullable=True)
    declared_online = Column(Float, nullable=True)
    declared_empty_trays = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    worker = relationship("User", back_populates="trips")
    loads = relationship("TripLoad", back_populates="trip", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="trip")

class TripLoad(Base):
    __tablename__ = "trip_loads"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=False)
    egg_type_id = Column(String(50), ForeignKey("egg_types.id"), nullable=False)
    egg_type_name = Column(String(100), nullable=False)
    qty_loaded_eggs = Column(Integer, default=0)
    qty_sold_eggs = Column(Integer, default=0)
    qty_returned_eggs = Column(Integer, default=0)
    
    trip = relationship("Trip", back_populates="loads")

class Bill(Base):
    __tablename__ = "bills"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bill_no = Column(String(50), unique=True, index=True, nullable=False)
    trip_id = Column(String(36), ForeignKey("trips.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_cash = Column(Float, default=0.0)
    paid_online = Column(Float, default=0.0)
    due_amount = Column(Float, default=0.0)
    payment_mode = Column(String(20), default="CASH") # CASH, ONLINE, MIX, DUE
    trays_given = Column(Integer, default=0)
    trays_returned = Column(Integer, default=0)
    customer_pending_trays_after = Column(Integer, default=0)
    customer_due_after = Column(Float, default=0.0)
    status = Column(String(20), default="ACTIVE") # ACTIVE, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    created_at_time = Column(String(20), nullable=True)
    
    trip = relationship("Trip", back_populates="bills")
    customer = relationship("Customer", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

class BillItem(Base):
    __tablename__ = "bill_items"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bill_id = Column(String(36), ForeignKey("bills.id"), nullable=False)
    egg_type_id = Column(String(50), ForeignKey("egg_types.id"), nullable=False)
    egg_type_name = Column(String(100), nullable=False)
    qty_eggs = Column(Integer, nullable=False)
    rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    
    bill = relationship("Bill", back_populates="items")

class DamageRecord(Base):
    __tablename__ = "damage_records"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    date = Column(String(30), nullable=False)
    worker_name = Column(String(100), nullable=False)
    egg_type_name = Column(String(100), nullable=False)
    category = Column(String(10), default="LOW") # HIGH, LOW
    qty_eggs = Column(Integer, nullable=False)
    loss_amount = Column(Float, nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, APPROVED, REJECTED
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    mode = Column(String(20), default="CASH") # CASH, ONLINE
    date = Column(String(30), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="payments")
