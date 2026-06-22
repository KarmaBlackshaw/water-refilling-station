# Address location is denormalized PSGC strings — no city/barangay tables

`customer_addresses` stores `city`, `barangay`, `street` as **plain text**, not FKs.
There are **no `cities` or `barangays` tables**. City/barangay options come from a
local bundle `src/data/psgc-barangays.json` (PSGC), loaded in
`AddressFieldCascade.vue`.

- City is stored as the **pretty label** (e.g. `"Batac City"`, `"Laoag"`) produced by
  `prettyCity()` from the normalized PSGC key (`"city of batac"` / `"laoag"`), NOT the raw key.
- The `streets` table (added 2026-06) is the only DB-backed level. It is **global reference
  data — NOT tenant/branch scoped** (street names are general). Keyed by the same denormalized
  strings: `(city, barangay, name)`, soft-delete, RLS `authenticated_all` (any authed user reads
  + extends). Unique street name per location (case-insensitive).
- Street dropdown = that barangay's saved `streets` rows; `BaseSelect` `creatable` lets an
  admin/rider add a missing street on the fly (`createStreet`, captures current map-pin coords).

**Why:** Easy to assume there's a normalized geo hierarchy with ids. There isn't — any new
query/join on location must match on the **stored pretty city label + barangay name strings**,
or rows won't line up between `streets` and `customer_addresses`.

**How to apply:** When filtering/saving streets or addresses, pass `cityLabel` (pretty) +
barangay name, never a PSGC key or an id. `streets` is global; `customer_addresses` stays
tenant/branch-scoped. New address-geo features should follow the same string-keyed pattern
unless you first introduce real lookup tables.
