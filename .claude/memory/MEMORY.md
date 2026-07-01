# Repo Memory

> Conventions and facts specific to water-refilling-station.
> Injected by `.claude/hooks/recall-memory.sh` at SessionStart (and every prompt once the UserPromptSubmit hook is enabled). Saved by `.claude/hooks/save-memory.sh` (Stop).
> Per-fact `.md` files live in this folder; read a linked file when its fact is relevant.

- [Address location model](address-location-model.md) — city/barangay are denormalized PSGC strings (no id tables); `streets` table keys on the stored pretty city label + barangay name.
- [Sale total from payments](sale-total-from-payments.md) — revenue = sum of `sale_payments.amount_centavos` (not line totals); `listCustomerSales` caps at 20 so use unbounded query for lifetime stats.
- [Tenant auth & RLS model](tenant-auth-and-rls-model.md) — tenant access needs profile row (frontend `auth.tenantId`) AND JWT `app_metadata.tenant_id` (RLS); a half-seeded user silently no-ops all tenant-scoped reads/writes.
- [BaseTable row-click](basetable-row-click.md) — `@row-click` emit; cursor-pointer auto-applied only when listener bound (via `getCurrentInstance` vnode.props).
- [BaseTable self-borders](basetable-self-borders.md) — BaseTable root always has `border-t`; stacking under a bordered row doubles the border — collapse with `-mt-px`.
- [Design tokens & card surface](design-tokens-and-card-surface.md) — Tailwind v4 `@theme` in main.css (no config); named color tokens; always reuse `BaseCard`/`BaseKpiCard` (never hand-roll card chrome); `lint:theme` bans raw `bg-white`/`bg-gray-*`/`text-dark`.
- [BaseFullPageTabs wizard](basefullpagetabs-wizard.md) — stepped-wizard shell; `FullPageTab` carries `title`/`subtitle`/`canNavigateTo`; render `BaseFullPageTabsHeader` from `activeTab`, never hardcode step headers.
- [v-model object needs ref](vmodel-object-needs-ref.md) — `v-model` to a child that replaces the whole object must be a `ref`, not `const reactive` (reassign no-ops); bit the customer-create Review tab.
- [BaseModal overlay structure](basemodal-overlay-structure.md) — z-40 backdrop is visual-only; outside-click close lives on the z-50 dialog container via `@click.self`, gated by `closable`.
- [Rider coverage model](rider-coverage-model.md) — no `areas` table; customer holds `rider_id` + `backup_rider_id` (DB CHECK backup≠primary); absence reuses the employee system (`employees.rest_days` + `employee_attendance`, via `employees.user_id`) routing primary→backup→manual through pure `resolveRider` (replaces `getActiveRiderForArea`); "covered area" = customers grouped by default-address barangay.
- [BadgeVariant shared type](badge-variant-shared-type.md) — badge variant union lives once in `@/types` (`src/types/badge.ts`); annotate helpers `: BadgeVariant`, never re-list literals AND never drop the annotation (TS widens literal returns to `string`, breaks `BaseBadge :variant`).
- [URL-driven list filters](url-driven-list-filters.md) — list search/filters live in the URL (`useRouteQueryStrings`) + server-queried via `useAsync` `watch` (debounced); binding vs fetching stay separate; services take optional `filters`; joined-name search needs `!inner` but NOT unconditionally on nullable FKs (`sales.customer_id` — walk-ins). Ref: deliveries page.
