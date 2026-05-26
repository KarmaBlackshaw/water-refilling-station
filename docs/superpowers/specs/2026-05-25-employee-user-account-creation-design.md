# Employee User Account Creation

**Date:** 2026-05-25
**Status:** Approved

## Problem

Employees with roles `rider`, `cashier`, `manager`, and `admin` need Supabase auth accounts so they can log in and so their IDs can be used as FK targets (e.g. `rider_id` on bookings/areas). Helpers do not need accounts. Currently, there is no way to create these accounts from within the app — admins must manually insert rows in Supabase Studio.

## Goals

- When creating/editing an employee whose role needs an account, the form collects a **username** and **password** and auto-creates the auth + `users` row.
- Helpers get no account fields.
- If an employee's role is upgraded from `helper` to an account-needing role, the form prompts for username + password on save.

## Roles That Need Accounts

All four `user_role` enum values: `rider`, `cashier`, `manager`, `admin`. The `employees.role` column uses the same enum, so every employee needs an account.

## Data Model

Two separate tables:
- `employees` — HR/payroll data for all staff including helpers. No auth requirement.
- `users` — App user accounts. `id` is an FK to `auth.users(id)`. Only exists for account-needing roles.

Every employee should have a corresponding `users` row. The `employees` table already has a `user_id uuid REFERENCES users(id)` column — this is populated after the `users` row is created.

## Login Identifier Convention

Riders (and other staff) often have no email. The login email is synthetic:

```
{username}@{tenantId}.internal
```

- `username` is chosen by the admin — short, simple (e.g. `juan`, `dela_cruz`)
- The rider logs in with username + password; they never see the email format
- Uniqueness is enforced by Supabase auth at the `email` level per tenant

## Architecture

### New: Service Role Supabase Client

`auth.admin.createUser` requires the **service role key**, not the anon key. A second Supabase client is created using `VITE_SUPABASE_SERVICE_KEY`:

```ts
// src/helpers/supabaseAdmin.ts
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);
```

> **Security note:** `VITE_SUPABASE_SERVICE_KEY` is exposed to the browser. This is acceptable for a single-tenant admin app where only authenticated admins reach the employee management UI. If multi-tenant public exposure is a concern in future, move account creation to a Supabase Edge Function.

### New: `src/services/users.ts`

```ts
createUserAccount({ username, password, tenantId, branchId, fullName, role }): Promise<string>
```

Steps:
1. Calls `supabaseAdmin.auth.admin.createUser({ email: '{username}@{tenantId}.internal', password, email_confirm: true })`
2. On success, inserts into `users`: `{ id: authUser.id, tenant_id, branch_id, full_name, role }`
3. Returns the new `users.id`

```ts
hasUserAccount(employeeId: string): Promise<boolean>
```

Checks if `employees.user_id` is non-null for this employee.

### Modified: `EmployeeFormModal.vue`

Adds a conditional **Account** section below the Role field:

**Show when:**
- New employee (always — all roles need accounts)
- Edit employee AND `hasUserAccount()` returns false (no account yet)

**Fields:**
- `username` (text, required) — admin sets a short login handle
- `password` (password, required, min 8 chars) — admin sets initial password

**Hide when:**
- Edit employee who already has an account (`employees.user_id` is non-null)

The modal emits a new optional `account` field in its submit payload:

```ts
account?: { username: string; password: string }
```

### Modified: `employees/index.vue` `save()` handler

If `payload.account` is present:
1. Call `createUserAccount(...)` — creates auth + `users` row, returns `userId`
2. If that fails, surface error and abort (do not create the employee row)
3. On success, pass `user_id: userId` into `createEmployee` payload (or call `updateEmployee` to set `user_id` on existing employee)

Error handling: if `createUserAccount` succeeds but `createEmployee` fails, the auth account is orphaned. Acceptable for now — log the auth UID so it can be manually linked.

## UX Details

- Account section has a subtle heading: **"App account"** with helper text: "Sets up login credentials for this employee."
- On edit, if account already exists: show a read-only chip "Account exists" with no editable fields. Password reset is out of scope for this spec.
- Username validation: alphanumeric + underscore + dot only, 3–30 chars. Validated client-side before submit.
- If `createUserAccount` returns a duplicate email error (username taken within tenant): show inline error "Username already taken — choose another."

## Out of Scope

- Password reset / change flow
- Backfilling `user_id` on existing employees who already have a `users` row (separate migration)
- Moving account creation to an Edge Function (future hardening)
- Username change after account creation
