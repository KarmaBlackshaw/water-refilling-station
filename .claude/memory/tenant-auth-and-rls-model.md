---
name: tenant-auth-and-rls-model
description: Tenant access needs TWO sources in sync — public.users profile (frontend) + JWT app_metadata.tenant_id (RLS); missing either silently no-ops all tenant-scoped reads/writes.
metadata:
  type: project
---

Tenant-scoped data depends on two independent sources that must agree:

1. **Frontend** — `auth.tenantId` / `auth.branchId` (auth store) are computed from the `public.users` profile row (`profile.tenant_id ?? ''`, `profile.branch_id ?? ''`). No profile row → both are `''`.
2. **RLS** — every tenant table (`customers`, `sales`, `customer_addresses`, `products`, `streets`, …) uses the same policy: `FOR ALL USING (tenant_id = ((auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid))` with **no `WITH CHECK`** (so `USING` also governs INSERT). This reads `tenant_id` from the **JWT app_metadata**, NOT from the profile.

A logged-in auth user that lacks a `public.users` profile and/or `app_metadata.tenant_id` will **silently no-op** every tenant-scoped feature: service functions early-return on empty `auth.tenantId`/`branchId`, and Supabase `error` is typically discarded (`const { data } = await …`), so there's no toast/console feedback — it just looks like "the button does nothing."

**Why:** the profile drives the frontend; the JWT drives RLS. They're seeded together but read independently, so a half-seeded user breaks everything quietly.

**How to apply:**
- Bootstrap a tenant with [scripts/onboard-admin.mjs](../../scripts/onboard-admin.mjs) — it creates tenant → branch → auth user **with `app_metadata.{tenant_id,branch_id,role}`** → `public.users` profile → default settings (via `insert_default_settings` RPC). This is the canonical full chain.
- When a tenant write "does nothing," first check the logged-in user has both a profile row AND `app_metadata.tenant_id` before suspecting the component/service.
- New tenant tables should follow the same `FOR ALL USING (… app_metadata tenant_id …)` policy. Related: [[address-location-model]].
