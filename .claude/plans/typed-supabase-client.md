# Typed Supabase Client Migration

Eliminate latent type errors (44 surfaced by `vue-tsc -b --force`) by typing the Supabase client with a generated `Database<T>` schema. After this, `.overrideTypes<T, { merge: false }>()` calls become unnecessary at most call sites — Supabase will infer row + join shape directly from the select string.

## Why

`src/helpers/supabase.ts` currently calls `createClient(url, key)` with no generic. Every `.from('x').select(...)` resolves to `Result = any`. Conditional type machinery in `@supabase/postgrest-js` distributes over `any` and produces the sentinel `{ Error: "Type mismatch: Cannot cast array result..." }` in unions — both `.returns<T>()` (deprecated) and `.overrideTypes<T, { merge: false }>()` exhibit it. Workaround attempts to coerce single-row results then fail compile time when the consumer accesses a field on the sentinel branch.

Typing the client at the source removes the `any`, removes the sentinel, removes the need for per-call overrides, and unlocks proper IDE inference (autocomplete on `select('...')` strings, return-type narrowing on joins, etc).

## Pre-requisites

- macOS with Homebrew available.
- Access to the Supabase project (ref `xkenumdbtksqorvgbbfr`) — confirm via `supabase login` (browser SSO).
- Optional: the Supabase database password if the link step prompts for it (saved to `.git`-ignored `supabase/.temp/` after first link).

## Steps

### 1. Install + authenticate Supabase CLI

```sh
brew install supabase/tap/supabase
supabase --version            # confirm install
supabase login                # opens browser; paste verification code back into terminal
```

### 2. Link the local repo to the remote project

```sh
supabase link --project-ref xkenumdbtksqorvgbbfr
```

If prompted for a database password, supply it once — CLI caches it under `supabase/.temp/`.

Verify with `supabase projects list` (current project should be marked linked).

### 3. Generate the Database type

```sh
supabase gen types typescript --linked --schema public > src/types/database/supabase.ts
```

Sanity-check the file: should export `type Database = { public: { Tables: { ... }, Views: { ... }, Functions: { ... }, Enums: { ... } } }` and use `Json` helper type.

### 4. Wire the generic into `createClient`

Edit [src/helpers/supabase.ts](src/helpers/supabase.ts):

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
```

### 5. Reconcile local interfaces with generated row types

The hand-rolled interfaces in `src/types/database/{customer,product,sale,...}.ts` are likely 1:1 with generated rows but may drift (nullability, defaults, JSON columns). Two viable paths:

**Option A (recommended):** keep the hand-rolled interfaces as the public type surface (callers import `Customer`, `Sale`, etc unchanged), but make them aliases of the generated row:

```ts
// src/types/database/customer.ts
import type { Database } from './supabase';

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
```

This collapses local + generated definitions, keeps existing imports working, and gives `Insert`/`Update` variants for free.

**Option B:** delete local interfaces, replace imports across the codebase with `Database['public']['Tables']['x']['Row']` directly. More changes; loses the short import name.

Pick A — minimal churn.

Repeat across every file in `src/types/database/` (`area.ts`, `booking.ts`, `container.ts`, `customer.ts`, `employee.ts`, `expense.ts`, `maintenance.ts`, `product.ts`, `sale.ts`, `vehicle.ts`). Drop `common.ts` if it only re-exports.

Keep enum literal types (`ExpenseCategory`, `MaintenanceScope`, etc) — alias them to `Database['public']['Enums']['xxx']` if generated as enums, otherwise keep manual.

### 6. Strip `.overrideTypes<T, { merge: false }>()` where now-redundant

With the typed client, `.from('sales').select('*, customer:customers(name)').single()` resolves to `Sale & { customer: { name: string } | null }` automatically. Most overrides become noise.

Audit all 31 sites:

```sh
grep -rn "\.overrideTypes<" src/services
```

For each, remove `.overrideTypes<X, { merge: false }>()` and rerun `vue-tsc -b --force`. Keep overrides only where the generated type genuinely doesn't match (rare — usually a recursive view or a synthesized column).

Likely all 31 can go.

### 7. Verify

```sh
rm -rf node_modules/.tmp/tsconfig.app.tsbuildinfo
npx vue-tsc -b --force         # expect 0 errors
npx eslint src                  # expect 0 errors
npm run dev                     # smoke-test in browser
```

The 44 latent errors should drop to 0.

### 8. Commit

```sh
git add src/helpers/supabase.ts src/types/database/ src/services/
git commit -m "Type Supabase client with generated Database schema"
```

## Follow-up (separate PR)

- Add `npm run db:types` script wrapping `supabase gen types typescript --linked > src/types/database/supabase.ts` so refreshing after migrations is one command.
- Add a CI step that fails if `db:types` produces a diff against committed file (catches missed regen).
- Switch `vue-tsc --noEmit` in the build script to `vue-tsc -b --force` so latent errors surface in CI, not only on clean builds.

## Risks

- **Generated row types may use `string | null` where local interfaces use `string`** — surface as new errors at call sites that didn't account for null. Fix at the consumer (add `?? ''` or guard), not by patching the generated file.
- **Enum mismatches** — if generated enums are `string` (not literal unions), tighten via `Database['public']['Enums']`.
- **Service Insert/Update payloads** — generated `Insert` type may require fields the codebase currently omits (with DB defaults). Cast to `Database['public']['Tables']['x']['Insert']` only when defaults are truly server-side; otherwise add the field.

## Rollback

If type drift causes too many call-site fixes, revert just step 4 (drop `<Database>` from `createClient`) and keep the generated file for incremental adoption later. The hand-rolled aliases from step 5 stay safe (they're identical type aliases).
