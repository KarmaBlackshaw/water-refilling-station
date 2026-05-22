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

### Auto-generated barrel files

`plugins/index-generator.ts` regenerates `src/**/index.ts` on Vite `buildStart`. Edit the generator, not the output. Generator emits single-quoted import paths to match prettier (`singleQuote: true`).
