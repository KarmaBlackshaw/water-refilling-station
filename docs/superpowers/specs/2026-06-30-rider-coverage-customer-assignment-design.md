# Rider Coverage & Customer Assignment — Design

**Date:** 2026-06-30
**Status:** Approved (design dialogue), pending spec review
**Subsystem:** A of 2 (A = Rider Coverage [this doc]; B = Attendance & Payroll [separate, later])

## Problem

The `areas` table models a delivery zone as an owned entity: `areas.name` +
`primary_rider_id` + date-windowed `area_coverage_records`. Customers reference a
zone via `customers.area_id`. In reality:

- An "area" is just a barangay the station serves. `areas.name` is a redundant
  free-text label on top of the customer's real address barangay.
- A rider serves **several** barangays (and expands over time).
- A **dense** barangay needs **more than one** rider — so "barangay → one primary
  rider" does not hold.
- Backup-on-absence cannot be a single fixed `secondary_rider_id`; the backup can
  also be absent.

## Goal

Replace the area-owned model with a **rider-on-customer** model. The "areas" page
becomes a **riders** page: each rider with the barangays/customers they cover.
Delivery routing resolves to a **backup rider** when the primary is absent.

## Non-goals (Subsystem B — separate spec)

Daily attendance ledger, `users.monthly_salary_centavos`, attendance month-grid
page, and salary computation (`monthly_salary / days_in_month * days_present`).
**Seam:** all absence checks go through one function `isRiderAbsent(rider, date)`.
In A it reads `users.rest_days` + `rider_absences`. When B ships, that function
switches to read the attendance ledger; routing/UI code does not change.
`users.rest_days` is introduced here and reused by B.

## Data model

### Columns
- `customers.rider_id  uuid null → users(id)` — **primary** rider.
- `customers.backup_rider_id uuid null → users(id)` — **backup** rider (optional).
- **Drop** `customers.area_id`.
- `users.rest_days int[] not null default '{}'` — weekday ints `0=Sun … 6=Sat`.
  A rider off Sundays → `{0}`.

### New table `rider_absences`
Ad-hoc, one-off absences (sick / "can't deliver"). Recurring rest is `rest_days`.
```
id          uuid pk
tenant_id   uuid  → tenants
branch_id   uuid  → branches
rider_id    uuid  → users
starts_on   date  not null
ends_on     date  null            -- null = open-ended / still out
reason      text  null
created_at  timestamptz default now()
created_by  uuid  null → users
deleted_at  timestamptz null
deleted_by  uuid  null → users
```
- RLS: tenant + branch scoped (mirror `area_coverage_records` policies).
- Index `(rider_id, starts_on, ends_on)`.

### Dropped
- Table `area_coverage_records`.
- Table `areas`.

## Absence & backup rules (final)

**A rider is absent on date D** iff `weekday(D) ∈ rider.rest_days` **OR** D falls in
an active `rider_absences` window (`starts_on ≤ D AND (ends_on IS NULL OR ends_on ≥ D)`).

**`resolveRider(customer, date)`** — two-tier, no chaining:
1. primary not absent → **primary**
2. primary absent, backup set & not absent → **backup**
3. primary absent, and (no backup **or** backup absent) → **`manual`** — surfaced in
   a "Needs rider today" dispatch bucket; dispatcher picks from present riders.

**Collision handling:** when assigning a backup whose `rest_days` overlaps the
primary's, **warn but allow** (soft, not blocking). Rationale: staggered rest days
make predictable double-out rare; only coincidental same-day *ad-hoc* sick of both
hits the `manual` bucket. No secondary-of-secondary, no auto-chain.

**Validation:** `backup_rider_id ≠ rider_id`.

Worked example — Ana(rest Sun), Ben(rest Mon), customer X = primary Ana/backup Ben:
Sun → Ben · Mon → Ana · Ana sick Tue → Ben · Ana off Sun & Ben sick that Sun → manual.

## Migration & backfill (destructive — run on a Supabase branch, verify, then merge)

1. Add columns: `customers.rider_id`, `customers.backup_rider_id`,
   `users.rest_days`. Create `rider_absences` + RLS + index.
2. Backfill:
   - `customers.rider_id = areas.primary_rider_id` (join via old `customers.area_id`).
   - `customers.backup_rider_id` ← the covering rider of the customer's old area's
     **most recent active** `area_coverage_records` row, if any; else null. *(Nicety;
     null is acceptable — backups are then set via the assign tool.)*
   - `rider_absences ← area_coverage_records` as
     `(rider_id = area.primary_rider_id, starts_on, ends_on)` — i.e. "the primary was
     out during that window." Covering rider is not carried (now per-customer backup).
3. Verify counts: every customer that had an `area_id` with a non-null
   `primary_rider_id` now has a `rider_id`; absences row count matches coverage rows.
4. Drop `customers.area_id`, then tables `area_coverage_records`, `areas`.
5. Regenerate `src/types/database/supabase.ts`.

## Types
- Replace `src/types/database/area.ts` (`Area`, `AreaCoverageRecord`) with
  `src/types/database/rider.ts` exporting `RiderAbsence`. Update the barrel.
- `User` already exists (`common.ts`); a "rider" is a `users` row with `role='rider'`.

## Services — `src/services/areas.ts` → `src/services/riders.ts`
**Remove:** `listAreas`, `createArea`, `updateArea`, `softDeleteArea`,
`listCoverageRecords`, `createCoverageRecord`, `endCoverageRecord`,
`softDeleteCoverageRecord`, `getActiveRiderForArea`.

**Keep/move:** `listRiders`.

**Add:**
- `listRiderAbsences(tenantId, branchId)` — active + recent, joined rider name.
- `createRiderAbsence(data)`, `endRiderAbsence(id, endsOn)`, `softDeleteRiderAbsence(id, deletedBy)`.
- `updateRiderRestDays(riderId, restDays: number[])` — updates `users.rest_days`.
- `assignRider(customerIds: string[], riderId, backupRiderId)` — bulk update
  `customers.rider_id` + `backup_rider_id`.

**Pure resolution helpers** (operate over preloaded data — no N+1):
- `isRiderAbsent(rider: Pick<User,'rest_days'>, absences: RiderAbsence[], date: string): boolean`
- `resolveRider(customer, ridersById, absencesByRider, date): { riderId: string | null; source: 'primary'|'backup'|'manual' }`

**`src/services/customers.ts`:** in `listCustomers` / `getCustomer` /
`listAddressesForMap`, replace `area:areas(id, name[, primary_rider_id])` with
`rider:users!rider_id(id, full_name), backup_rider:users!backup_rider_id(id, full_name)`.
`createCustomer` / `updateCustomer` accept `rider_id` / `backup_rider_id` (drop `area_id`).

## UI changes

### Route & nav
- Rename folder `src/pages/areas/` → `src/pages/riders/` (file-based routing →
  route becomes `/riders` automatically).
- `src/constants/routes.ts`: `AREAS: '/areas'` → `RIDERS: '/riders'`.
- `src/constants/sidebarNav.ts`: label `Areas` → `Riders` (icon: reuse `IconAreas`
  or add `IconRiders`).
- Optional: redirect `/areas` → `/riders` (internal admin tool; low priority).

### Riders page — `src/pages/riders/index.vue` (rewrite, component-first)
Page owns: `useAsync` loads (riders, customers w/ addresses + rider/backup,
rider_absences), derived groupings, mutation handlers, modal `ref`s. Logic stays in
the page (not a bespoke composable). Children are presentational, props-down/events-up.

- Rows = riders. Each rider shows:
  - Barangays they're **primary** for (derived from their primary customers' default
    address barangay) + per-barangay count + total customer count.
  - `rest_days` chips + today's status badge (working / rest day / absent).
  - "Backup for" summary (barangays/customers where they are the backup).
- Per-rider actions: **edit rest days**, **log absence** (date-windowed).
- Global action: **Assign customers** — bulk-by-barangay: pick barangay → list its
  customers → set primary + backup → `assignRider`. Soft-warn on rest-day collision.
- **Unassigned** bucket: customers with `rider_id` null.
- Components under `src/components/Rider/`: `RiderCard.vue`, `AbsenceModal.vue`,
  `RestDaysModal.vue`, `AssignCustomersModal.vue`. **Delete** `src/components/Area/`
  (`FormModal.vue`, `CoverageModal.vue`).

### Delivery — `src/components/Delivery/NewModal.vue`
- "Area" select → "Rider" select (`listRiders`).
- Load riders + customers + `rider_absences`; pick rider + date → customers whose
  `resolveRider(c, date).riderId === selectedRider` (their present primaries + the
  customers they back up whose primary is absent). Show "Covering for {primary}"
  badge on backed-up rows.
- Surface customers resolving to `manual` for the date in a "Needs rider today"
  sub-list so the dispatcher can assign them to the selected rider.

### Deliveries page — NO CHANGE (already rider-centric)
`src/pages/deliveries/index.vue` already groups by `sale.rider_id` and shows the
rider name (Unassigned fallback); `src/services/deliveries.ts` stores/reads
`rider_id` directly; `ReconcileModal.vue` and `Dashboard/DeliveryList.vue` have no
area refs. A delivery sale records the **resolved** rider at assignment time — today
from `getActiveRiderForArea`, after this change from `resolveRider` (primary→backup).
Same column, same grouping. The only delivery-side edit is `NewModal` (above).

### Dashboard map
- `src/components/Dashboard/Map.vue`: **remove** the area filter entirely
  (`selectedAreaIds`, `areaOptions`, `toggleArea`, the "Areas" filter section,
  `listAreas` import). Rider now comes straight off `customer.rider_id` (marker
  colouring already keys on rider).
- `src/components/Dashboard/MapPopup.vue`: "Reassign area" → "Reassign rider"
  (primary, and optionally backup); rename emit `reassign-area` → `reassign-rider`;
  show primary + backup. Map wires it to `updateCustomer(id, { rider_id })`.

### Customers
- `src/pages/customers/index.vue`: table column `area` → `rider`
  (`row.rider?.full_name`); optional backup column.
- `src/components/Customer/Detail/Overview.vue`: "Area" row → "Rider" (+ backup).
- `src/pages/customers/new.vue` + `CustomerForm`: optionally add Rider + Backup
  selects on create/edit. *(Optional — creation does not set a zone today; primary
  assignment paths are the riders-page tool + map reassign.)*

## Edge cases
- Customer with no/!default address → grouped under "No barangay" for that rider.
- Customer `rider_id` null → Unassigned bucket.
- Both primary & backup absent (ad-hoc) → `manual` dispatch bucket.
- `rest_days` empty → never absent by schedule (only ad-hoc).
- Open-ended absence (`ends_on` null) → absent from `starts_on` onward until ended.

## Risks
- Destructive drop of `areas` / `area_coverage_records`. Mitigate: Supabase branch,
  verify backfill counts, then merge.
- Customers needing manual reassignment surface in the Unassigned bucket (no silent
  loss).

## Verification
- `area_id` / `listAreas` / `getActiveRiderForArea` references all removed
  (grep clean outside generated `*.d.ts`, which regenerate).
- typecheck + lint + build green.
- Smoke: riders page renders rider→barangay groupings; assign tool sets primary +
  backup; log absence reroutes that rider's customers to backups in the delivery
  modal; map filters/reassigns by rider; customers list/detail show rider.
