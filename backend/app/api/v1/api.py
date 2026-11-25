from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, workers, egg_types, customers, stock, trips, bills, damages
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(workers.router)
api_router.include_router(egg_types.router)
api_router.include_router(customers.router)
api_router.include_router(stock.router)
api_router.include_router(trips.router)
api_router.include_router(bills.router)
api_router.include_router(damages.router)
