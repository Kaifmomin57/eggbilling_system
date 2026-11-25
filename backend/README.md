# Egg Billing System — Python FastAPI Backend

Modular, production-ready REST API built with FastAPI, SQLAlchemy, and SQLite (or PostgreSQL).

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── workers.py       # Worker CRUD & PIN
│   │       │   ├── egg_types.py     # Egg types & rates
│   │       │   ├── customers.py     # Customers, custom rates, payments
│   │       │   ├── stock.py         # Godown stock & purchases
│   │       │   ├── trips.py         # Delivery trips & loads
│   │       │   ├── bills.py         # Bill generation & calculations
│   │       │   └── damages.py       # Damage reports & approvals
│   │       └── api.py               # Combined v1 API router
│   ├── core/
│   │   ├── config.py                # Environment & settings
│   │   └── database.py              # SQLAlchemy engine & session
│   ├── db/
│   │   └── init_db.py               # Database initialization & seed data
│   ├── models/
│   │   └── models.py                # Database models
│   ├── schemas/
│   │   └── schemas.py               # Pydantic request/response schemas
│   └── main.py                      # FastAPI app entry point & CORS
├── requirements.txt
├── run.bat                          # One-click start script
└── egg_billing.db                   # SQLite database file
```

## How to Run

### Quick Start (Windows)
Double click `run.bat` or run in terminal:

```powershell
cd d:\egg-bill-system\backend
.\venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **API Base URL**: http://localhost:8000/api/v1
