# WRS Management System — Product Overview

**Purpose:** Functional and architectural specification for the WRS Management System, intended as a handoff to an implementing agent. The agent selects the tech stack; this document defines what must be built and the architectural principles the implementation must honor regardless of stack.

**Phase 1 scope:** Single-role (admin) web application. The owner operates the system end to end. Riders, areas, and per-rider commission are managed by the admin in Phase 1, but riders never log in — they exist as records for delivery attribution and payroll computation. Other roles (manager, cashier), the rider mobile app, and regulatory permit tracking are reserved for Phase 2.

---

## 1. What this app is

A web admin application for a Water Refilling Station (WRS). Single-station, single-branch deployment to start; architected for multi-tenant SaaS expansion when the platform is proven on the owner's operation.

Handles the daily operations of a small Philippine WRS, performed by a single operator (the owner):

- Walk-in sales at the counter
- Scheduled deliveries to customer addresses (admin records all outcomes after the fact)
- Recurring booking templates with default rider assignment
- Container deposit accounting (event-sourced movements)
- Areas and rider management with coverage handover
- Per-rider daily attendance, quota, and commission
- Monthly-salary-driven payroll with auto-computed daily/weekly/monthly income views
- Water-treatment maintenance scheduling
- Per-customer pricing overrides
- Operational expense tracking
- Vehicle records and vehicle preventive maintenance scheduling

---

## 2. Architectural Principles (stack-agnostic, binding)

### 2.1 Multi-tenant ready, single-tenant deployed
Every transactional record tagged with `tenant_id` and `branch_id`. Tenant isolation enforced at the data-access layer (database row security if available, application middleware otherwise) — never UI-only.

### 2.2 Money as integer minor units
All monetary values in centavos (₱1.00 = 100). No floats.

### 2.3 Timestamps in UTC, rendered in Asia/Manila

### 2.4 Event-sourced cash and containers
Container outstanding balances and cash totals derived from event tables — never stored as running-total columns.

### 2.5 One Sale model, multiple sources
Walk-in, delivery, and booking-fulfilled sales share one record type with a `source` discriminator.

### 2.6 Soft delete only
Every record has `deleted_at` + `deleted_by`. No hard deletes through the API.

### 2.7 Snapshot prices on sale lines
Line items snapshot the applied price.

### 2.8 Schema-level affordances for Phase 2

Even though Phase 1 has only the `admin` interactive role, the data model carries forward-compat:

- `user_role` enum has all four values: `admin`, `manager`, `cashier`, `rider`. Phase 1 creates `admin` users (interactive) and `rider` users (records only, never log in).
- `sales` table has nullable `cashier_id` and `rider_id` columns. `rider_id` is actively used in Phase 1 from the rider records; `cashier_id` is null in Phase 1, populated in Phase 2.
- Permits tables are deferred to Phase 2 — not built in Phase 1.

### 2.9 Tenant-configurable thresholds
Magic numbers (staleness windows, booking horizon, commission rate, default quota) live in tenant Settings, not code constants.

### 2.10 No external integrations in MVP
GCash recorded manually. No SMS, no payment webhooks. Map rendering for address pinning permitted (any tile provider).

### 2.11 Compensation derives from monthly salary + attendance + commission
The system computes daily, weekly, and monthly income from three inputs: a monthly base salary set by admin, a daily attendance flag, and (for riders) accumulated daily commission from over-quota deliveries. The computed value pre-fills salary records at payment time; admin can edit before submitting. Workdays = Monday through Saturday. Sundays = rest day, no pay.

---

## 3. Roles (Phase 1)

**One active role: `admin`.** Full system access. Every screen is admin-only.

`rider` exists as a role for non-interactive records — admin creates rider users to attribute deliveries and compute payroll, but riders never log in. The rider mobile app and rider-side workflows are Phase 2.

`manager` and `cashier` exist in the enum for forward compatibility only; no users in these roles in Phase 1.

---

## 4. Modules (Phase 1 scope)

### 4.1 HR & Compensation

**Employee records:** Each employee (rider or admin) has:
- Name, contact, hire date, role
- `monthly_salary_centavos` (set by admin, change at raises)
- For riders only: `daily_quota_jugs` (default from Settings, overridable per rider)
- Active flag

**Daily attendance:** A per-employee per-date flag (`present | absent`). Admin marks at end-of-day or in bulk. Absence on a workday = no pay for that day.

**Workday convention:** Monday–Saturday. Sundays are excluded entirely from pay computation (no pay either way, regardless of attendance).

**Daily rate computation:** `monthly_salary_centavos / number_of_workdays_in_period`. The agent should compute per the actual calendar (e.g., a 31-day month with 5 Sundays has 26 workdays).

**Commission (riders only):**
- Daily commission = `max(0, jugs_delivered_that_day − daily_quota_jugs) × commission_per_jug_centavos` (rate from Settings, tenant-wide).
- "Jugs delivered" = sum of items on the rider's `completed` delivery sales for that date.

**Three computed income views per employee, available any time:**
- Today's income = (daily_rate if present else 0) + today's commission
- This week's income = sum over Mon–Sat of the current week
- This month's income = sum over Mon–Sat of the current month

Views show base pay and commission as separate lines so admin can see the breakdown.

**Salary records (payment audit trail):**
- Created when admin pays an employee for a period.
- Form pre-populates: base pay, commission, gross (base + commission), net (= gross in Phase 1, no deductions).
- Admin can edit before submitting.
- Submitted record is read-only history with `paid_at` and `paid_by`.

**Out of scope (Phase 2+):** Deductions (SSS, PhilHealth, Pag-IBIG, withholding tax), 13th-month auto-calc, leaves, multiple pay rates per employee, off-cycle bonuses, multi-period salary records.

### 4.2 Areas & Rider Management

**Area:** named territory (e.g., "Palo East", "Tanauan"). Fields: name, notes. Each area has exactly one **primary rider** at any time.

**Coverage record:** when a primary rider is unavailable, another rider can temporarily own the area. Coverage record has: area, covering_rider, `starts_on`, `ends_on` (nullable for open-ended). Only one active coverage record per area at any given date — the system enforces non-overlap.

**Current active rider for an area on a given date:**
- If a coverage record covers that date → the covering rider.
- Otherwise → the primary rider.

**Permanent reassignment:** admin edits the area's `primary_rider_id` directly. Old primary is no longer responsible from that point forward.

**Customer–area relationship:** each customer optionally has an `area_id`. Recommended for delivery customers; optional for walk-in-only customers.

**Default rider derivation:**
- For a delivery sale of a customer with an `area_id` → default `rider_id` = current active rider for that area on the delivery date.
- For a recurring booking template → default `rider_id` = current active rider for the customer's area on the template creation date (or on each materialized booking date — agent's call; cleaner to resolve on materialization).
- Admin can override the default before saving.

**Absence-driven payroll:** when a rider is marked absent for a day, their `daily_attendance` for that day is `absent`. If coverage is active for their area, the covering rider absorbs the delivery volume — and the resulting commission, since commission follows the rider on the sale.

### 4.3 Customers

**In scope:**
- Profile: name, phone, type (residential / commercial), notes.
- `area_id` optional reference (see §4.2).
- Multiple addresses per customer with one default. Each address optionally carries lat/lng coordinates, set via a map widget by admin.
- Customer-specific price overrides per product × container-type pair (refill and new-container prices).
- Duplicate-phone warning at creation.
- Derived: container balance per type, sales history, AR balance.
- Staleness chip: derived "days since last order"; shows when above the configured threshold.

**Out of scope:** Credit limits, customer tiers, AR aging reports.

### 4.4 Products & Containers

- Products (purified, mineral, alkaline) — managed list.
- Container types (slim 5gal, round 5gal, 1gal, etc.) with deposit value.
- Base pricing per product × container-type (refill and new-container prices).
- Customer-specific overrides on the same dimensions.
- Container movements event log: `out`, `in`, `lost`, `adjustment`.
- Station inventory dashboard: in-stock, with customers, lost, total.

**Out of scope:** Barcode/serial tracking, supplier purchase orders, parts inventory.

### 4.5 Sales

One sale model, three sources:

| Source | Customer | Address |
|---|---|---|
| Walk-in | Optional | No |
| Delivery | Required | Required |
| Booking-fulfilled | Required | Required |

Walk-ins may be anonymous or linked. Admin POS defaults to anonymous, with a "link customer" action.

**Delivery sales carry a `rider_id`** (referenced from the customer's area-derived default; overridable by admin) and a `delivered_by_name` text fallback (for cases where the deliverer isn't a rider record — e.g., the admin themselves).

**Pricing resolution:** customer override → base price → admin manual override (snapshotted).

**Payment methods:** cash, GCash (manual reference), on-account.

**Deposit-on-credit:** customer takes container with deposit recorded as on-account; the deposit becomes AR.

**Out of scope:** Discounts, loyalty, returns/refunds workflow.

### 4.6 Bookings

- One-off bookings: customer, address, scheduled date, items.
- Recurring templates: weekly / bi-weekly / monthly cadence, with default rider derived from customer's area.
- Scheduled job materializes templates into the next N days (N from Settings, default 7).
- On fulfillment, booking converts to a delivery sale and the booking flips to `fulfilled`.
- Editing a booking doesn't affect its parent template.

### 4.7 Deliveries (admin-driven)

No rider mobile app in Phase 1. Admin records outcomes after the fact:

1. Admin creates delivery sale (customer, address, items, `rider_id` defaulted from area, optional `delivered_by_name`).
2. Sale enters `pending_delivery`.
3. Physical delivery happens.
4. Admin opens "Deliveries Today" board, per delivery records: mark delivered, actual cash collected (recorded as sale payment), containers returned per type (creates `in` movements).
5. Sale flips to `completed`. Commission accrues to the recorded `rider_id` for that delivery date.

No remittance entity in Phase 1 — admin reconciles their own cash drawer informally via a "Today's sales" view.

### 4.8 Maintenance

Tasks across two scopes: **water plant equipment** and **vehicles** (§4.10). Same task/log model.

- Task config: `scope` (`water_plant | vehicle`), task type, schedule kind (time | usage), interval, last done, next due (auto-recomputed after each log).
- Water plant types: filter swap, RO membrane, UV lamp, water potability test, ozonator clean, softener regen, custom.
- Vehicle types: oil change, brake check, tire check, chain lube, air filter, spark plug, battery, tune-up, custom.
- Logs: performed-at, performed-by (employee reference), notes, cost.
- Dashboard widgets: "Due now" and "Due in 7 days" (grouped by scope).

### 4.9 Operational Expenses

- Fields: date, category (gasoline, parts, supplies, utilities, other), amount, payee (optional employee reference), description, optional reference number.
- All entries admin-recorded. No approval workflow.
- Reports: by category, by payee, by date range.

### 4.10 Vehicles

- Records: type, brand/model, plate number, year, notes.
- Subjects of vehicle-scoped maintenance tasks (§4.8). Optional default PM template at creation.
- "Vehicles" admin page lists vehicles with upcoming/overdue PMs.

**Out of scope:** Rider assignment (Phase 2), insurance/registration tracking, mileage logging.

### 4.11 Settings

Tenant-wide configurable thresholds, all editable by admin:

| Setting | Default |
|---|---|
| Customer staleness threshold — delivery | 7 days |
| Customer staleness threshold — walk-in | 14 days |
| Booking materialization horizon | 7 days |
| Default rider quota (jugs/day) | 150 |
| Commission per jug (tenant-wide) | ₱1 (100 centavos) |

Treat Settings as a typed key-value store surfaced as a structured form.

---

## 5. Key Workflows (Phase 1)

### 5.1 Walk-in sale (anonymous)
1. Admin opens POS, selects items, customer blank.
2. Base price applies. Admin records payment method.
3. Sale `source = walk_in`, no customer. Container out movement if applicable.

### 5.2 Walk-in sale (linked customer)
Same, with "link customer" autocomplete. Customer override checked. Container movements attributed to customer.

### 5.3 Delivery cycle
1. Admin creates delivery sale. `rider_id` defaults from customer's area's current active rider.
2. Sale is `pending_delivery`. Physical delivery happens.
3. Admin reconciles on the "Deliveries Today" board: mark delivered, record actual cash, record containers returned. Sale → `completed`.
4. Commission accrues to the sale's `rider_id` for that date.

### 5.4 Recurring booking lifecycle
1. Admin creates template; `rider_id` defaulted from customer's area at materialization time.
2. Daily job materializes upcoming bookings.
3. On scheduled day, admin converts booking to delivery sale → §5.3.

### 5.5 Mark rider absent
1. Admin opens rider's attendance for the date, marks `absent`.
2. If coverage is needed, admin creates a coverage record for the rider's area with a covering rider and a date range.
3. From that point in the date range, deliveries to that area default to the covering rider, and commission accrues to them.

### 5.6 Salary payout
1. Admin opens an employee's income view, picks period (today / this week / this month / custom).
2. System shows: base pay (workdays × daily rate, minus absent days), commission (riders only), gross.
3. Admin clicks "Create Salary Record." Form pre-populates from the computed values. Admin can edit.
4. Admin submits. Record stored with `paid_at` and `paid_by`. Read-only thereafter.

---

## 6. Scope Summary

### 6.1 In Phase 1
- Tenant + branch scaffolding (single of each)
- Auth, admin-only role enforced
- Customers, addresses (admin map pin), price overrides, staleness chip, AR balance
- Container types + movements + station inventory dashboard
- Sales (walk-in / delivery / booking-fulfilled) with deposit-on-credit
- Bookings (one-off + recurring with default rider)
- Deliveries admin-driven with rider attribution
- Areas + primary rider + date-ranged coverage + permanent reassignment
- Rider records (non-interactive users)
- Daily attendance per employee
- Monthly-salary-driven payroll with auto-computed daily/weekly/monthly income views
- Per-rider quota + tenant-wide commission rate + daily commission accrual
- Salary records as payment audit trail (pre-filled from computed values, editable, submitted as read-only)
- Maintenance (water plant + vehicle scopes)
- Vehicles registry with PM tasks
- Operational expenses (admin-recorded)
- Settings module

### 6.2 Reserved for Phase 2
| Item | Why deferred |
|---|---|
| Rider mobile app (PWA) | Owner-only operation in Phase 1 |
| Manager / cashier roles + UIs | Owner is the only user |
| GPS logging + route history | Requires rider PWA |
| Rider-side address pinning | Requires rider PWA |
| Cashier shift remittance | Requires cashier role |
| Rider end-of-day remittance | Requires rider PWA |
| Gasoline allowance auto-generation | Requires rider role |
| Bonus payout cadences (daily/weekly/15-30/monthly) | Tied to rider PWA visibility |
| Regulatory permit tracking | Tracked outside system in Phase 1 |
| Deductions / taxes / 13th-month | Manual, off-system in Phase 1 |
| Returns/refunds workflow | Handle as void + new sale |
| Customer self-service portal | Volume too low |

### 6.3 Saved for SaaS launch
Subscription billing, tenant onboarding, per-tenant branding, multi-branch UI, cross-tenant analytics.

---

## 7. Phasing Commitment

- Phase 1 built, shipped, and run in the owner's station for at least four weeks before Phase 2 work begins.
- A `phase-2-ideas.md` accumulates ideas during Phase 1 operation.
- No Phase 2 features during Phase 1 build.

Realistic Phase 1 timeline: 5–7 weeks of focused effort, longer with a fragmented schedule.

---

## 8. For the Implementing Agent

**Reserved for the agent:**
- Database engine and schema syntax
- Backend framework
- Frontend framework and component library
- State management
- Build tooling and deployment target
- Authentication provider
- Hosting environment
- Migration tooling
- Map rendering provider (one use case in Phase 1: address pinning by admin)

**Architecturally binding:**
- Multi-tenant data model with `tenant_id` + `branch_id` on every transactional record
- Tenant isolation enforced at data-access layer (never UI-only)
- Money as integer minor units
- Timestamps in UTC
- Event-sourced cash and container balances
- One Sale entity with `source` discriminator
- Soft delete only
- Sale lines snapshot the applied price
- `user_role` enum has all four values from day one
- `sales` table has nullable `cashier_id` and `rider_id` columns from day one; `rider_id` actively used in Phase 1
- `delivery sale` has a `delivered_by_name` text field for non-rider deliveries
- Settings is a typed key-value store, not code constants
- Compensation derives from monthly salary + attendance + commission per §2.11

The agent produces its own implementation plan referencing this document. Ambiguities should be raised before implementation, not resolved by guessing.

---

## 9. Repeatability Note

The pattern used here — feature list → architectural principles → roles → modules → workflows → scope → phasing — is reusable for any operational SaaS-style system. After running this exercise on 2–3 additional domains (Petron POS, Llorente leasing, café ops), the template stabilizes into a reusable design skill.