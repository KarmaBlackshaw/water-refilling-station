# Project Rules

Repo-scoped guidance for Claude. Loaded automatically when working in this directory.

## Conventions

### Prefer `useAsync` composable for async fetches

Use `src/composables/useAsync.ts` for any async data fetching in Vue components. Do not roll manual `ref` + `onMounted` + `watch` + try/catch boilerplate.

**Why:** `useAsync` already exposes `data`, `error`, `loading`, `run`, `debounceRun`, `reset`, plus `immediate`, `watch`, `watchRoute`, and `debounce` options. Hand-rolling duplicates the surface area and drifts from project convention.

**How to apply:**
- List/detail fetch on mount → `useAsync(fetchFn, { immediate: true })`
- Fetch depends on reactive params → `{ watch: [...], immediate: true }`
- Fetch driven by route query → `{ watchRoute: true }` or `{ watchRoute: (q) => params }`
- Search-as-you-type → `debounceRun` (default 300ms, override with `debounce`)
- Need just an error-safe wrapper → `tryToCatch` (also exported)
- Reach for raw `ref` + `onMounted` only when behavior genuinely can't fit (streaming, manual lifecycle).

### Don't reshape data inside the `useAsync` callback — use `computed`

The `useAsync` callback should pass the service response through unchanged. Extract / map / default-fallback in a separate `computed`.

**Why:** Reshaping inline (`.then((r) => r.data ?? [])` or `async () => { const { data } = await ...; return data ?? []; }`) hides the original error/metadata, conflates fetch with projection, and makes the cached `data` ref harder to type. A `computed` keeps fetch and view-shape concerns separate and reactive.

**How to apply:**
```ts
// bad
const { data: products } = useAsync<Product[]>(
  () => listProducts(...).then((r) => r.data ?? []),
  { immediate: true, defaultValue: [] },
);

// bad
const { data: products } = useAsync<Product[]>(
  async () => {
    const { data } = await listProducts(...);
    return data ?? [];
  },
  { immediate: true, defaultValue: [] },
);

// good
const { data: productsRes } = useAsync(() => listProducts(...), { immediate: true });
const products = computed(() => productsRes.value?.data ?? []);
```

- Name the raw ref `xRes` (or `xData` if the service already returns the array directly).
- Drop `defaultValue: []` when the response type isn't an array — the `computed` provides the `?? []` fallback.
- Only fetch lives inside `useAsync`. Filtering, mapping, sorting, label-building → `computed`.

### Always use `defineModel` for two-way binding

For any component with a `modelValue` prop + `update:modelValue` emit, use `defineModel<T>()` instead. Never hand-roll the prop/emit pair.

**Why:** `defineModel` (Vue 3.4+) collapses the prop, emit, and local ref into one reactive binding. Less boilerplate, no manual `$emit('update:modelValue', ...)` plumbing, fewer places to drift out of sync.

**How to apply:**
- Required v-model: `const model = defineModel<T>({ required: true })`.
- Optional v-model with default: `const model = defineModel<T>({ default: ... })`.
- Multiple v-models: `const foo = defineModel<T>('foo')`, `const bar = defineModel<U>('bar')`.
- In `<script setup>`: read/write via `model.value`.
- In `<template>`: bind with `v-model="model"` on the underlying input, or reference `model` directly (no `.value` in template) for reads and assignments (`@click="model = 'x'"`).
- Do NOT add `modelValue` to `defineProps` or `'update:modelValue'` to `defineEmits` — `defineModel` replaces both.

### Never silence unused-var lint with `_` prefix

When `@typescript-eslint/no-unused-vars` flags a binding, **remove it**, do not rename to `_name`.

**Why:** Underscore is a lint escape hatch; deleting dead bindings keeps the code matching reality.

**How to apply:**
- `const _props = defineProps<{...}>()` → keep `defineProps<{...}>()`, drop the `const _props =`. The macro call is still needed for Vue prop typing.
- `const { data: _x, loading } = useAsync(...)` → drop `data: _x` from the destructure; keep the call so the fetch side effect runs.
- `const _foo = pureFn()` with no side effect → delete the entire line.
- `import type { A, _B } from 'x'` → drop `_B` from the import.
- Only acceptable `_`-prefix: a function parameter required by an external signature you can't change. Prefer dropping trailing unused params instead.

### Supabase service functions: no useless `async`

Service files under `src/services/` return Supabase query builders directly. Don't wrap them in `async` when there's no `await` inside — `require-await` and `no-return-await` are both enabled, so the only clean form is to drop `async`. Supabase builders are thenable; callers' `await` still works.

```ts
// good
export function getEmployee(id: string) {
  return supabase.from('employees').select('*').eq('id', id).single();
}

// bad — async with no await
export async function getEmployee(id: string) {
  return supabase.from('employees').select('*').eq('id', id).single();
}
```

### Boolean props: use shorthand, not `:prop="true"`

When passing `true` to a boolean prop in a template, write the attribute name alone. Do not write `:prop="true"`.

**Why:** In Vue, attribute presence implies `true`. `:prop="true"` is noisier and inconsistent with how the rest of the codebase passes booleans.

**How to apply:**
- `<BaseInput :required="true" />` → `<BaseInput required />`
- `<BaseSelect :searchable="true" :disabled="true" />` → `<BaseSelect searchable disabled />`
- Dynamic boolean stays bound: `:disabled="!form.customer_id"` — leave as-is.
- Explicit `false` stays bound: `:open="false"` — needed since the prop default may be `true`.

### No inline SVGs — use Icon components

Never write raw `<svg>` markup in `.vue` files outside `src/components/Icon/`. Add a new `IconXxx.vue` under that folder and reference it.

**Why:** Inline SVGs duplicate viewBox/path data, prevent reuse, and bloat component templates. The `Icon` folder is auto-registered via the index-generator barrel and auto-imported, so adding one is cheap.

**How to apply:**
- Need a glyph that doesn't exist yet → create `src/components/Icon/IconWhatever.vue` following the pattern in `IconChevronRight.vue` (single `defineProps<{ size?: number }>()` + `<svg>` with `aria-hidden="true"`).
- Use `currentColor` for strokes/fills so the icon inherits text color via Tailwind classes.
- Use the icon as `<IconWhatever class="size-4 text-oslo" />` — no import needed (auto-import).
- Loading spinners → `<IconSpinner class="animate-spin" />`, never re-roll the markup.

### Prefer `ref<T>()` over `ref<T | null>(null)` for local UI sentinels

When a ref represents "no current selection" (modal editing target, delete-confirm target, transient form row), use `ref<T>()` — the initial value is `undefined`, which already means absence.

**Why:** `null` adds a second falsy sentinel with no extra meaning. `Ref<T | undefined>` is narrower, the declaration is shorter, and `x.value = undefined` reads as "clear" without inventing an extra `null` state.

**How to apply:**
- `const editingAddr = ref<CustomerAddress | null>(null)` → `const editingAddr = ref<CustomerAddress>()`.
- Clear with `x.value = undefined`, not `x.value = null`.
- Truthy check: `v-if="editingAddr"` or `:open="!!deleteAddrConfirm"`. Avoid `!== null`.
- Child component props that receive the value should be typed `T | undefined` (or optional `addr?: T`), not `T | null`.
- KEEP `| null` when `null` comes from an external source:
  - Supabase rows / API responses (`session = ref<Session | null>(null)`, computed mirroring `pageData.value?.customer ?? null`).
  - Vue template refs bound via `ref="el"` — Vue assigns `null` on unmount (`const el = ref<HTMLInputElement | null>(null)`).

### No `any` and no type casts

Do not introduce `any` and do not use `as` casts to coerce types. Fix the type at its source.

**Why:** `any` and `as` both bypass the type checker — once one slips in, errors compound silently and the next reader can't trust adjacent types.

**How to apply:**
- Template refs: declare `const el = ref<HTMLInputElement | null>(null)` and bind with `ref="el"`. Do NOT write `:ref="(node) => (el = node as HTMLInputElement)"`.
- DOM events: type the parameter (`(event: KeyboardEvent) => ...`) instead of `(event.target as HTMLInputElement).value`. If you need the input, use `event.currentTarget` with a typed listener, or read off a `ref`.
- Caught errors: use `error instanceof Error ? error.message : String(error)`. Do NOT write `(e as Error).message`.
- Supabase results: rely on the generated `Database` types in `src/types/database/` and let `.from('table').select()` infer. If a row really needs narrowing, add a runtime guard, not a cast.
- Generic shims (e.g. `useAsync` internals) that genuinely cannot be typed are the only acceptable `any`, and must stay scoped to one composable.
- Need to widen — use `unknown` plus a guard, never `any`.

### Prefer `storeToRefs` over per-ref `computed` wrappers

When consuming Pinia store state in a component, destructure with `storeToRefs(store)` instead of writing `computed(() => store.x)` for each field.

**Why:** `storeToRefs` keeps state reactive without losing the binding to the store, and avoids N hand-rolled `computed` wrappers that all do the same thing. Plain destructure (`const { x } = store`) breaks reactivity — `storeToRefs` is the canonical fix.

**How to apply:**
```ts
// good
const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

// bad — manual computed per field
const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId);
const branchId = computed(() => auth.branchId);
```

- Use `storeToRefs` only for state + getters. Actions stay on the store: `const { login } = auth` (or call `auth.login(...)` directly).
- Mixing both is fine: `const { tenantId } = storeToRefs(auth)` for state, `auth.signOut()` for actions.

### Auto-generated barrel files

`plugins/index-generator.ts` regenerates `src/**/index.ts` on Vite `buildStart`. Edit the generator, not the output. Generator emits single-quoted import paths to match prettier (`singleQuote: true`).
