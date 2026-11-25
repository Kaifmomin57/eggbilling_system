# Egg Billing System — System Design

Version 1.0 · 24 Nov 2026 · Companion to the UI/UX PRD

## 1. Goals & Constraints

**Functional (summary):** Worker CRUD, stock, customer-wise rate, tray count, trips, bills (cash / online / mix), damage (high-rate / low-rate), total sale, profit/loss.

**Non-functional targets**

| Area | Target |
| --- | --- |
| Speed | LCP < 2 s on 4G; API p95 < 300 ms |
| Availability | 99.5%+ (business hours critical) |
| Data safety | Daily backup, point-in-time recovery, audit log |
| Accuracy | No duplicate bills, no float money errors, no negative stock |
| Scale (v1 assumption) | 5–50 workers, 500–5,000 customers, 200–2,000 bills/day |
| Devices | Budget Android phones + desktop browser |

Is scale par **ek single Postgres + ek Next.js app** kaafi hai. Microservices ki zarurat nahi — *modular monolith* best rahega.

## 2. High-Level Architecture

```
   Admin (Browser)          Worker (PWA, Mobile)
          \                      /
           \                    /
            →   CDN / Edge (static, JS, fonts)   ←
                         |
                 Next.js App (Vercel)
          ├─ UI (React Server + Client components)
          ├─ API route handlers (/api/v1/*)
          ├─ Auth middleware (JWT cookie + RBAC)
          └─ Domain services (billing, stock, trips, reports)
                         |
              Prisma ORM (connection pool)
                         |
                PostgreSQL (Supabase/Neon)
                         |
          Object storage (damage photos, bill PDFs)
```

**Design style:** Modular monolith. Har domain (billing, stock, trips, damage, reports) ka apna service layer; routes patle (validate → service call → respond).

## 3. Tech Stack & Why

| Layer | Choice | Reason |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript | SSR fast first load, ek codebase me UI + API |
| Styling/UI | Tailwind CSS + shadcn/ui (Radix) | Component based, light theme tokens, small bundle |
| Data fetching | TanStack Query | Cache, optimistic updates, retry |
| Forms | React Hook Form + Zod | Same Zod schema client + server validation |
| Charts | Recharts (lazy loaded) | Admin dashboard only |
| Backend | Next.js route handlers (Node runtime) | Simple deploy; NestJS baad me agar zarurat ho |
| ORM | Prisma | Type-safe, migrations |
| DB | PostgreSQL 15+ | Transactions, constraints, window functions for reports |
| Auth | Custom JWT (httpOnly cookie) + argon2 hash | Phone + PIN/password; lightweight |
| PDF | `@react-pdf/renderer` ya server HTML→PDF | Bill PDF/share |
| PWA | next-pwa / Workbox | Shell caching, offline queue (v1.1) |
| Hosting | Vercel (app) + Supabase/Neon (DB + storage) | Low ops, India region (Mumbai) latency kam |
| Monitoring | Sentry + Vercel analytics + Postgres slow query log | Errors aur slow pages pakadne ke liye |

## 4. Code Structure

```
/src
  /app
    /(auth)/login
    /admin/(dashboard|trips|bills|customers|stock|workers|damage|trays|reports|settings)
    /worker/(home|new-bill|bills|count)
    /api/v1/...            # route handlers
  /modules
    /billing   (service, repo, schema.ts, calc.ts)
    /stock     (service, repo, schema.ts)
    /trips
    /customers (rates)
    /damage
    /trays
    /reports
    /auth
  /components               # ui kit (Button, Stepper, DataTable ...)
  /lib                      # db, auth, money, dates, errors
  /prisma                   # schema.prisma, migrations, seed
```

**Rule:** business logic sirf `/modules/*/service.ts` me; routes aur UI me calculation nahi.

## 5. Data Model

### 5.1 Conventions

- Primary key: UUID v7 (time-sortable). `created_at`, `updated_at` har table me.
- **Amounts**: integer **paise** (BIGINT). **Rate per egg**: `NUMERIC(10,4)` rupees (e.g. 6.3333), line amount `ROUND(qty × rate × 100)` paise me, line level par round.
- Quantity hamesha **eggs** me (INTEGER). Tray = `eggs_per_tray` (default 30). UI me convert.
- Soft delete: `deleted_at` (master tables). Transaction tables: cancel status, delete nahi.
- Timezone: DB UTC, display Asia/Kolkata. Business date alag column (`business_date DATE`).

### 5.2 Tables

**users**

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| name | text |  |
| phone | text unique | 10 digit |
| role | enum(ADMIN, WORKER) |  |
| pin\_hash | text | argon2 |
| is\_active | bool |  |
| failed\_attempts, locked\_until | int, timestamptz | login lock |
| deleted\_at | timestamptz null |  |

**egg\_types**

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| name | text unique | White, Brown, Desi |
| eggs\_per\_tray | int default 30 |  |
| default\_rate | numeric(10,4) | per egg |
| damage\_class | enum(HIGH, LOW) | egg ki category (high-rate / low-rate) |
| is\_active | bool |  |

**stock\_movements** (single source of truth for stock)

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| egg\_type\_id | FK |  |
| qty\_eggs | int | **signed** (+in, −out) |
| type | enum(PURCHASE, TRIP\_LOAD, TRIP\_RETURN, DAMAGE, ADJUSTMENT) |  |
| purchase\_rate | numeric(10,4) null | sirf PURCHASE par |
| supplier | text null |  |
| ref\_type, ref\_id | text, uuid | trip / damage reference |
| business\_date | date |  |
| note | text |  |
| created\_by | FK users |  |

Current stock = `SUM(qty_eggs)` per egg\_type. Stock CRUD ka matlab: PURCHASE/ADJUSTMENT rows add/edit/void (edit audit ke saath).

**customers**

| Column | Type |
| --- | --- |
| id, name, phone, address, area |  |
| opening\_due | bigint paise |
| notes, is\_active, deleted\_at |  |

**customer\_rates**

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| customer\_id, egg\_type\_id | FK |  |
| rate | numeric(10,4) | per egg |
| effective\_from | date |  |
| created\_by | FK |  |

Unique `(customer_id, egg_type_id, effective_from)`. Active rate = latest `effective_from <= bill date`; na mile to `egg_types.default_rate`.

**trips**

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| trip\_no | text unique | T-241124-01 |
| worker\_id | FK |  |
| business\_date | date |  |
| status | enum(DRAFT, OUT, SETTLEMENT, CLOSED, CANCELLED) |  |
| vehicle | text null |  |
| started\_at, settled\_at, closed\_at | timestamptz |  |
| declared\_cash, declared\_online | bigint | worker ka settlement input |
| declared\_empty\_trays | int |  |
| closed\_by | FK |  |

Partial unique: ek worker ki ek hi din me ek active trip (status in DRAFT/OUT/SETTLEMENT) — optional rule.

**trip\_loads**

| Column | Type |
| --- | --- |
| id, trip\_id, egg\_type\_id |  |
| qty\_loaded | int |
| qty\_returned\_declared | int null (worker closing count) |
| qty\_returned\_final | int null (admin approve) |

**bills**

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid PK |  |
| bill\_no | text unique | EG-241124-0001 |
| client\_request\_id | uuid unique | **idempotency key** |
| trip\_id, customer\_id, worker\_id | FK |  |
| business\_date | date |  |
| total | bigint | paise |
| paid\_cash, paid\_online | bigint |  |
| due | bigint | total − paid (generated/checked) |
| payment\_mode | enum(CASH, ONLINE, MIX, DUE) | derived |
| trays\_given, trays\_returned | int |  |
| status | enum(ACTIVE, CANCELLED) |  |
| cancel\_reason | text null |  |

CHECK: `paid_cash + paid_online <= total`, `due = total - paid_cash - paid_online`, all `>= 0`.

**bill\_items**

| Column | Type | Notes |
| --- | --- | --- |
| id, bill\_id, egg\_type\_id |  |  |
| qty\_eggs | int > 0 |  |
| rate\_snapshot | numeric(10,4) | **freeze** |
| cost\_snapshot | numeric(10,4) | avg purchase cost at sale (profit ke liye) |
| amount | bigint paise |  |

**tray\_ledger**

| Column | Type | Notes |
| --- | --- | --- |
| id, customer\_id |  |  |
| bill\_id | FK null |  |
| trays\_out, trays\_in | int |  |
| kind | enum(BILL, MANUAL\_ADJUST) |  |
| note | text |  |

Customer pending trays = `SUM(trays_out - trays_in)`.

**payments** (due collection)

| Column | Type |
| --- | --- |
| id, customer\_id, collected\_by |  |
| amount\_cash, amount\_online | bigint |
| business\_date, note |  |

Customer due = `opening_due + SUM(bills.due) − SUM(payments)`.

**damages**

| Column | Type | Notes |
| --- | --- | --- |
| id, trip\_id null, egg\_type\_id |  |  |
| qty\_eggs | int > 0 |  |
| category | enum(HIGH, LOW) | default egg\_types.damage\_class, editable |
| cost\_value | bigint | qty × avg purchase cost |
| status | enum(PENDING, APPROVED, REJECTED) |  |
| reason, photo\_url |  |  |
| created\_by, decided\_by | FK |  |

APPROVED hone par `stock_movements` (DAMAGE, negative) banta hai.

**app\_settings:** shop name, phone, address, bill footer, low\_stock\_threshold.

**counters:** `(scope, business_date, last_value)` — bill\_no / trip\_no sequence ke liye.

**audit\_logs:** id, user\_id, entity, entity\_id, action, before JSONB, after JSONB, reason, created\_at.

### 5.3 Indexes

- `bills (business_date, status)`, `bills (customer_id, business_date)`, `bills (trip_id)`, `bills (worker_id, business_date)`
- `bill_items (bill_id)`, `bill_items (egg_type_id)`
- `stock_movements (egg_type_id, business_date)`
- `customer_rates (customer_id, egg_type_id, effective_from DESC)`
- `trips (worker_id, business_date)`, `trips (status)`
- `tray_ledger (customer_id)`, `payments (customer_id)`
- `damages (status, category, created_at)`
- Customer search: `pg_trgm` GIN index on `name`, btree on `phone`.

### 5.4 Relationship summary

```
users 1──* trips 1──* trip_loads *─—1 egg_types
trips 1──* bills 1──* bill_items *─—1 egg_types
customers 1──* bills ; customers 1──* customer_rates *─—1 egg_types
customers 1──* tray_ledger ; customers 1──* payments
egg_types 1──* stock_movements ; trips/damages → stock_movements (ref)
trips 1──* damages
```

## 6. Core Business Logic

### 6.1 Bill creation (single DB transaction)

1. Validate input (Zod): customer, items, trays, payment amounts.
2. **Idempotency:** `client_request_id` already exist kare to wahi purana bill return (double tap/retry safe).
3. Check trip status = `OUT` aur trip.worker = current worker.
4. Har item: rate resolve (customer rate → default), `rate_snapshot` save; `cost_snapshot` = avg purchase cost.
5. **Stock-in-trip check:** `trip_loads.qty_loaded − sold so far − approved damage` ≥ qty, warna `409 INSUFFICIENT_TRIP_STOCK`. (Concurrency ke liye `SELECT ... FOR UPDATE` trip\_loads row par.)
6. Totals calc (line round to paise), validate `paid <= total`; `due` calc.
7. `bill_no` generate (counters row lock).
8. Insert bills + bill\_items + tray\_ledger (trays\_out = given, trays\_in = returned).
9. Commit; audit log; response me bill + updated trip counters.

Trip stock sale par `stock_movements` nahi banta — stock godown se **trip load** par minus ho chuka hota hai.

### 6.2 Trip lifecycle

```
DRAFT ─(worker confirm load)→ OUT ─(worker submit count)→ SETTLEMENT ─(admin approve)→ CLOSED
  \_____________________(cancel, only DRAFT)_____________________/
```

- **DRAFT → OUT:** `stock_movements TRIP_LOAD (−qty)` per egg type; stock insufficient ho to reject.
- **OUT → SETTLEMENT:** worker closing count (left eggs, empty trays, cash, online) save.
- **Reconciliation (system calculate karta hai):**
  - `expected_left = loaded − sold − approved_damage` (per egg type)
  - `egg_diff = declared_left − expected_left`
  - `expected_cash = Σ bills.paid_cash (trip)`; `cash_diff = declared_cash − expected_cash` (online bhi same)
  - `tray_diff` = expected empty trays − declared
- **SETTLEMENT → CLOSED:** admin approve; `TRIP_RETURN (+left)` stock movement; differences ek record me store (short = loss flag).
- CLOSED trip par bills/damage edit lock.

### 6.3 Stock

- `current_stock(egg_type) = SUM(qty_eggs)`; negative allowed nahi (service layer + check before TRIP\_LOAD/DAMAGE).
- **Average cost** (moving weighted average): purchases ka weighted avg `Σ(qty×rate)/Σqty` till business\_date. Performance ke liye `egg_type_cost_cache` table/materialized view har purchase par refresh.
- Low stock: `current_stock < threshold` → dashboard badge.

### 6.4 Damage

- Worker/Admin add → `PENDING` (admin add kare to auto-approve option).
- Approve: `cost_value = qty × avg_cost`, DAMAGE stock movement (trip ho to trip ka expected\_left kam), audit.
- Reports category (HIGH/LOW) wise group.

### 6.5 Profit / Loss

```
Sales (ACTIVE bills)           = Σ bill_items.amount
Cost of eggs sold              = Σ round(qty × cost_snapshot × 100)
Gross profit                   = Sales − Cost of eggs sold
Damage loss (approved)         = Σ damages.cost_value
Shortage loss (settlements)    = Σ trip short eggs × avg cost
Net profit                     = Gross profit − Damage loss − Shortage loss − Expenses (v1.1)
```

Cancelled bills sab me se exclude.

### 6.6 Customer balances

- Due = `opening_due + Σ bills.due (ACTIVE) − Σ payments`
- Pending trays = `Σ (trays_out − trays_in)` (ACTIVE bills + manual adjust)

## 7. API Design (REST, `/api/v1`)

Sab responses JSON; errors format: `{ "error": { "code": "INSUFFICIENT_TRIP_STOCK", "message": "...", "details": {} } }`. Pagination: `?page=1&limit=20` ya cursor (`?cursor=`).

| Area | Endpoints | Access |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Public / any |
| Workers | `GET/POST /workers`, `GET/PATCH/DELETE /workers/:id` | Admin |
| Egg types | `GET/POST /egg-types`, `PATCH /egg-types/:id` | Admin (GET: all) |
| Stock | `GET /stock/summary`, `GET/POST /stock/entries`, `PATCH/DELETE /stock/entries/:id` | Admin |
| Customers | `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id`, `GET /customers/search?q=` | Admin; worker: search/create |
| Rates | `GET /customers/:id/rates`, `PUT /customers/:id/rates` | Admin (worker: GET) |
| Trips | `GET/POST /trips`, `GET /trips/:id`, `POST /trips/:id/confirm-load`, `POST /trips/:id/submit-count`, `POST /trips/:id/approve`, `POST /trips/:id/cancel` | Admin / own worker |
| Bills | `GET/POST /bills`, `GET /bills/:id`, `PATCH /bills/:id`, `POST /bills/:id/cancel`, `GET /bills/:id/pdf` | Admin; worker: create + own read |
| Payments | `POST /customers/:id/payments` | Admin |
| Trays | `GET /trays/summary`, `POST /trays/adjust` | Admin |
| Damage | `GET/POST /damages`, `POST /damages/:id/approve`, `POST /damages/:id/reject` | Admin; worker: create |
| Reports | `GET /reports/dashboard`, `/reports/sales`, `/reports/profit-loss`, `/reports/damage` | Admin |
| Settings | `GET/PUT /settings` | Admin |

### 7.1 Sample: create bill

```json
POST /api/v1/bills
{
  "clientRequestId": "6f1d...-uuid",
  "tripId": "...",
  "customerId": "...",
  "items": [
    { "eggTypeId": "white", "qtyEggs": 105 },
    { "eggTypeId": "brown", "qtyEggs": 60 }
  ],
  "traysGiven": 6,
  "traysReturned": 4,
  "payment": { "cash": 50000, "online": 30000 }
}
```

```json
201 Created
{
  "id": "...", "billNo": "EG-241124-0012",
  "total": 120250, "paidCash": 50000, "paidOnline": 30000, "due": 40250,
  "paymentMode": "MIX",
  "items": [{ "eggTypeId": "white", "qtyEggs": 105, "rate": 6.5, "amount": 68250 }],
  "customerBalance": { "due": 40250, "pendingTrays": 7 },
  "trip": { "leftEggs": { "white": 495, "brown": 240 } }
}
```

Amounts paise me. Server hamesha total khud calculate karta hai (client ka total trust nahi).

## 8. Auth, Authorization & Security

- **Login:** phone + PIN/password → argon2 verify → JWT (15 min access) + refresh (7 days) httpOnly, Secure, SameSite=Lax cookies.
- **Lock:** 5 failed attempts → 5 min lock; login rate limit per IP (e.g., 10/min).
- **RBAC:** middleware role check per route; worker ke liye **row-level scope** (sirf apni trip/bills `worker_id = me`).
- **Validation:** Zod har request par; Prisma parameterised queries (SQL injection safe).
- **Web security:** HTTPS only, HSTS, CSP, CSRF token for state-changing cookie requests, XSS-safe rendering.
- **Secrets:** env variables (Vercel), DB least-privilege user, no secrets in repo.
- **Data:** photos signed URLs (private bucket); PII sirf name/phone.
- **Audit:** bills edit/cancel, stock edit/delete, rate change, trip approve, damage decision, worker changes → `audit_logs` (before/after, reason).
- **Backups:** daily automated + PITR; monthly restore test.

## 9. Concurrency & Data Integrity

| Risk | Solution |
| --- | --- |
| Double tap / retry bill | `client_request_id` unique + idempotent return |
| Two workers/bills oversell | Transaction + `SELECT ... FOR UPDATE` on trip\_loads/stock rows |
| Bill number clash | `counters` row lock in same transaction |
| Edit while closed trip | Status guard in service layer |
| Negative stock | Check in service + DB trigger/CHECK on movements sum (optional) |
| Float money errors | Integer paise + round at line level |
| Lost updates in admin edits | `updated_at`/version check (optimistic locking) |

## 10. Performance & Caching

- **DB:** indexes above, queries paginated, `EXPLAIN` on reports; connection pooling (PgBouncer/Supabase pooler).
- **Reports:** v1 live SQL; data badhne par **daily summary table** (`daily_sales_summary`: date, worker, egg\_type, qty, sales, cost, cash, online, due) nightly + on-trip-close update.
- **Client cache:** TanStack Query — customers list, rates, egg types (stale 5 min) taki billing me search instant ho.
- **HTTP:** static assets immutable cache via CDN; API `Cache-Control: no-store` for transactional, short `s-maxage` for reference data.
- **Frontend:** code splitting per route, charts dynamic import, fonts subset, images minimal, worker bundle < 200 KB.
- **Region:** app + DB India (Mumbai / ap-south-1) region me.

## 11. Offline / PWA (Worker)

- **v1:** installable PWA, shell + reference data cached; offline hone par clear banner, billing disabled with message ya "queue" (decision pending).
- **v1.1 offline queue:** bill IndexedDB me save with `clientRequestId` → online hote hi sync → server idempotency duplicate se bachata hai. Conflict (stock kam) ho to bill "Needs attention" status me admin ko dikhe.
- Reference data (customers, rates, egg types, trip loads) login par prefetch.

## 12. Reporting Queries (examples)

```sql
-- Daily sale split
SELECT business_date,
       SUM(total) total, SUM(paid_cash) cash, SUM(paid_online) online, SUM(due) due
FROM bills WHERE status='ACTIVE' AND business_date BETWEEN $1 AND $2
GROUP BY 1 ORDER BY 1;

-- Gross profit by egg type
SELECT e.name,
       SUM(bi.amount) sales,
       SUM(ROUND(bi.qty_eggs * bi.cost_snapshot * 100)) cost
FROM bill_items bi
JOIN bills b ON b.id = bi.bill_id AND b.status='ACTIVE'
JOIN egg_types e ON e.id = bi.egg_type_id
WHERE b.business_date BETWEEN $1 AND $2
GROUP BY e.name;

-- Current stock
SELECT egg_type_id, SUM(qty_eggs) FROM stock_movements GROUP BY 1;
```

## 13. Deployment & Operations

| Item | Plan |
| --- | --- |
| Environments | local (Docker Postgres) → staging → production |
| CI/CD | GitHub Actions: lint, typecheck, unit + integration tests, Prisma migrate check → auto deploy to Vercel |
| Migrations | Prisma migrate deploy; backward compatible changes only |
| Config | env vars per environment; seed script (admin user, egg types) |
| Monitoring | Sentry (errors), uptime ping, slow query alerts, daily backup check |
| Logging | Structured JSON logs with request id; no PINs/PII in logs |
| Cost (approx) | Vercel + Supabase starter tiers likely enough for v1 |

## 14. Testing Strategy

| Level | What |
| --- | --- |
| Unit | Money/rate calc, mix payment split, tray conversion, avg cost |
| Integration | Bill creation transaction, idempotency, oversell race, trip reconcile (test DB) |
| API contract | Zod schemas, RBAC matrix (worker cannot access admin routes) |
| E2E (Playwright) | Worker bill flow, trip load → settlement → close, damage approval |
| Performance | Lighthouse CI budget, k6 load test (bill create 20 rps) |
| UAT | 1 week real worker/admin with sample data |

## 15. Scaling Path (jab bada ho)

1. Read replica for reports, daily summary tables.
2. Background jobs (BullMQ / pg-boss): PDF generation, WhatsApp share, nightly summaries.
3. Redis cache for hot reference data.
4. Split reporting into separate service only if load demand kare.
5. Multi-branch: `branch_id` column + row-level security (future).

## 16. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Worker weak network | PWA caching, optimistic UI, offline queue (v1.1) |
| Wrong cost average → wrong profit | `cost_snapshot` per sale + clear documented method; admin adjustments audit |
| Staff mistakes (wrong bill) | Edit/cancel with reason + audit log, settlement checks |
| Data loss | Daily backups + PITR + restore drills |
| Scope creep (GST, inventory of other items) | v1 scope freeze; backlog for v1.1 |

## 17. Build Order (engineering)

1. Repo, CI, DB schema + migrations, auth + RBAC, UI kit.
2. Master data: workers, egg types, customers + rates, stock movements.
3. Trips (load, status machine) + bills transaction + tray ledger.
4. Settlement/reconciliation, damage approval.
5. Dashboard + sales + profit/loss, PDF/share.
6. PWA polish, performance pass, UAT, production release.

## 18. Open Decisions

1. Rate per egg vs per tray (schema per-egg rate maan kar chala hai).
2. Udhaar / credit limit rules.
3. Offline billing v1 me chahiye ya v1.1?
4. Expenses (petrol, salary) profit me abhi jodna hai?
5. Cost method: moving average (default) ya FIFO?
