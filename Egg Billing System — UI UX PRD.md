# Egg Billing System — UI/UX PRD

Version 1.0 · 24 Nov 2026 · Admin web + Worker mobile (PWA) · Light theme

## 1. Purpose & Scope

Ye document batata hai ki egg billing app **dikhegi kaisi, chalegi kaisi, aur har screen par kya hoga**. Developer aur designer isse seedha build kar sake, itna detail diya gaya hai.

**In scope:** Admin site (desktop + mobile), Worker site (mobile first), design system, screens, flows, states, validations, accessibility, performance UX.

**Out of scope (v1):** Dark theme, multi-language (Hindi toggle v1.1), customer-facing portal.

## 2. Users & Context of Use

|  | Admin (Owner) | Worker (Delivery) |
| --- | --- | --- |
| Device | Laptop mostly, kabhi phone | Phone (budget Android, 4G, kabhi weak network) |
| Environment | Office / godown, baithke | Road par, dhoop, ek haath me phone, jaldi me |
| Goal | Poora control, hisaab, profit | Jaldi bill banana, trays ka sahi count |
| Tech comfort | Medium | Low–medium |
| Key need | Dashboard, reports, approvals | Kam typing, bade buttons, galti na ho |

**Design implication:** Worker app = minimum typing, bade tap targets, clear numbers. Admin app = dense tables, filters, reports.

## 3. UX Goals & Success Metrics

| Goal | Metric / Target |
| --- | --- |
| Fast billing | Worker bill **< 45 sec**, **≤ 12 taps** (repeat customer) |
| Fast loading | LCP < 2 sec on 4G, route change < 300 ms |
| Zero training | Naya worker 10 min me bill bana le |
| Low errors | Bill me galti (wrong qty/payment) **< 2%** (edit/cancel rate) |
| Admin clarity | Dashboard par 5 sec me aaj ka sale, profit, due dikhe |

## 4. Design Principles

1. **Light & clean:** white cards, halka grey background, ek hi accent color (egg yolk amber).
2. **Numbers first:** quantity, amount, due — bade aur bold; label chhota.
3. **Thumb friendly:** worker app me primary action hamesha neeche (bottom bar), min tap target **48px**.
4. **Less typing:** steppers, chips, search-select, auto-fill; keyboard sirf zarurat par.
5. **Forgiving:** undo/edit ke options, destructive action par confirm.
6. **Fast feel:** skeleton loaders, optimistic UI, no heavy images/animation.
7. **Consistent:** ek component library, har jagah same behaviour.

## 5. Information Architecture

### 5.1 Admin sitemap

```
Admin
├─ Dashboard
├─ Trips
│   ├─ Trip list
│   └─ Trip detail (load → live → settlement)
├─ Bills
│   └─ Bill detail / print
├─ Customers
│   └─ Customer detail (Rates | Bills | Trays | Statement)
├─ Stock
│   ├─ Stock summary
│   └─ Stock entries (CRUD)
├─ Workers (CRUD)
├─ Damage (High-rate | Low-rate)
├─ Trays (balance)
├─ Reports
│   ├─ Total sale
│   └─ Profit / Loss
└─ Settings (egg types, tray size, low-stock limit, profile)
```

### 5.2 Worker sitemap

```
Worker (bottom nav)
├─ Home (today trip)
├─ New Bill (5-step flow)
├─ Bills (my bills today)
└─ Count (tray & egg count, settlement)
```

### 5.3 Navigation rules

- **Admin desktop:** left sidebar (240px, collapsible to icons) + top bar.
- **Admin mobile:** hamburger drawer.
- **Worker:** bottom navigation, 4 items, center "New Bill" button highlighted (floating style).
- Breadcrumb sirf admin detail pages par.

## 6. Design System

### 6.1 Color tokens (Updated with Custom Brand Palette)

| Token | Hex | Name / Role | Use |
| --- | --- | --- | --- |
| **bg** | `#F6F6F2` | Warm Off-White / Eggshell | Clean page background, low eye strain |
| **surface** | `#FFFFFF` | Crisp White | Cards, tables, modals, sheets |
| **border** | `#D8E2DC` | Soft Sage Border | Subtle dividers, card borders, input borders |
| **primary** | `#388087` | Deep Teal / Sea Green | Primary action buttons, active navigation, brand elements |
| **primary-hover** | `#2C646A` | Dark Teal | Hover / pressed state for primary buttons |
| **primary-soft** | `#BADFE7` | Ice Blue / Soft Cyan | Selected row, active pill bg, secondary highlights |
| **accent-secondary** | `#6FB3B8` | Soft Teal / Cyan | Secondary interactive elements, icons, tabs |
| **success** | `#C2EDCE` | Mint / Soft Sage Green | Paid badge, profit indicators, delivered status, OK |
| **success-text** | `#1B5E20` | Forest Green | High-contrast text on success/mint chips |
| **text** | `#1C2A2B` | Deep Slate Teal | Main text, high contrast headers |
| **text-muted** | `#5F7375` | Muted Slate | Labels, secondary helper text, timestamps |
| **warning** | `#E59866` | Soft Terracotta / Amber | Low stock, settlement differences, mismatch alerts |
| **danger** | `#D9534F` | Soft Crimson | Due, loss, damage, cancel, delete |
| **info** | `#4A90E2` | Sky Blue | Online payments, sync status |

> **Contrast Note:** Text on `#388087` (Primary) = `#FFFFFF` (White) achieves WCAG AA compliance (ratio > 4.5:1). Text on `#C2EDCE` (Success) uses dark forest `#1B5E20` for optimal readability.

### 6.2 Typography (Inter, fallback system-ui)

| Style | Size / Weight | Use |
| --- | --- | --- |
| Display | 28 / 700 | Dashboard big numbers |
| H1 | 22 / 600 | Page title |
| H2 | 18 / 600 | Section title |
| Body | 15 / 400 | Normal text |
| Label | 13 / 500 | Form labels, table header |
| Caption | 12 / 400 | Helper text |
| Amount (worker) | 32 / 700 | Bill total |

Numbers hamesha **tabular-nums**, amount Indian format (₹1,25,000).

### 6.3 Spacing, radius, elevation

- Spacing scale: 4, 8, 12, 16, 24, 32.
- Radius: input 8, card 12, chip/pill 999.
- Shadow: card `0 1px 2px rgba(0,0,0,.06)`; modal `0 8px 24px rgba(0,0,0,.12)`.

### 6.4 Iconography & motion

- Icons: Lucide, 20px, stroke 1.75. Sirf zarurat ke icons.
- Motion: 150–200 ms fade/slide only. `prefers-reduced-motion` respect.

## 7. Component Specification

| Component | Variants | States | Notes |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger; sm/md/lg | default, hover, pressed, loading, disabled | Worker: lg (48px). Loading me spinner + disabled (double tap rokne ke liye) |
| Input | text, number, phone, search | default, focus, error, disabled | Error: red border + message neeche |
| Number stepper | tray, egg | default, min, max | − / value / + ; value tap karke type bhi kar sake; long press = fast change |
| Tray+Egg input | combined | — | "3 tray + 12 egg" → total eggs auto dikhe |
| Select / Combobox | single, searchable | open, empty | Customer search: name/phone, recent top par |
| Segmented control | 2–3 options | selected | Payment: Cash / Online / Mix |
| Chip | filter, egg type, status | selected, disabled | Egg type chips worker billing me |
| Card | basic, stat | — | Stat card: label, big number, delta |
| Data table | sortable, selectable | loading, empty, error | Server pagination, sticky header, mobile par card-list me convert |
| Badge | success, warning, danger, info, neutral | — | Trip/payment status |
| Modal | center (desktop) | — | Confirm dialogs |
| Drawer / Bottom sheet | right drawer (admin), bottom sheet (mobile) | — | Add/Edit forms |
| Toast | success, error, info | — | 3 sec auto-hide, bottom (worker) / top-right (admin) |
| Date range picker | presets + custom | — | Today, Yesterday, 7d, This month |
| Empty state | — | — | Icon + 1 line + CTA button |
| Skeleton | line, card, table | — | Spinner ki jagah skeleton |
| Bill preview | compact, print | — | Header, items, tray, payment, total |
| Progress bar | trip progress | — | Loaded vs sold vs left |

## 8. Responsive Behaviour

| Breakpoint | Layout |
| --- | --- |
| < 640px (mobile) | Single column, bottom nav (worker), drawer nav (admin), tables → cards |
| 640–1024px (tablet) | Two column grids, collapsed sidebar |
| > 1024px (desktop) | Full sidebar, multi-column dashboard, tables full |

Worker app sirf mobile par optimize; desktop par centered 480px container.

## 9. Screen Specifications — Admin

### 9.1 Login

- Fields: Phone/Email, Password/PIN. Button: Login. "Show password" toggle.
- Role ke hisaab se redirect: admin → Dashboard, worker → Worker Home.
- Errors: "Phone ya password galat hai" (kaunsa galat hai ye nahi batana). 5 galat try ke baad 5 min lock.

### 9.2 Dashboard

**Top bar:** date range (default Today), profile menu.

**Row 1 — stat cards (4):** Today Sale · Cash collected · Online collected · Due given.

**Row 2 — stat cards (4):** Profit/Loss · Damage loss · Stock left (tray) · Trips live.

**Row 3:** Sale trend (7 days line/bar) · Stock by egg type (bar).

**Row 4:** Live trips table (worker, loaded, sold, left, cash) · Top due customers (name, due, Collect button).

- Loss ho to number **red**, profit **green**.
- Card click → related report/list.
- Loading: skeleton cards. Empty: "Aaj abhi koi sale nahi".

### 9.3 Workers (CRUD)

| Element | Detail |
| --- | --- |
| List columns | Name, Phone, Status (Active/Inactive), Today trip, Pending cash, Actions |
| Filters | Search (name/phone), Status |
| Add / Edit (drawer) | Name\*, Phone\*, PIN\* (4–6 digit, edit me optional), Active toggle |
| Delete | Soft delete; confirm: "Is worker ki purani trips/bills safe rahengi" |
| Detail | Tabs: Trips, Bills, Cash pending |

Validation: phone 10 digit unique, name min 2 chars.

### 9.4 Stock (CRUD)

**Summary cards (per egg type):** Current stock (tray + egg), low-stock badge.

**Stock entries table:** Date, Egg type, Qty (tray+egg), Purchase rate, Supplier, Total cost, Actions.

**Add stock (drawer):** Date\*(default today), Egg type\*, Qty\*(tray/egg), Purchase rate\*, Supplier, Notes.

- Total cost auto-calc live.
- Edit/delete par audit note: "Reason" required.
- Delete ho to stock automatically adjust.

### 9.5 Customers & Rates

**List:** Name, Phone, Area, Due, Trays pending, Last bill date. Search + filter (Due > 0, Trays pending > 0).

**Add/Edit:** Name\*, Phone, Address/Area, Opening due, Notes.

**Customer detail tabs:**

- **Rates:** table (Egg type → Rate/egg, Rate/tray hint, Effective from). Inline edit; save par history entry. "Default rate use karo" toggle.
- **Bills:** list with status/payment.
- **Trays:** given, returned, pending timeline.
- **Statement:** bills + payments + running due; PDF/Share.

Buttons: **Collect payment** (amount, mode: Cash/Online/Mix) → due kam hota hai.

### 9.6 Trips

**Trip list:** Date, Worker, Status badge, Loaded, Sold, Cash, Online, Mismatch. Filters: date, worker, status.

**Create trip (drawer/page):** Date\*, Worker\*, Vehicle, Load rows (Egg type + trays/eggs) with "+ add row", live stock check (stock kam ho to warning).

**Trip detail:**

- Header: worker, date, status stepper **Draft → Out → Settlement → Closed**.
- Progress bar per egg type: Loaded / Sold / Damaged / Left.
- Bills list of that trip.
- Settlement panel: expected vs actual — eggs, trays, cash, online. Difference **warning/danger** color.
- Buttons: Start trip, Approve settlement, Close trip (confirm: close ke baad edit nahi).

### 9.7 Bills

**List:** Bill no, Date, Customer, Worker, Total, Paid (Cash/Online chips), Due, Status. Filters: date, customer, worker, payment mode, due only. Export CSV.

**Bill detail:** items, trays given/returned, payment split, audit history, Print/PDF, Share link, **Edit** / **Cancel** (reason required).

### 9.8 Damage

- Tabs: **High-rate | Low-rate | All**.
- Table: Date, Trip, Worker, Egg type, Qty, Category badge, Loss amount, Status (Pending/Approved/Rejected), Photo.
- Add damage: Date, Trip (optional), Egg type\*, Qty\*, Category\* (High/Low), Reason, Photo.
- Pending items par Approve / Reject (reject reason).
- Summary: total qty + loss by category.

### 9.9 Trays

- Cards: Total trays in godown, With workers, With customers.
- Table: Customer, Given, Returned, **Pending** (red if > 0). Worker-wise tab.
- Manual adjust (reason required).

### 9.10 Reports

**Total sale:** date range, group by Day/Worker/Customer/Egg type. Chart + table. Split Cash/Online/Due. Export.

**Profit / Loss:** Sale, Cost of eggs sold, Damage loss, (Expenses), **Net**. Day/Month toggle, egg-type margin table, worker-wise table.

### 9.11 Settings

Egg types (name, eggs per tray, purchase rate, default rate, active) · Low-stock limit · Bill header (shop name, phone, address, footer note) · Change password.

## 10. Screen Specifications — Worker (Mobile)

### 10.1 Home

- Greeting + date. **Today trip card:** status, loaded, sold, left (tray + egg).
- Big stats: Sale · Cash · Online · Due.
- Primary CTA: **+ New Bill** (agar trip Out hai).
- Trip nahi hai to: "Admin se trip assign karwao".
- Trip Draft hai to: **Confirm load** button (loaded eggs dikhake).

### 10.2 New Bill — 5 step flow

Top par progress dots (1–5), back arrow, bottom me sticky action bar (Back / Next) aur total.

| Step | Content | Rules |
| --- | --- | --- |
| 1 Customer | Search box, Recent chips (last 5), "+ New customer" (name, phone) | Customer select hone par rate aur pending trays/due dikhe |
| 2 Items | Egg type chips, tray/egg stepper, rate (read-only), line amount, "+ add another type" | Qty > left stock ho to warning; rate 0 ho to block |
| 3 Trays | Given stepper, Returned stepper; info: "Pending: 4 trays" | Returned default 0; given default = items me trays |
| 4 Payment | Segmented: Cash / Online / Mix. Cash: amount input. Online: amount input. **Mix:** cash + online, dusra auto-fill | Paid > total allowed nahi; baaki **Due** auto, due par "Udhaar" chip |
| 5 Confirm | Summary card (customer, items, trays, payment, total, due) | **Save bill** button; double-tap safe |

**Success screen:** green tick, bill no, buttons: **Share** (WhatsApp/link), **Print/PDF**, **New bill**, **Home**.

### 10.3 My Bills

Today ke bills list (customer, total, paid mode chips, due). Tap → bill detail (read only). Search by customer.

### 10.4 Count (Tray & egg count)

- **Morning:** loaded count (read-only) + "Confirm load" button.
- **Live:** loaded / sold / left, trays gaye / aaye.
- **Evening closing:** left eggs input (tray+egg), empty trays returned input, damage add (shortcut), cash in hand, online total (auto). Difference live dikhe: **"Expected 12 tray, Actual 11 tray 20 egg → Short 10 egg"**.
- Button: **Submit settlement** (confirm dialog).

## 11. Key User Flows

**Flow A — Admin creates trip:** Trips → Create → select worker/date → add loads → stock check → Save (Draft) → Worker confirm load → status Out.

**Flow B — Worker bill:** Home → New Bill → customer → items → trays → payment → confirm → share.

**Flow C — Settlement:** Worker Count → closing inputs → submit → Admin Trip detail → review differences → Approve → Close.

**Flow D — Damage:** Worker adds damage → status Pending → Admin approves → stock and P/L update.

**Flow E — Due collection:** Admin customer → Collect payment → amount/mode → due update.

## 12. Validation & Microcopy

| Field | Rule | Message |
| --- | --- | --- |
| Phone | 10 digits | "Sahi 10 digit number daalo" |
| Quantity | > 0, integer | "Quantity 1 ya usse zyada ho" |
| Qty > stock | ≤ left stock | "Sirf 8 tray bache hain" |
| Payment | cash + online ≤ total | "Paid amount total se zyada nahi ho sakta" |
| Delete | confirm | "Pakka delete karna hai? Ye wapas nahi hoga" |
| Network error | retry | "Net slow hai. Dobara try karein" |

Microcopy tone: simple Hinglish option ya English; short, action oriented.

## 13. States

- **Loading:** skeleton (spinner nahi).
- **Empty:** icon + ek line + CTA ("Pehla customer add karo").
- **Error:** inline message + Retry; page-level error me "Dobara load karo".
- **Offline (worker):** top banner "Offline — bill save ho jayega, net aate hi sync"; bill queue badge (v1.1).
- **Success:** toast + clear next action.

## 14. Accessibility

- WCAG AA contrast, focus ring (2px primary), keyboard navigation (admin).
- Labels har input par; error text color ke saath icon bhi.
- Tap target min 44–48px; font min 13px.
- Status sirf color se nahi, text/icon bhi.

## 15. Performance UX

- Route-level code splitting; admin charts lazy load.
- Worker app PWA: shell cache, repeat load < 1 sec.
- Customer list / rates ek baar cache (TanStack Query) — billing ke time instant search.
- Optimistic UI: bill save par turant success, background sync.
- Images minimal; fonts subset + `font-display: swap`.
- Budget: initial JS < 200 KB (worker), < 300 KB (admin).

## 16. Acceptance Criteria (key)

1. Worker repeat customer ka bill 12 taps / 45 sec me bana sake.
2. Mix payment me ek amount likhte hi dusra auto-fill aur due sahi dikhe.
3. Qty available stock se zyada ho to bill save na ho.
4. Settlement screen par short/excess eggs aur trays clearly dikhe.
5. Damage tabs High-rate / Low-rate alag totals dikhaye.
6. Customer rate change hone par purane bills ka amount na badle.
7. Sab main screens mobile (360px) par bina horizontal scroll ke chale.
8. Lighthouse performance ≥ 90 (mobile) worker pages par.

## 17. Decisions & Notes (Updated)

1. **Brand Colors:** Finalized from custom palette — `#388087` (Primary Teal), `#6FB3B8` (Soft Cyan), `#BADFE7` (Ice Blue), `#C2EDCE` (Mint Green), `#F6F6F2` (Warm Off-white background).
2. **Languages / Labels:** Support for Hindi, Marathi, and Hinglish / Roman Hindi in bills & interface.
3. **Bill Share:** WhatsApp pre-filled text message with bill summary + link (`https://wa.me/...?text=...`).
4. **Worker Visibility:** Worker ko customer ka due and pending tray balance bill banate waqt dikhega (helps in collecting payment & trays on the spot).
