# Separate paid **leave** from unpaid **absent**

**Date:** 2026-07-01
**Status:** Approved (design), pending spec review → implementation plan

## Problem

Employee attendance has only two states: `present` and `absent`. Absence always means
"no pay for that day". There is no way to record **paid time off** (leave). The business
needs leave (paid, capped per year) as a first-class state, distinct from absence (unpaid).

The mark-absent UI currently lives on the **Riders** page, but attendance and payroll apply
to **all employees**, not just riders.

## Decisions (locked)

| # | Decision |
|---|----------|
| 1 | Add a third attendance status `leave`. Two separate UI actions/modals: **Mark absent** and **Mark on leave**. |
| 2 | A rider on leave is **unavailable** for delivery — coverage routes to the backup rider, identical to absent. Only the status badge differs. |
| 3 | Leave is **paid and tracked separately**, but capped by a per-employee **annual leave allowance**. Leave days **beyond** the allowance become **unpaid** (treated like absent for payroll). |
| 4 | The allowance is a **global tenant setting** (`annual_leave_days`), configured on the Settings page. Default **5** (PH service-incentive-leave). |
| 5 | The attendance actions live on the **Employees** area — **both** the list row menu **and** the employee detail page (which also shows the leave balance). |
| 6 | The Riders page **loses its row menu entirely** and becomes a pure coverage view (it still *reads* attendance for the status badge). |
| 7 | Rest-days editing stays in the existing **Employee edit form**. The standalone `RiderRestDaysModal` is **removed**. |

## Design principle

The attendance row stores only the raw status (`present` / `absent` / `leave`). Whether a
given leave day is **paid or unpaid is derived at payroll time** from the annual allowance and
the chronological order of leave days that year. This keeps a single source of truth and makes
backfilled/edited leave recompute correctly with no stored-state drift.

---

## 1. Data model

### Migration
`supabase/migrations/<timestamp>_attendance_status_add_leave.sql`:

```sql
alter type attendance_status add value 'leave';
```

`ALTER TYPE ... ADD VALUE` cannot run inside a txn that then *uses* the value; this migration
only adds it (no rows reference it yet), so it is safe as a standalone migration.

After applying, **regenerate** `src/types/database/supabase.ts` (Supabase MCP
`generate_typescript_types`). The `attendance_status` union becomes
`'present' | 'absent' | 'leave'` and the `Constants` array gains `'leave'`.

### Setting key
`src/types/database/common.ts` — add `'annual_leave_days'` to the `SettingKey` union.

`src/stores/tenant.ts` — new getter:
```ts
const annualLeaveDays = computed(() => getSettingInt('annual_leave_days', 5));
```
(export it in the store return).

`src/pages/settings/index.vue` — add a `BaseInput` (`type="number"`) bound to a new
`form.annual_leave_days`, seeded from `tenant.annualLeaveDays` in `onMounted`, persisted in
`saveAll` via `tenant.saveSetting('annual_leave_days', form.annual_leave_days)`.

---

## 2. Coverage — `src/helpers/riderCoverage.ts`

`leave` is unavailable, routed exactly like `absent`.

- `RiderDayStatus` → add `'leave'`: `'working' | 'rest' | 'absent' | 'leave'`.
- `isRiderAbsent` — treat leave as unavailable in **both** branches:
  - no schedule: `status === 'absent' || status === 'leave'`
  - with schedule: `isRestDay(...) || status === 'absent' || status === 'leave'`
  - `resolveRider` calls `isRiderAbsent`, so leave → backup routing comes for free.
- `riderStatus` — check leave **before** absent: `if (status === 'leave') return 'leave';`
- Riders page `toStatusInfo` — add a `leave` case → `{ label: 'On leave', variant: 'info' }`.
  `absent` stays `danger`, `rest` stays `warning`, `working` stays `success`.

---

## 3. Payroll — `src/services/payroll.ts`

Annual cap, chronological, **excess leave unpaid**.

### Signature
```ts
computeIncome(
  employee,
  periodStart,
  periodEnd,
  attendanceRecords,
  dailyCommissions,
  opts: { annualLeaveDays: number; priorLeaveUsed: number },
): IncomeBreakdown
```
- `annualLeaveDays` — the tenant allowance.
- `priorLeaveUsed` — leave days already taken that calendar year **before** `periodStart`.

### Algorithm
Iterate the period's workdays **in chronological order** (`getWorkdays` already returns them
sorted). For each workday, read status from the attendance map:
- `present` → `workdaysPresent++`
- `leave`   → if `priorLeaveUsed + paidLeaveDays < annualLeaveDays` then `paidLeaveDays++`
  else `unpaidLeaveDays++`
- `absent` / none → unpaid, contributes nothing to base pay
- accumulate `commissionCentavos` regardless (unchanged)

```
basePayCentavos = dailyRate × (workdaysPresent + paidLeaveDays)
grossCentavos   = basePayCentavos + commissionCentavos
```

### `IncomeBreakdown` gains
`paidLeaveDays: number`, `unpaidLeaveDays: number`. Existing fields unchanged.

The daily-rate denominator (`countWorkdays` over the month) is **unchanged** — leave days are
workdays, so a fully-paid-leave month still nets ~full salary; only unpaid leave/absent reduce pay.

---

## 4. Services — `src/services/employees.ts`

Two additions to keep the two pages DRY:

```ts
// Bulk upsert one status across a date list (shared by list + detail attendance actions).
export function upsertAttendanceRange(params: {
  tenant_id: string; branch_id: string; employee_id: string;
  dates: string[]; status: AttendanceStatus;
}) { /* Promise.all of upsertAttendance over dates */ }

// Year-to-date leave rows for balance + priorLeaveUsed (status = 'leave').
export function listLeaveForYear(employeeId: string, year: number) {
  // select attendance_date where status = 'leave' and date within [year-01-01, year-12-31]
}
```

Callers build the date list with the existing **`getWorkdays(start, end, restDays)`** helper
(`src/helpers/workday.ts`) — this replaces the hand-rolled while-loop currently in the riders
page and skips rest days automatically.

`priorLeaveUsed` for a period = count of `listLeaveForYear` rows with `attendance_date < periodStart`.
`balance = annualLeaveDays − totalLeaveRowsThisYear`.

---

## 5. UI — two modals under `src/components/Employee/`

Both modals are **presentational**: they own their `form` + open-`watch` reseed, and
`emit('submit', { starts_on, ends_on })`. Pages run the `useAsync` upsert + reload and pass
`:saving` back down. (Convention: no inline modals in pages; modals do not fetch/persist.)

### `AbsenceModal.vue` (moved from `Rider/AbsenceModal.vue`)
- Generalize the `RiderEmployee` type → `EmployeeLike = { id: string; full_name: string; rest_days: number[] }`.
- `defineOptions({ name: 'EmployeeAbsenceModal' })`. Delete the old `Rider/AbsenceModal.vue`.
- Absent-only. Copy text stays "counts against attendance / no pay".

### `LeaveModal.vue` (new)
- Same date-range fields (`starts_on`, `ends_on`) via `BaseDatePicker`.
- Props include the leave **balance** (`allowance`, `used`, `remaining`) so it can render:
  - a small balance line ("3 of 5 days used · 2 remaining"), and
  - an inline **warning** (not a block) when the selected range would exceed `remaining`
    — copy: excess days are recorded but unpaid.
- `defineOptions({ name: 'EmployeeLeaveModal' })`. Emits `submit` like AbsenceModal.

### `src/pages/employees/index.vue`
- Row menu gains **Mark absent** and **Mark on leave** (icons: `IconCalendar` + a leave glyph;
  add `IconXxx` under `Icon/` if needed — no inline SVG).
- Inline modal state + `useAsync` submit handlers (build dates via `getWorkdays`, call
  `upsertAttendanceRange`, reload). Reuse the existing "override present days" confirm from the
  riders page for the absent path.
- Render `<EmployeeAbsenceModal>` + `<EmployeeLeaveModal>`.

### `src/pages/employees/[id].vue`
- Add both actions in the header (next to the present/absent quick-toggle).
- Add a **leave-balance card**: allowance / used YTD / remaining (from `listLeaveForYear`).
- Extend the page load to also fetch `listLeaveForYear(id, currentYear())`.
- Wire `computeIncome(..., { annualLeaveDays, priorLeaveUsed })` per period; compute
  `priorLeaveUsed` from the year leave rows relative to each period start. Breakdown cards
  surface present vs paid-leave day counts.
- The existing present↔absent toggle stays; when today is `leave`, disable/relabel it so a
  quick toggle doesn't silently clobber a leave day (minor).

---

## 6. Riders page cleanup — `src/pages/riders/index.vue`

Remove the whole row-menu surface and its write path:
- delete `rowMenu`, `openRestDays`, `openAbsence`, `saveRestDays`, `saveAbsence`, the
  rest-days + absence modal `ref`s/usages, and the confirm import if now unused;
- drop now-unused imports (`updateEmployee`, `upsertAttendance`, `getAttendance`, `dayjs` if
  unused, `IconEdit`, `IconCalendar`, `RiderRestDaysModal`, `RiderAbsenceModal`);
- keep `toStatusInfo` (now leave-aware) — the page still **reads** attendance for the badge.
- Remove the `#cell-actions` column / template.

Delete `src/components/Rider/RestDaysModal.vue` (rest days edited via the Employee form; no
other consumers). Delete `src/components/Rider/AbsenceModal.vue` (moved to Employee domain).

---

## Files touched (summary)

1. `supabase/migrations/<ts>_attendance_status_add_leave.sql` — new
2. `src/types/database/supabase.ts` — regenerated (enum + Constants)
3. `src/types/database/common.ts` — `SettingKey` += `annual_leave_days`
4. `src/stores/tenant.ts` — `annualLeaveDays` getter
5. `src/pages/settings/index.vue` — allowance input
6. `src/helpers/riderCoverage.ts` — leave-aware status + availability
7. `src/services/payroll.ts` — annual-cap paid/unpaid split; breakdown fields
8. `src/services/employees.ts` — `upsertAttendanceRange`, `listLeaveForYear`
9. `src/components/Employee/AbsenceModal.vue` — moved + generalized
10. `src/components/Employee/LeaveModal.vue` — new (balance + over-cap warning)
11. `src/pages/employees/index.vue` — row-menu actions + modals + handlers
12. `src/pages/employees/[id].vue` — actions + balance card + payroll wiring
13. `src/pages/riders/index.vue` — remove menu/write path; keep read-only badge
14. `src/components/Rider/AbsenceModal.vue` — deleted
15. `src/components/Rider/RestDaysModal.vue` — deleted

## Out of scope / non-goals

- No leave *approval workflow* (request → approve). Marking leave is a direct manager action.
- No per-employee allowance overrides — allowance is a single tenant setting.
- No pro-rating the allowance for mid-year hires.
- Leave year = calendar year (Jan–Dec).

## Testing focus

- `computeIncome`: leave under cap (paid), leave over cap (excess unpaid), leave spanning the
  cap boundary within one period, `priorLeaveUsed` pushing the whole period unpaid, absent still
  unpaid, present unchanged.
- `riderCoverage`: leave routes to backup; `riderStatus` returns `leave`; rest-day precedence.
- Range builder skips rest days; override-present confirm fires for absent over present days.
