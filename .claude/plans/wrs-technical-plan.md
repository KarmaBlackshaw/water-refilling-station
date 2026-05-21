# WRS Management System — Technical Implementation Plan

**Date:** 2026-05-16  
**Stack confirmed from codebase scan**

---

## 1. Confirmed Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | Vue 3 + `<script setup lang="ts">` | Composition API only |
| State | Pinia 3 | Auto-imported from `src/stores/` |
| Routing | unplugin-vue-router (file-based) | Pages live in **`src/pages/`** (default) |
| Styling | Tailwind CSS v4 (CSS-first via `@theme`) | Token system already in `main.css` |
| Backend | Supabase JS v2 | Client at `src/helpers/supabase.ts` |
| Charts | vue-chartjs | Already installed |
| Utilities | @vueuse/core, vue-toastification | Auto-imported |
| Auto-imports | unplugin-auto-import | `src/composables`, `src/stores`, `src/lib`, `src/services` |
| Auto-components | unplugin-vue-components | `directoryAsNamespace` + `collapseSamePrefixes` |

### Component naming convention (from vite.config.ts)
Directory prefix collapses into component name:
- `src/components/Base/Button.vue` → `<BaseButton>`
- `src/components/The/Sidebar.vue` → `<TheSidebar>`
- `src/components/Icon/Check.vue` → `<IconCheck>`
- `src/components/[Feature]/Form.vue` → `<[Feature]Form>` (e.g. `<CustomerForm>`)

### Auto-import scope
`vue`, `vue-router`, `pinia` symbols + everything exported from:
- `src/composables/` → `useAsync`, `useToast`, etc.
- `src/stores/` → `useThemeStore`, etc.
- `src/lib/` (note: currently helpers/, align one or the other)
- `src/services/` → service functions

**Rule:** Never add explicit imports for symbols auto-imported by these dirs.

---

## 2. Design System

### Token strategy (Tailwind v4 CSS-first)
The existing `src/assets/main.css` already has a complete token system. **Do not replace it — extend it.**

Existing semantic tokens:
```
Surfaces:    --color-bg, --color-surface, --color-surface-2
Text:        --color-fg, --color-fg-muted, --color-fg-subtle
Accent:      --color-accent, --color-accent-soft
Status:      --color-positive, --color-warning, --color-negative
UI chrome:   --color-border, --color-hover, --color-ring
Utility:     --color-azure, --color-teal-dark, --color-amber, --color-purple
Shadows:     --shadow-sm, --shadow-glass
```

Dark mode: `.dark` class on `<html>`. Already wired in theme store.

### UI style: Clean Professional Admin
WRS is a data-dense operations app operated by a single admin. Style priorities:
1. Information density over decoration
2. Monospaced tabular numbers for all money/quantities (`.num` class in main.css)
3. Status colors: green = completed/positive, amber = pending/warning, red = negative
4. Sidebar navigation (already in MainLayout.vue)
5. Cards for KPI widgets, tables for lists, forms in modals or slide-over panels

### Typography
- Font: Inter (already loaded)
- Scale: 12 / 14 / 16 / 18 / 24 / 32
- Body: 14px (admin apps are denser than consumer apps)
- All monetary values: `.num` class (tabular numerics, already defined)

### Color additions needed (add to main.css `@theme`)
```css
/* WRS-specific semantic aliases */
--color-status-pending: var(--color-amber);
--color-status-completed: var(--color-positive);
--color-status-cancelled: var(--color-negative);
--color-status-overdue: var(--color-negative);
```

---

## 3. Directory Structure (target state)

```
src/
├── assets/
│   └── main.css               # Tailwind v4 @theme tokens (existing)
├── components/
│   ├── Base/                  # Generic primitives (auto-prefixed "Base")
│   │   ├── Button.vue
│   │   ├── Input.vue
│   │   ├── Select.vue
│   │   ├── Textarea.vue
│   │   ├── Checkbox.vue
│   │   ├── Table.vue          # + TableHeader, TableRow, TableCell
│   │   ├── Modal.vue
│   │   ├── Badge.vue
│   │   ├── Card.vue
│   │   ├── Spinner.vue
│   │   ├── EmptyState.vue
│   │   ├── Pagination.vue
│   │   ├── DatePicker.vue     # wraps vue-tailwind-datepicker
│   │   ├── Tabs.vue
│   │   └── index.ts
│   ├── The/                   # App shell singletons
│   │   ├── Sidebar.vue        # TheSidebar
│   │   ├── Topbar.vue         # TheTopbar
│   │   ├── ThemeToggle.vue    # TheThemeToggle
│   │   └── index.ts
│   ├── Icon/                  # SVG icon components (auto-prefixed "Icon")
│   │   └── ...
│   ├── Customer/              # Feature components
│   ├── Sale/
│   ├── Delivery/
│   ├── Booking/
│   ├── Product/
│   ├── Area/
│   ├── Employee/
│   ├── Maintenance/
│   ├── Expense/
│   └── Vehicle/
├── composables/
│   ├── useAsync.ts            # existing
│   ├── useToast.ts            # existing
│   ├── useConfirm.ts          # destructive action confirm dialog
│   ├── usePagination.ts       # offset pagination helper
│   └── use[Feature].ts        # per feature
├── helpers/
│   ├── supabase.ts            # existing
│   ├── date.ts                # existing
│   ├── money.ts               # centavos ↔ display, format ₱
│   └── workday.ts             # Mon–Sat workday computation
├── pages/                     # File-based routes (unplugin-vue-router)
│   ├── index.vue              # → /  (redirect to dashboard or login)
│   ├── login.vue              # → /login
│   ├── dashboard.vue          # → /dashboard
│   ├── customers/
│   │   ├── index.vue          # → /customers
│   │   └── [id].vue           # → /customers/:id
│   ├── sales/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── deliveries/
│   │   └── index.vue
│   ├── bookings/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── products/
│   │   └── index.vue
│   ├── areas/
│   │   └── index.vue
│   ├── employees/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── maintenance/
│   │   └── index.vue
│   ├── vehicles/
│   │   └── index.vue
│   ├── expenses/
│   │   └── index.vue
│   └── settings/
│       └── index.vue
├── services/
│   ├── index.ts
│   ├── auth.ts
│   ├── customers.ts
│   ├── sales.ts
│   ├── deliveries.ts
│   ├── bookings.ts
│   ├── products.ts
│   ├── areas.ts
│   ├── employees.ts
│   ├── payroll.ts
│   ├── maintenance.ts
│   ├── vehicles.ts
│   ├── expenses.ts
│   └── settings.ts
├── stores/
│   ├── theme.ts               # existing
│   ├── auth.ts                # session, current user
│   └── tenant.ts              # tenant + branch context, settings cache
├── types/
│   ├── common.ts              # existing
│   ├── menu-item.ts           # existing
│   ├── placeholder.ts         # existing
│   ├── table.ts               # existing
│   └── database.ts            # generated or hand-crafted Supabase types
└── layouts/
    ├── MainLayout.vue          # existing (needs TheSidebar + TheTopbar)
    └── AuthLayout.vue          # new — centered card for login
```

---

## 4. Database Schema

### Global conventions (binding — from wrs-overview §2)
- Every transactional table: `tenant_id uuid NOT NULL`, `branch_id uuid NOT NULL`
- Soft delete: `deleted_at timestamptz`, `deleted_by uuid REFERENCES users(id)`
- Money: integer centavos only. No floats.
- Timestamps: UTC (`timestamptz`). Render in `Asia/Manila` in UI.
- RLS: enabled on every table in `public`
- Event-sourced: container balances and cash totals are derived, never stored as columns
- Sale lines snapshot price at time of sale

### RLS policy pattern
```sql
-- Tenant isolation via app_metadata JWT claim
(auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid = tenant_id
-- NEVER use user_metadata — it is user-editable and unsafe for RLS
```

### Tables (grouped by module)

**Tenant scaffolding**
```sql
tenants(id, name, created_at)
branches(id, tenant_id, name, created_at)
users(
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  tenant_id, branch_id,
  full_name, phone, role user_role_enum, active bool,
  created_at, deleted_at, deleted_by
)
-- user_role_enum: 'admin' | 'manager' | 'cashier' | 'rider'
```

**Settings**
```sql
settings(
  id, tenant_id, branch_id,
  key text NOT NULL,  -- 'staleness_days_delivery', 'commission_per_jug_centavos', etc.
  value text NOT NULL,
  UNIQUE(tenant_id, branch_id, key)
)
```

**Products & Containers**
```sql
products(id, tenant_id, branch_id, name, active, sort_order, deleted_at, deleted_by)
container_types(id, tenant_id, branch_id, name, deposit_centavos, active, sort_order, deleted_at, deleted_by)
product_pricing(
  id, tenant_id, branch_id,
  product_id, container_type_id,
  refill_price_centavos int NOT NULL,
  new_container_price_centavos int NOT NULL,
  effective_from date NOT NULL,
  created_at
)
```

**Customers**
```sql
customers(
  id, tenant_id, branch_id,
  name, phone, type customer_type_enum,  -- 'residential' | 'commercial'
  area_id uuid REFERENCES areas(id),
  notes text,
  active bool DEFAULT true,
  created_at, deleted_at, deleted_by
)
customer_addresses(
  id, customer_id, tenant_id, branch_id,
  label text, address_line text,
  lat numeric(10,7), lng numeric(10,7),
  is_default bool,
  deleted_at, deleted_by
)
customer_price_overrides(
  id, customer_id, tenant_id, branch_id,
  product_id, container_type_id,
  refill_price_centavos int NOT NULL,
  new_container_price_centavos int NOT NULL,
  created_at, deleted_at, deleted_by
)
```

**Areas & Riders**
```sql
areas(
  id, tenant_id, branch_id,
  name, notes,
  primary_rider_id uuid REFERENCES users(id),
  deleted_at, deleted_by
)
area_coverage_records(
  id, tenant_id, branch_id,
  area_id, covering_rider_id uuid REFERENCES users(id),
  starts_on date NOT NULL,
  ends_on date,  -- NULL = open-ended
  created_at, deleted_at, deleted_by
  -- UNIQUE constraint: no overlapping coverage per area per date range
)
```

**Sales**
```sql
sales(
  id, tenant_id, branch_id,
  source sale_source_enum,  -- 'walk_in' | 'delivery' | 'booking_fulfilled'
  status sale_status_enum,  -- 'pending_delivery' | 'completed' | 'void'
  customer_id uuid REFERENCES customers(id),
  address_id uuid REFERENCES customer_addresses(id),
  rider_id uuid REFERENCES users(id),          -- delivery only, nullable
  cashier_id uuid REFERENCES users(id),        -- Phase 2, nullable
  delivered_by_name text,                      -- fallback for non-rider deliveries
  booking_id uuid REFERENCES bookings(id),     -- if booking_fulfilled
  sale_date date NOT NULL,
  notes text,
  created_at, deleted_at, deleted_by
)
sale_lines(
  id, sale_id, tenant_id, branch_id,
  product_id, container_type_id,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price_centavos int NOT NULL,            -- snapshotted at sale time
  is_new_container bool NOT NULL DEFAULT false,
  created_at
)
sale_payments(
  id, sale_id, tenant_id, branch_id,
  method payment_method_enum,  -- 'cash' | 'gcash' | 'on_account'
  amount_centavos int NOT NULL,
  gcash_ref text,
  created_at
)
```

**Container movements (event-sourced)**
```sql
container_movements(
  id, tenant_id, branch_id,
  customer_id uuid REFERENCES customers(id),
  container_type_id,
  sale_id uuid REFERENCES sales(id),
  movement_type container_movement_enum,  -- 'out' | 'in' | 'lost' | 'adjustment'
  quantity int NOT NULL,                  -- positive = out/lost, negative = in (or use sign)
  movement_date date NOT NULL,
  notes text,
  created_at, deleted_at, deleted_by
)
```

**Bookings**
```sql
booking_templates(
  id, tenant_id, branch_id,
  customer_id, address_id,
  rider_id,
  cadence booking_cadence_enum,  -- 'weekly' | 'bi_weekly' | 'monthly'
  day_of_week smallint,          -- 0=Mon..5=Sat
  active bool DEFAULT true,
  created_at, deleted_at, deleted_by
)
booking_template_items(
  id, template_id, tenant_id, branch_id,
  product_id, container_type_id, quantity int NOT NULL,
  is_new_container bool DEFAULT false
)
bookings(
  id, tenant_id, branch_id,
  template_id uuid REFERENCES booking_templates(id),
  customer_id, address_id, rider_id,
  scheduled_date date NOT NULL,
  status booking_status_enum,  -- 'pending' | 'fulfilled' | 'cancelled'
  sale_id uuid REFERENCES sales(id),  -- set when fulfilled
  created_at, deleted_at, deleted_by
)
booking_items(
  id, booking_id, tenant_id, branch_id,
  product_id, container_type_id, quantity int NOT NULL,
  is_new_container bool DEFAULT false
)
```

**Employees / HR**
```sql
employees(
  id, tenant_id, branch_id,
  user_id uuid REFERENCES users(id),
  full_name text NOT NULL,
  phone text, hire_date date,
  monthly_salary_centavos int NOT NULL,
  daily_quota_jugs int,         -- riders only, NULL for non-riders
  active bool DEFAULT true,
  created_at, deleted_at, deleted_by
)
employee_attendance(
  id, tenant_id, branch_id,
  employee_id, attendance_date date NOT NULL,
  status attendance_status_enum,  -- 'present' | 'absent'
  created_at,
  UNIQUE(employee_id, attendance_date)
)
salary_records(
  id, tenant_id, branch_id,
  employee_id,
  period_start date NOT NULL, period_end date NOT NULL,
  base_pay_centavos int NOT NULL,
  commission_centavos int NOT NULL DEFAULT 0,
  gross_centavos int NOT NULL,
  net_centavos int NOT NULL,
  notes text,
  paid_at timestamptz,  -- NULL = draft, NOT NULL = submitted/read-only
  paid_by uuid REFERENCES users(id),
  created_at
)
```

**Vehicles & Maintenance**
```sql
vehicles(
  id, tenant_id, branch_id,
  type text, brand_model text, plate_number text,
  year smallint, notes text,
  created_at, deleted_at, deleted_by
)
maintenance_tasks(
  id, tenant_id, branch_id,
  scope maintenance_scope_enum,  -- 'water_plant' | 'vehicle'
  vehicle_id uuid REFERENCES vehicles(id),  -- NULL for water_plant scope
  task_type text NOT NULL,       -- 'filter_swap' | 'oil_change' | 'custom' etc.
  schedule_kind schedule_kind_enum,  -- 'time' | 'usage'
  interval_days int,             -- for time-based
  interval_usage int,            -- for usage-based
  last_done_at date,
  next_due_at date,              -- recomputed after each log
  active bool DEFAULT true,
  created_at, deleted_at, deleted_by
)
maintenance_logs(
  id, task_id, tenant_id, branch_id,
  performed_at date NOT NULL,
  performed_by uuid REFERENCES users(id),
  cost_centavos int,
  notes text,
  created_at
)
```

**Operational Expenses**
```sql
operational_expenses(
  id, tenant_id, branch_id,
  expense_date date NOT NULL,
  category expense_category_enum,  -- 'gasoline'|'parts'|'supplies'|'utilities'|'other'
  amount_centavos int NOT NULL,
  payee_employee_id uuid REFERENCES employees(id),  -- optional
  description text,
  reference_number text,
  created_at, deleted_at, deleted_by
)
```

### Key indexes (supabase-postgres-best-practices)
```sql
-- Every transactional table needs this composite:
CREATE INDEX ON <table> (tenant_id, branch_id) WHERE deleted_at IS NULL;

-- Lookups by date (deliveries, attendance, expenses):
CREATE INDEX ON sales (tenant_id, branch_id, sale_date) WHERE deleted_at IS NULL;
CREATE INDEX ON employee_attendance (employee_id, attendance_date);

-- Container balance computation:
CREATE INDEX ON container_movements (customer_id, container_type_id, movement_date);

-- Booking materialization:
CREATE INDEX ON bookings (tenant_id, branch_id, scheduled_date, status) WHERE deleted_at IS NULL;

-- Coverage record lookups:
CREATE INDEX ON area_coverage_records (area_id, starts_on, ends_on) WHERE deleted_at IS NULL;

-- Price resolution:
CREATE INDEX ON customer_price_overrides (customer_id, product_id, container_type_id) WHERE deleted_at IS NULL;
```

---

## 5. Computed / Derived Logic (never stored)

| Derived Value | Computation |
|---|---|
| Customer container balance | `SUM(quantity) WHERE movement_type IN ('out','lost') - SUM(quantity) WHERE movement_type = 'in'` per customer+type |
| Customer AR balance | `SUM(amount) WHERE method = 'on_account'` from sale_payments |
| Daily rate | `monthly_salary_centavos / workdays_in_month(year, month)` |
| Workdays in period | Count Mon–Sat, exclude Sundays |
| Today's commission | `MAX(0, jugs_delivered_today - daily_quota_jugs) × commission_per_jug` |
| Rider income (period) | `SUM(daily_rate WHERE present) + SUM(commission)` per period |
| Area's active rider on date | Coverage record if one exists for that date, else `primary_rider_id` |
| Customer staleness | `CURRENT_DATE - MAX(sale_date) WHERE customer_id = ?` |

---

## 6. Auth Architecture

### JWT strategy (safe: app_metadata, not user_metadata)
```
auth.users → creates → users(id, tenant_id, branch_id, role)
app_metadata: { tenant_id, branch_id, role }
```

On user creation: Supabase Edge Function or admin script sets `app_metadata`.

### Auth store (`src/stores/auth.ts`)
```ts
{
  session: Session | null,
  user: User | null,      // auth.users
  profile: UserRow | null // our users table row
}
```

### Router guard (`src/router.ts`)
- Before each: if route requires auth and no session → redirect `/login`
- If session exists and going to `/login` → redirect `/dashboard`
- Route meta: `{ requiresAuth: true }` on all non-login routes

---

## 7. Helpers to build

### `src/helpers/money.ts`
```ts
// centavos → "₱1,234.56"
formatMoney(centavos: number): string

// string/number input → centavos (for form inputs)
parseMoney(display: string): number
```

### `src/helpers/workday.ts`
```ts
// Count Mon–Sat days in [start, end] inclusive
countWorkdays(start: Date, end: Date): number

// Daily rate from monthly salary
dailyRate(monthlyCentavos: number, year: number, month: number): number

// Is a given date a workday?
isWorkday(date: Date): boolean
```

---

## 8. Module Task Breakdown

Tasks are sequenced by dependency. Tasks within the same group can be parallelized.

### Group 0 — Housekeeping (do first, sequential)

**T0: Fix tsc + align directory structure**
- Verify `npx tsc --noEmit` clean
- Resolve `src/router.ts` vs `src/router/index.ts` conflict (keep `src/router.ts` with auto-routes)
- Align `src/lib` auto-import dir (vite.config.ts says `src/lib` but files are in `src/helpers/`) — either rename helpers → lib or update vite.config.ts
- Create `src/pages/` directory, move `src/views/HomeView.vue` → `src/pages/index.vue`
- Delete `src/views/` once empty

### Group 1 — Foundation (sequential, each depends on previous)

**T1: Design system tokens + Base component library**
- Add WRS status tokens to main.css
- Build all Base/ components: Button, Input, Select, Textarea, Checkbox, Table (+ sub-components), Modal, Badge, Card, Spinner, EmptyState, Pagination, DatePicker wrapper, Tabs
- Each component: use existing CSS tokens, no raw hex values, dark-mode aware
- Button: `variant` prop (primary | secondary | ghost | danger), `size` (sm | md | lg), loading state
- Input: visible label, error slot, helper text support
- Table: sortable headers with `aria-sort`, empty state slot
- Modal: focus trap, escape to close, confirm prop for destructive

**T2: App shell components**
- `src/components/The/Sidebar.vue` — collapsible sidebar with nav items, WRS logo, theme toggle
- `src/components/The/Topbar.vue` — mobile hamburger, page title slot, user menu
- `src/components/The/ThemeToggle.vue` — cycles light/dark/system
- `src/layouts/AuthLayout.vue` — centered card layout for login
- Update MainLayout.vue imports (currently references missing components)
- Nav items: Dashboard, Customers, Sales, Deliveries, Bookings, Products, Areas, Employees, Maintenance, Vehicles, Expenses, Settings

**T3: Supabase schema — Phase 1 migration**
- Create all tables from §4 above in one migration: `supabase migration new wrs_phase1_schema`
- Enums first, then tables in dependency order
- Enable RLS on every table
- Create RLS policies for `admin` role: full CRUD on own tenant
- Create all indexes from §4
- Seed: one tenant, one branch, one admin user (for dev)

**T4: Auth module**
- `src/stores/auth.ts` — session + profile reactive state
- `src/services/auth.ts` — signIn(email, password), signOut, getProfile
- `src/pages/login.vue` — email/password form using BaseInput + BaseButton
- Router guard in `src/router.ts` — protect all routes except /login
- `src/layouts/AuthLayout.vue` — used by login page

### Group 2 — Reference Data (can parallelize T5-T8 after T3+T4)

**T5: Settings module**
- `src/services/settings.ts` — get(key), set(key, value), getAll
- `src/stores/tenant.ts` — caches settings after first load; exposes typed getters
- `src/pages/settings/index.vue` — structured form with all 5 configurable thresholds
- Display: staleness thresholds (days), booking horizon (days), default quota (jugs), commission rate (₱/jug)

**T6: Products & Container Types**
- `src/services/products.ts` — CRUD for products + container_types + product_pricing
- `src/components/Product/` — ProductList, ProductForm, ContainerTypeList, ContainerTypeForm, PricingTable
- `src/pages/products/index.vue` — two tabs: Products | Container Types, with pricing matrix per product×type

**T7: Areas & Riders**
- `src/services/areas.ts` — CRUD areas, coverage records; `getActiveRiderForArea(areaId, date)`
- `src/components/Area/` — AreaList, AreaForm, CoverageForm, RiderBadge
- `src/pages/areas/index.vue` — areas list, primary rider assignment, active coverage display

**T8: Employees (rider + admin records)**
- `src/services/employees.ts` — CRUD employees, attendance, salary records
- `src/composables/usePayroll.ts` — countWorkdays, dailyRate, computeIncome(employeeId, start, end)
- `src/components/Employee/` — EmployeeList, EmployeeForm, AttendanceToggle, IncomeBreakdown, SalaryRecordForm
- `src/pages/employees/index.vue` — employee list with role badges
- `src/pages/employees/[id].vue` — profile, attendance calendar (current month), income panels (today/week/month), salary record history + create

### Group 3 — Customers (after T3+T4, parallel with T5–T8)

**T9: Customers module**
- `src/services/customers.ts` — CRUD customers + addresses + price overrides; `getContainerBalance(customerId)`, `getARBalance(customerId)`, `getLastOrderDate(customerId)`
- `src/composables/useCustomerStaleness.ts` — derives staleness chip from settings thresholds
- `src/components/Customer/` — CustomerList, CustomerForm, AddressForm (with lat/lng map pin via iframe or basic coordinate input), PriceOverrideTable, CustomerSummaryCard
- `src/pages/customers/index.vue` — searchable list with staleness chip, AR balance, container balance
- `src/pages/customers/[id].vue` — full profile, addresses, price overrides, sales history, container balance

### Group 4 — Sales & Operations (after T3+T4+T9, parallelize T10+T11)

**T10: Walk-in Sales (POS)**
- `src/services/sales.ts` — createSale, voidSale, getSale, listSales; price resolution logic (override → base)
- `src/composables/usePriceResolver.ts` — resolves unit price given customer + product + container type
- `src/components/Sale/` — SaleForm (line item builder + payment), SaleStatusBadge, SaleList
- `src/pages/sales/index.vue` — sales list with source/status filters
- Walk-in flow: customer autocomplete (optional), item lines, payment method, submit

**T11: Deliveries**
- Reuses `src/services/sales.ts` for delivery sales (source = 'delivery')
- `src/components/Delivery/` — DeliveryCard, DeliveryForm, ReconcileForm (mark delivered, cash collected, containers returned)
- `src/pages/deliveries/index.vue` — "Today's Board": list of pending_delivery sales for today, grouped by rider; reconcile action per card
- Container `in` movements created on reconcile

**T12: Bookings**
- `src/services/bookings.ts` — CRUD bookings + templates; `materializeTemplates(fromDate, toDate)`; `fulfillBooking(bookingId)` → creates delivery sale
- `src/components/Booking/` — BookingList, BookingForm, TemplateList, TemplateForm, BookingStatusBadge
- `src/pages/bookings/index.vue` — tabs: Upcoming Bookings | Templates
- Materialization: edge function or cron; for Phase 1 a manual "Generate upcoming" button is acceptable

### Group 5 — Maintenance (parallelize T13+T14 after T3)

**T13: Vehicles**
- `src/services/vehicles.ts` — CRUD vehicles
- `src/components/Vehicle/` — VehicleList, VehicleForm
- `src/pages/vehicles/index.vue` — list with upcoming/overdue PM badge count

**T14: Maintenance Tasks + Logs**
- `src/services/maintenance.ts` — CRUD tasks + logs; `computeNextDue(task, logDate)`; `getDueTasks(scope, withinDays)`
- `src/components/Maintenance/` — TaskList, TaskForm, LogForm, DueWidget
- `src/pages/maintenance/index.vue` — tabs: Water Plant | Vehicles. Due-now + Due-in-7-days widgets per scope. Full task list per scope.
- After each log: recompute `next_due_at` on the task

### Group 6 — Expenses (parallel with Group 5)

**T15: Operational Expenses**
- `src/services/expenses.ts` — CRUD expenses; summary by category/payee/date-range
- `src/components/Expense/` — ExpenseList, ExpenseForm
- `src/pages/expenses/index.vue` — date-range filter, category breakdown (chart), total, list

### Group 7 — Dashboard (after all modules)

**T16: Dashboard**
- `src/pages/dashboard.vue`
- Widgets (all use existing services, no new queries needed):
  - Today's sales total (walk-in + completed deliveries)
  - Pending deliveries count (link to deliveries board)
  - Upcoming bookings (next 3 days)
  - Maintenance due now / due this week
  - Low-stock alert (out-of-scope for MVP — skip)
  - Quick actions: New Walk-in Sale, New Delivery, Record Expense

---

## 9. Execution Order Summary

```
T0 (fix tsc, align dirs)
  → T1 (Base components)
  → T2 (App shell)
    → T3 (Schema migration)
      → T4 (Auth)
        ┌─ T5 (Settings)
        ├─ T6 (Products)
        ├─ T7 (Areas)
        ├─ T8 (Employees)   ← all parallel
        └─ T9 (Customers)
          → T10 (Walk-in Sales)
          → T11 (Deliveries)
          → T12 (Bookings)
          → T13 (Vehicles)
          → T14 (Maintenance)
          → T15 (Expenses)
            → T16 (Dashboard)
```

Tasks T5–T9 parallelizable. Tasks T10–T15 parallelizable after T9.

---

## 10. Rules for All Implementer Agents

1. No `any`, no type casts (`as X`), no non-null assertions (`!`).
2. No explicit imports for symbols in `auto-imports.d.ts` or `components.d.ts`.
3. All money as centavos. Never store floats. Use `formatMoney()` helper for display.
4. All timestamps stored UTC. Format to Asia/Manila for display using `date.ts` helper.
5. No hard deletes. Always set `deleted_at` + `deleted_by`.
6. No raw hex values in Vue files — use CSS token names via Tailwind utilities.
7. Components: `<script setup lang="ts">` only. No Options API.
8. Composables: `use` prefix, return typed reactive refs.
9. Services: return `{ data, error }` tuples mirroring Supabase client pattern.
10. After every task: `npx tsc --noEmit` must pass clean.
11. Do not commit. Leave commits to the human.
