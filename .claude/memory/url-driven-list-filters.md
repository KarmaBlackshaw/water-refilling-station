# List-page search/filters are URL-driven + server-queried

Every list page drives search and all filters from the URL query and re-queries
Supabase (debounced) — not local `ref('')` + client-side `.filter()`. Two composables,
kept **separate on purpose** (binding vs fetching — do not recombine them):

- **Binding:** `useRouteQueryStrings({ q: '', status: '', date: today() })` →
  `src/composables/useRouteQueryStrings.ts`. Each declared key becomes a `Ref<string>`
  bound to that URL query param (write mode `replace`, no history spam). You must declare
  every key you destructure — `noUncheckedIndexedAccess` is on, so a `Record` return would
  type each key `Ref<string> | undefined`. Binding only; it never fetches.
- **Fetching stays in the page:** `useAsync(() => listXxx(..., { search: search.value || undefined }),
  { immediate: true, defaultValue: [], disableResetValue: true, watch: [search, ...] })`.
  `useAsync`'s `watch` debounces 300ms → that IS the search debounce. `run` (alias `reload`)
  refetches after create/edit/delete.
- **Services** take an OPTIONAL trailing `filters?: { search?; status?; ... }` (additive, so
  other callers still compile) and filter in Postgres: `.ilike('col', '%s%')`, multi-column
  `.or('a.ilike.%s%,b.ilike.%s%')`.
- **Joined-name search** (e.g. customer name via `customer:customers(name)`) needs the embed
  inner-joined to filter parent rows: `customer:customers!inner(name)` + `.ilike('customer.name', ...)`.
  ⚠️ Only inner-join when the FK is always present. `sales.customer_id` is **nullable** (walk-in
  sales), so `sales` must inner-join customer **only when a search is active** (branch two literal
  `.select()` strings) — an unconditional `!inner` drops every customerless walk-in from the list.
  `bookings.customer_id` / delivery+booking-source sales are non-null, so their inner-join is safe.
- **BaseTableFilterBar** pages (object `v-model="filterValues"`) bridge the individual refs with a
  writable `computed<FilterValues>` (get→object, set→assign each ref); string→enum via a runtime
  guard (`toSaleStatus`, `toCategory`), never `as`.

**Reference implementation:** `src/pages/deliveries/index.vue` + `src/services/deliveries.ts`.

**Why:** filters become refresh/share-safe and server-authoritative; the debounce comes free
from `useAsync`. Binding and fetching were split deliberately (a combined
`useUrlFilteredList`/`useQueryFetch` was rejected) — keep them separate.

**How to apply:** new/edited list page → destructure `useRouteQueryStrings({...})`, feed the refs
to `useAsync({ watch: [...] })`, add an optional `filters` arg to the service, filter in Postgres.
Date defaults use `@/helpers/date` (dayjs, Manila TZ), never raw `new Date()`.
