---
name: area-rider-model
description: Area = named delivery zone owning a rider; active rider = coverage record overrides primary_rider_id, date-windowed.
metadata:
  type: project
---

`areas` is a named delivery zone, not a rider-owned entity. The zone owns the rider, never the reverse.

- `areas.name` is the only human-readable handle (everything else is UUID/FK); used for customer-area dropdowns, search, and `order('name')` in `listAreas`. Customers reference the zone via `customers.area_id`.
- Rider assignment lives on the area: `primary_rider_id` (default rider) + `area_coverage_records` (temporary covering riders, with `starts_on` / nullable `ends_on` date window).
- **Active rider resolution** (`getActiveRiderForArea(areaId, date)` in [areas.ts](../../src/services/areas.ts)): an active coverage record (`starts_on <= date AND (ends_on IS NULL OR ends_on >= date)`) wins and returns `isCovering: true`; otherwise falls back to `primary_rider_id` with `isCovering: false`.
- Riders = `users` rows with `role = 'rider'` (`listRiders`), scoped by tenant+branch.

**Why:** "rider area" is loose talk — there is no rider→area ownership in the schema. One named zone has many customers and a rotating set of covering riders over a primary.

**How to apply:** To find who delivers to a customer on a date, resolve the customer's `area_id` then call `getActiveRiderForArea` — do not read `primary_rider_id` directly (misses active coverage). Relates to [[tenant-auth-and-rls-model]].
