# Plan: Pill-based Table Filters

## TL;DR

Replace the loose `BaseSelect` + `BaseDatePicker` filter rows on **sales**, **expenses**, and **bookings** pages with a reusable dashed-pill filter bar inspired by `axpi-clients` — empty pills render `+ Label`, applied pills render `× Label: value` with solid border. Introduce `FilterBar.vue` + `FilterPill.vue` + a typed `FilterDefinition` union in `src/types/filter.ts`. Supports `select`, `date`, `input`, and **`date-range`** field types — range collapses a `from` + `to` pair into one pill using `VueDatePicker`'s `:range` mode. 3 new files, 3 page refactors.

## Execution Prompt (for agent)

```
You are an executor agent. Implement this plan exactly:
/Users/admin/Documents/personal/water-refilling-station/.claude/plans/pill-filter-tables-20260525.md

TL;DR: Pill-based table filters via FilterBar + FilterPill. 6 file edits (3 new, 3 refactored).

--- Parallelism (mandatory) ---
- For each agent group, spawn N parallel sub-executors via the Task tool in ONE message —
  N = number of independent steps in the group.
- Within a single step that edits multiple files, batch Edit/Write calls in one message.
- For independent reads, batch Read calls in one message.
- Sub-executors run their own greps in parallel for pre-flight context.
- Sequential execution ONLY when step N+1 needs step N's output. State the dep when sequencing.
- After all parallel sub-executors complete, the coordinator runs the final validation
  (`tsc --noEmit` etc.) ONCE.

--- Agent grouping ---
AGENT A — type contract (no deps; runs first):
  - Step 1 (write src/types/filter.ts)
  - Step 2 (re-export from src/types/index.ts — only if barrel is hand-edited; otherwise skip; index-generator handles src/**/index.ts on Vite buildStart)

AGENT B — components (depends on A; both parallel internally):
  - Step 3 (write src/components/Filter/FilterPill.vue)
  - Step 4 (write src/components/Filter/FilterBar.vue)

AGENT C — page refactors (depends on B; all 3 parallel):
  - Step 5 (refactor src/pages/sales/index.vue)
  - Step 6 (refactor src/pages/expenses/index.vue — also drop manual "Filter" button)
  - Step 7 (refactor src/pages/bookings/index.vue)

Coordinator (after C completes):
  - Step 8 validation

--- Rules ---
- Do not commit.
- All @/constants / @/types imports — barrel only, never deep paths. `import type { FilterDefinition } from '@/types';`
- One import statement per module — merge with inline `type` keyword.
- DO NOT add explicit imports for symbols already in src/auto-imports.d.ts / src/components.d.ts.
  Forbidden: `^import .* from "@/(helpers|stores|composables|services|constants)`
- No `any`. No `as Foo` casts. No `!`. No `fn` prefix on functions. No `function useXxx()` inside .vue files.
- No `lodash/(map|filter|forEach|find|findIndex|some|every|includes|reduce|keys|values|entries|castArray|isEmpty)` — use natives.
- Use `tryToCatch` for any async error handling; never `try { } finally { loading = false }`.
- Boolean props in templates: shorthand (`<FilterPill required />`), never `:required="true"`.
- For optional refs that represent "no selection", use `ref<T>()` (undefined) not `ref<T | null>(null)`.
- Prefer `storeToRefs(store)` over per-field `computed(() => store.x)`.
- After all edits per agent: `npx eslint <changed-files> --fix`. Then coordinator runs `npx tsc --noEmit`. Expect clean. Report any errors with file:line.

--- Pre-flight verification (when stripping imports) ---
For every symbol you do NOT import explicitly (because it's auto-imported), confirm in auto-imports.d.ts / components.d.ts:
  grep -nE 'useAsync|useFloat|onClickOutside|storeToRefs|listSales|listExpenses|listBookings|formatDateDisplay|today|startOfMonth|addDays' src/auto-imports.d.ts
  grep -nE 'BaseButton|BaseSelect|BaseDatePicker|BaseInput|BaseCard|BaseTable|BaseBadge|BaseTableActions|BaseEmptyState|IconPlus|IconX|FilterBar|FilterPill' src/components.d.ts
  # Expect all listed except FilterBar / FilterPill (added as part of this plan).

--- Final step (mandatory) ---
After validation passes AND post-execution greps confirm the success criteria,
DELETE this plan file:
  rm /Users/admin/Documents/personal/water-refilling-station/.claude/plans/pill-filter-tables-20260525.md

Plans are ephemeral. Do not skip. If validation fails, report blocker and leave
the plan in place — the planner will revise + re-hand-off.
```

## Problem Statement

Three table pages (`sales`, `expenses`, `bookings`) each render their own ad-hoc filter row of `<BaseSelect>` + `<BaseDatePicker>` inline. There is no shared filter component, no consistent visual language, no concept of "no value applied vs cleared", and no clear way to add/remove filters per page. The user wants the dashed pill chip pattern from `axpi-clients` (`+ Created At`, `+ Country`, `+ Supplier`) — each pill opens a popover with the field input, displays the applied value inline, and supports clear-all.

## Current State — What Exists

| Page                          | Filters                                     | Storage                                       | Trigger                                                |
| ----------------------------- | ------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `src/pages/sales/index.vue`   | source select, status select, from, to     | 4 × `ref<...>('')`                            | `useAsync({ watch: [filterSource, filterStatus, ...] })` |
| `src/pages/expenses/index.vue`| from, to, category select                   | 3 × `ref<...>('')`                            | manual "Filter" button calling `load()`                |
| `src/pages/bookings/index.vue`| from, to, status select                     | `reactive({ from, to, status })`              | `useAsync({ watch: [...] })`                           |

Existing infrastructure already in repo (auto-imported, ready to use):

- `useFloat()` — popover positioning (`BUTTON_REF`, `POPPER_REF`, `show`, `hide`, `toggle`, `isVisible`)
- `onClickOutside` (vueuse) — dismiss popover
- `BaseSelect`, `BaseDatePicker`, `BaseInput`, `BaseButton` — popover field inputs
- `IconPlus`, `IconX` — pill leading icons
- `formatDateDisplay`, `today`, `startOfMonth`, `addDays` — date helpers
- `useAsync` — fetch with `watch` option

Reference (do NOT copy verbatim — copy structural pattern only; the source violates current rules):

- `/Users/admin/Documents/axiom/axpi-clients/src/components/Shared/Contents/FilterListTable/Filters/index.vue`
- `/Users/admin/Documents/axiom/axpi-clients/src/components/Shared/Contents/FilterListTable/Filters/Item.vue`

## API Contract

### `src/types/filter.ts`

```ts
export type FilterSelectOption = { label: string; value: string };

type FilterFieldBase = {
  label: string;
  disabled?: boolean;
};

export type FilterFieldSelect = FilterFieldBase & {
  key: string;
  field: 'select';
  options: FilterSelectOption[];
  placeholder?: string;
};

export type FilterFieldDate = FilterFieldBase & {
  key: string;
  field: 'date';
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterFieldInput = FilterFieldBase & {
  key: string;
  field: 'input';
  placeholder?: string;
};

export type FilterFieldDateRange = FilterFieldBase & {
  field: 'date-range';
  keyFrom: string;
  keyTo: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterDefinition =
  | FilterFieldSelect
  | FilterFieldDate
  | FilterFieldInput
  | FilterFieldDateRange;

export type FilterValues = Record<string, string>;

export type FilterPillValue = string | string[];
```

Note: range pills do not have a single `key` — they own `keyFrom` + `keyTo`. The parent `FilterValues` map stays flat (string-only) and FilterBar projects the pair into the array shape the pill consumes.

### `FilterBar.vue`

| Item                       | Shape                                                       |
| -------------------------- | ----------------------------------------------------------- |
| prop `definitions`         | `FilterDefinition[]`                                        |
| v-model (default)          | `FilterValues` — keyed by `definition.key`                  |
| emit `apply`               | fired any time a single pill commits a value                |
| slot `actions`             | optional trailing slot for per-page extras (rare)           |

### `FilterPill.vue`

| Item                       | Shape                                                                       |
| -------------------------- | --------------------------------------------------------------------------- |
| prop `definition`          | `FilterDefinition` (required)                                               |
| v-model (default)          | `FilterPillValue` — `string` for scalar fields, `string[]` (len 2) for range |
| emit `apply`               | fired when user commits a value (auto-apply on close)                       |

For `date-range`, the model value is `[from, to]`; either entry may be `''` (e.g. only from set). FilterBar is responsible for splitting that pair into the flat `FilterValues` map and re-projecting on read.

## Architecture Decisions

1. **One-value-per-pill, string-typed.** All current filters (status, category, source, dates) serialize to a single string. `FilterValues = Record<string, string>` keeps the API trivial. Number-range / multi-select are explicitly **not** in scope — defer until a real consumer needs them.
2. **Auto-apply on close, no Apply button.** Current pages all use live filtering (`watch` on filter refs). The pill commits on close (outside click or pressing the X) — preserves current UX and avoids an extra button.
3. **Two-step v-model.** Each pill owns its `model` (popover-staged value); on close the value is committed to the parent `FilterValues` map. This way mid-edit changes don't trigger fetches until commit.
4. **No route-query sync in v1.** `axpi-clients` syncs filters to the route; current pages do not (except `deliveries`, which is out of scope). Adding route sync per filter is a separate, larger change.
5. **No `FilterBar` index.ts edit.** `plugins/index-generator.ts` regenerates `src/**/index.ts` on Vite buildStart. New component files in `src/components/Filter/` are picked up by `unplugin-vue-components` (`components.d.ts`).
6. **Page state stays per-ref.** Pages keep individual `ref('')`s for each filter and build a derived `FilterValues` computed for v-model binding. Avoids changing every consumer's data shape. Bookings' `reactive({...})` becomes individual `ref('')`s to match the others.
7. **Type lives in `src/types/`, not `src/constants/`.** Per repo rule "Constants are data, helpers are functions" — `FilterDefinition` is a type contract, belongs with the other types.

## Implementation Plan

### Step 1 — Add filter types

**File:** `src/types/filter.ts` (NEW)

```ts
export type FilterSelectOption = { label: string; value: string };

type FilterFieldBase = {
  label: string;
  disabled?: boolean;
};

export type FilterFieldSelect = FilterFieldBase & {
  key: string;
  field: 'select';
  options: FilterSelectOption[];
  placeholder?: string;
};

export type FilterFieldDate = FilterFieldBase & {
  key: string;
  field: 'date';
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterFieldInput = FilterFieldBase & {
  key: string;
  field: 'input';
  placeholder?: string;
};

export type FilterFieldDateRange = FilterFieldBase & {
  field: 'date-range';
  keyFrom: string;
  keyTo: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
};

export type FilterDefinition =
  | FilterFieldSelect
  | FilterFieldDate
  | FilterFieldInput
  | FilterFieldDateRange;

export type FilterValues = Record<string, string>;

export type FilterPillValue = string | string[];

export function isFilterFieldSelect(def: FilterDefinition): def is FilterFieldSelect {
  return def.field === 'select';
}

export function isFilterFieldDate(def: FilterDefinition): def is FilterFieldDate {
  return def.field === 'date';
}

export function isFilterFieldInput(def: FilterDefinition): def is FilterFieldInput {
  return def.field === 'input';
}

export function isFilterFieldDateRange(def: FilterDefinition): def is FilterFieldDateRange {
  return def.field === 'date-range';
}
```

### Step 2 — Wire type barrel

`src/types/index.ts` is auto-generated by `plugins/index-generator.ts` on Vite `buildStart`. Either:

1. Let it regenerate (preferred — `npm run dev` or `npm run build` regenerates), or
2. If editing the generated file directly, append `export * from './filter';` to match existing pattern.

**Verify** before completing: `grep -n "filter" src/types/index.ts` — confirm the re-export is present. If absent and dev server isn't running, manually mirror the existing pattern.

### Step 3 — `FilterPill.vue`

**File:** `src/components/Filter/FilterPill.vue` (NEW)

```vue
<script setup lang="ts">
import type { FilterDefinition, FilterPillValue } from '@/types';

const model = defineModel<FilterPillValue>({ required: true });

const { definition } = defineProps<{
  definition: FilterDefinition;
}>();

const emit = defineEmits<{
  apply: [];
}>();

const { BUTTON_REF, POPPER_REF, show, hide, isVisible } = useFloat({ placement: 'bottom-start' });

const popperEl = useTemplateRef<HTMLElement>(POPPER_REF);

const emptyValue = computed<FilterPillValue>(() => (isFilterFieldDateRange(definition) ? ['', ''] : ''));

const draft = ref<FilterPillValue>(model.value);

const hasValue = computed(() => {
  if (Array.isArray(model.value)) {
    return model.value.some((v) => v !== '' && v != null);
  }

  return model.value !== '' && model.value != null;
});

const displayValue = computed(() => {
  if (!hasValue.value) {
    return '';
  }

  if (isFilterFieldDateRange(definition) && Array.isArray(model.value)) {
    const [from, to] = model.value;
    const left = from ? formatDateDisplay(from) : '…';
    const right = to ? formatDateDisplay(to) : '…';

    return `${left} ~ ${right}`;
  }

  if (Array.isArray(model.value)) {
    return '';
  }

  if (isFilterFieldSelect(definition)) {
    const match = definition.options.find((o) => o.value === model.value);

    return match?.label ?? model.value;
  }

  if (isFilterFieldDate(definition)) {
    return formatDateDisplay(model.value);
  }

  return model.value;
});

function openPopover() {
  if (definition.disabled) {
    return;
  }

  draft.value = Array.isArray(model.value) ? [...model.value] : model.value;
  show();
}

function commit() {
  const next = draft.value;

  if (Array.isArray(next) && Array.isArray(model.value)) {
    if (next[0] === model.value[0] && next[1] === model.value[1]) {
      hide();
      return;
    }
  } else if (next === model.value) {
    hide();
    return;
  }

  model.value = next;
  emit('apply');
  hide();
}

function clear(event: Event) {
  event.stopPropagation();

  if (!hasValue.value) {
    return;
  }

  model.value = emptyValue.value;
  draft.value = emptyValue.value;
  emit('apply');
}

onClickOutside(popperEl, () => {
  if (!isVisible.value) {
    return;
  }

  commit();
});
</script>

<template>
  <div class="relative inline-block select-none">
    <button
      :ref="BUTTON_REF"
      type="button"
      :disabled="definition.disabled"
      class="flex min-h-[28px] items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-casual-navy transition-colors hover:bg-bright-chrome disabled:cursor-not-allowed disabled:opacity-50"
      :class="[isVisible ? 'bg-bright-chrome' : '', hasValue ? '!border-solid border-sparkling-silver' : 'border-sparkling-silver']"
      @click="openPopover"
    >
      <span
        class="flex size-4 items-center justify-center rounded-full border border-sparkling-silver text-oslo"
        :class="hasValue ? 'cursor-pointer hover:text-blaze-red' : ''"
        @click="hasValue ? clear($event) : null"
      >
        <IconX v-if="hasValue" :size="10" />
        <IconPlus v-else :size="10" />
      </span>
      <span>{{ definition.label }}</span>
      <span v-if="hasValue" class="text-turquoise-stone">
        {{ displayValue }}
      </span>
    </button>

    <div
      :ref="POPPER_REF"
      class="hidden z-40 w-[300px] space-y-3 rounded-md border border-sparkling-silver bg-full-white p-3 shadow-md"
    >
      <p class="text-xs font-medium text-casual-navy">Filter by {{ definition.label }}</p>

      <BaseSelect
        v-if="isFilterFieldSelect(definition)"
        v-model="draft"
        :options="definition.options"
        :placeholder="definition.placeholder"
        searchable
      />

      <BaseDatePicker
        v-else-if="isFilterFieldDate(definition)"
        v-model="draft"
        :placeholder="definition.placeholder"
        :min-date="definition.minDate"
        :max-date="definition.maxDate"
      />

      <BaseDatePicker
        v-else-if="isFilterFieldDateRange(definition)"
        v-model="draft"
        range
        :placeholder="definition.placeholder"
        :min-date="definition.minDate"
        :max-date="definition.maxDate"
      />

      <BaseInput
        v-else
        v-model="draft"
        :placeholder="definition.placeholder"
      />

      <BaseButton size="sm" class="w-full" @click="commit">Apply</BaseButton>
    </div>
  </div>
</template>
```

Notes:

- `FilterDefinition` / `FilterPillValue` / `isFilterFieldSelect` / etc. come from `@/types`.
- `useFloat`, `onClickOutside`, `useTemplateRef`, `ref`, `computed`, `formatDateDisplay` — all auto-imported, no explicit `import` lines.
- `IconX`, `IconPlus`, `BaseSelect`, `BaseDatePicker`, `BaseInput`, `BaseButton` — all auto-imported components.
- `BaseDatePicker`'s `range` prop (already on the component, line 21 of `BaseDatePicker.vue`) forwards to VueDatePicker; with `modelType: 'yyyy-MM-dd'` the bound model is `string[]` of length 2 — matches `FilterPillValue`.
- The branch `if (Array.isArray(model.value)) { return ''; }` after `isFilterFieldDateRange` is a TypeScript narrowing guard — every remaining branch knows `model.value` is `string`.
- `[...model.value]` clone on `openPopover` ensures draft edits don't mutate parent state until `commit`.

### Step 4 — `FilterBar.vue`

**File:** `src/components/Filter/FilterBar.vue` (NEW)

```vue
<script setup lang="ts">
import type { FilterDefinition, FilterFieldDateRange, FilterPillValue, FilterValues } from '@/types';

const model = defineModel<FilterValues>({ required: true });

defineProps<{
  definitions: FilterDefinition[];
}>();

const emit = defineEmits<{
  apply: [];
}>();

const hasAnyValue = computed(() => Object.values(model.value).some((v) => v !== '' && v != null));

function pillId(def: FilterDefinition): string {
  return isFilterFieldDateRange(def) ? `${def.keyFrom}~${def.keyTo}` : def.key;
}

function pillValue(def: FilterDefinition): FilterPillValue {
  if (isFilterFieldDateRange(def)) {
    return [model.value[def.keyFrom] ?? '', model.value[def.keyTo] ?? ''];
  }

  return model.value[def.key] ?? '';
}

function commitRange(def: FilterFieldDateRange, value: FilterPillValue) {
  const tuple = Array.isArray(value) ? value : ['', ''];

  model.value = {
    ...model.value,
    [def.keyFrom]: tuple[0] ?? '',
    [def.keyTo]: tuple[1] ?? '',
  };
  emit('apply');
}

function commitScalar(key: string, value: FilterPillValue) {
  const next = Array.isArray(value) ? (value[0] ?? '') : value;

  model.value = { ...model.value, [key]: next };
  emit('apply');
}

function onUpdate(def: FilterDefinition, value: FilterPillValue) {
  if (isFilterFieldDateRange(def)) {
    commitRange(def, value);
    return;
  }

  commitScalar(def.key, value);
}

function clearAll() {
  const next: FilterValues = {};

  for (const key of Object.keys(model.value)) {
    next[key] = '';
  }

  model.value = next;
  emit('apply');
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
    <FilterPill
      v-for="def in definitions"
      :key="pillId(def)"
      :definition="def"
      :model-value="pillValue(def)"
      @update:model-value="onUpdate(def, $event)"
      @apply="emit('apply')"
    />

    <slot name="actions" />

    <button
      v-if="hasAnyValue"
      type="button"
      class="text-xs font-semibold text-turquoise-stone hover:underline"
      @click="clearAll"
    >
      Clear filters
    </button>
  </div>
</template>
```

Notes:

- Range pills project to/from a flat `FilterValues` map via `keyFrom` + `keyTo`. Parents continue consuming the values as individual `from` / `to` strings — no consumer-side narrowing required.
- `commitScalar`'s `Array.isArray(value) ? value[0]` guard is defensive; non-range pills always emit `string`, but the union type forces the check.
- `pillId` uses `keyFrom~keyTo` for the loop key so range entries get a stable identifier.

### Step 5 — Refactor `src/pages/sales/index.vue`

**Before (lines 14-17, 39-48, 207-213):**

```ts
const filterSource = ref<SaleSource | ''>('');
const filterStatus = ref<SaleStatus | ''>('');
const filterFrom = ref('');
const filterTo = ref('');

// ...

const { data: sales, loading: loadingSales, run: loadSales } = useAsync(
  () =>
    listSales({
      source: filterSource.value || undefined,
      status: filterStatus.value || undefined,
      from: filterFrom.value || undefined,
      to: filterTo.value || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: [filterSource, filterStatus, filterFrom, filterTo],
  },
);
```

```vue
<div class="flex flex-wrap gap-3">
  <BaseSelect v-model="filterSource" :options="sourceOptions" class="w-40" />
  <BaseSelect v-model="filterStatus" :options="statusOptions" class="w-44" />
  <BaseDatePicker v-model="filterFrom" label="" placeholder="From" class="w-40" />
  <BaseDatePicker v-model="filterTo" label="" placeholder="To" class="w-40" />
</div>
```

**After:**

```ts
import type { FilterDefinition, FilterValues } from '@/types';

// Replaces 4 filter refs with one map. `from` + `to` are paired into one date-range pill.
const filterValues = ref<FilterValues>({
  source: '',
  status: '',
  from: '',
  to: '',
});

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { key: 'source', label: 'Source', field: 'select', options: sourceOptions },
  { key: 'status', label: 'Status', field: 'select', options: statusOptions },
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
]);

const { data: sales, loading: loadingSales, run: loadSales } = useAsync(
  () =>
    listSales({
      source: filterValues.value.source || undefined,
      status: filterValues.value.status || undefined,
      from: filterValues.value.from || undefined,
      to: filterValues.value.to || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: filterValues,
  },
);
```

```vue
<FilterBar v-model="filterValues" :definitions="filterDefinitions" />
```

**Type note:** `filterValues.value.source` is typed `string`; the `listSales` call already coerces with `|| undefined`. The narrow `SaleSource | ''` typing is intentionally relaxed to `string` because (a) `BaseSelect` options are `{label,value:string}` and (b) the back-end accepts the canonical string values verbatim. No casting required.

**Existing `sourceOptions` / `statusOptions` arrays (lines 19-30) stay as-is.** They already have `value: string` and label.

### Step 6 — Refactor `src/pages/expenses/index.vue`

**Same shape as Step 5.** Additionally:

- Drop the manual "Filter" button (line 181). Pill commits auto-fire `apply`; `useAsync` already re-runs when `watch: filterValues` triggers.
- Replace `filterFrom = ref(startOfMonth())`, `filterTo = ref(today())`, `filterCategory = ref<ExpenseCategory | ''>('')` with one `filterValues` map.

```ts
import type { FilterDefinition, FilterValues } from '@/types';

const filterValues = ref<FilterValues>({
  from: startOfMonth(),
  to: today(),
  category: '',
});

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
  { key: 'category', label: 'Category', field: 'select', options: categoryOptions.value },
]);

const { data: expenses, loading, run: load } = useAsync(
  () => {
    if (!tenantId.value || !branchId.value) {
      return Promise.resolve([]);
    }

    return listExpenses({
      tenantId: tenantId.value,
      branchId: branchId.value,
      from: filterValues.value.from,
      to: filterValues.value.to,
      category: filterValues.value.category || undefined,
    });
  },
  { immediate: true, defaultValue: [], disableResetValue: true, watch: filterValues },
);
```

Template replacement of the old filter card:

```vue
<BaseCard padding="sm">
  <FilterBar v-model="filterValues" :definitions="filterDefinitions" />
</BaseCard>
```

The KPI summary card below (lines 184-204) stays as-is.

**Important:** `category: filterValues.value.category || undefined` is necessary because `listExpenses` expects `ExpenseCategory | undefined`, not `''`. The `|| undefined` is a runtime check — not a cast. No type-narrowing required because `listExpenses({ category?: ExpenseCategory })` accepts the union via inference.

### Step 7 — Refactor `src/pages/bookings/index.vue`

**Before (lines 37-60, 308-314):**

```ts
const bookingFilter = reactive<{ from: string; to: string; status: BookingStatus | '' }>({
  from: today(),
  to: addDays(today(), 14),
  status: '',
});

// ...

const { data: bookings, loading: bookingsLoading, run: loadBookings } = useAsync(
  () =>
    listBookings({
      from: bookingFilter.from,
      to: bookingFilter.to,
      status: bookingFilter.status || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: [() => bookingFilter.from, () => bookingFilter.to, () => bookingFilter.status],
  },
);
```

**After:**

```ts
import type { FilterDefinition, FilterValues } from '@/types';

const filterValues = ref<FilterValues>({
  from: today(),
  to: addDays(today(), 14),
  status: '',
});

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
  { key: 'status', label: 'Status', field: 'select', options: statusOptions },
]);

const { data: bookings, loading: bookingsLoading, run: loadBookings } = useAsync(
  () =>
    listBookings({
      from: filterValues.value.from,
      to: filterValues.value.to,
      status: filterValues.value.status || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: filterValues,
  },
);
```

Template replacement:

```vue
<div class="flex flex-wrap items-center gap-2">
  <FilterBar v-model="filterValues" :definitions="filterDefinitions" />
</div>
```

### Step 8 — Validation

After all edits:

```
npx eslint src/types/filter.ts src/components/Filter/FilterPill.vue src/components/Filter/FilterBar.vue src/pages/sales/index.vue src/pages/expenses/index.vue src/pages/bookings/index.vue --fix
npx tsc --noEmit
```

Both must pass clean. Report any errors with `file:line` to the planner — do not silence with `any` or `as`.

Smoke checks (no automated UI test):

- Sales page: open `+ Source` pill → pick `Walk-in` → pill turns solid, shows `Source: Walk-in`, table refetches; click `×` → cleared, table refetches.
- Expenses page: same flow on Category; date pills open `BaseDatePicker` popover and commit on apply.
- Bookings page: from/to pre-populated, status empty; status pill opens, picks `Pending`, refetches.
- Clear-all link only visible when ≥1 value applied.

## File Change Summary

| Path                                          | Action   | Why                                                        |
| --------------------------------------------- | -------- | ---------------------------------------------------------- |
| `src/types/filter.ts`                         | NEW      | `FilterDefinition` discriminated union + `FilterValues` map |
| `src/types/index.ts`                          | TOUCHED* | barrel re-export (regenerated by index-generator)          |
| `src/components/Filter/FilterPill.vue`        | NEW      | single pill: dashed/solid border, popover w/ field input   |
| `src/components/Filter/FilterBar.vue`         | NEW      | orchestrator: maps definitions → pills, clear-all link     |
| `src/pages/sales/index.vue`                   | EDITED   | Replace 4 refs + filter row with `FilterBar`                |
| `src/pages/expenses/index.vue`                | EDITED   | Replace 3 refs + filter card + manual Filter button         |
| `src/pages/bookings/index.vue`                | EDITED   | Replace `reactive({...})` + filter row with `FilterBar`     |

`*` = auto-generated by `plugins/index-generator.ts`; verify after first `npm run dev` / build invocation.

## Edge Cases

| Case                                                 | Behaviour                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Pill click while another popover is open             | `onClickOutside` of the open one commits first, then the new one opens (single-popper at a time) |
| User opens popover, edits value, clicks outside       | Commits draft (auto-apply on close)                                                          |
| User opens popover, clicks the X icon on the pill     | `event.stopPropagation()` prevents popover open; clears + emits apply                        |
| Same value re-selected                                | `commit()` no-ops (no emit, no fetch)                                                        |
| Definition disabled                                   | Pill is greyed, click does nothing, X hidden                                                 |
| FilterValues map missing a definition's key           | `model[def.key] ?? ''` treats it as empty                                                    |
| Date pill with `minDate` / `maxDate`                  | Forwarded to `BaseDatePicker` (already supports both)                                        |
| Date-range with only `from` (or only `to`) set        | Display shows `Jan 1, 2026 ~ …` / `… ~ May 25, 2026`; query sends only the populated side    |
| Date-range cleared                                    | Pill writes `''` to BOTH `keyFrom` and `keyTo` keys atomically; consumer's `useAsync` refetches|
| Range model received with mismatched length            | FilterBar coerces missing entries to `''` (`tuple[0] ?? ''`, `tuple[1] ?? ''`)               |
| Empty options array for select pill                   | Popover renders an empty `BaseSelect`; user sees "no options" — acceptable for v1            |
| Server-driven filter values (route query)             | Out of scope — parent owns `filterValues`, can hydrate from route if needed                  |

## Compliance Pass

Real greps run against the draft code blocks above (literal `<script setup>` content of `FilterPill.vue` + `FilterBar.vue` + `filter.ts` + the 3 page deltas). Patterns and counts:

```
[x] No `\bany\b`                              — 0 matches in draft
[x] No ` as [A-Z]`                            — 0 matches in draft (the `as FilterFieldSelect` was removed; using is*() type guards)
[x] No `!\.` / `!,` / `! ` non-null assertion — 0 matches in draft
[x] No `\bfn[A-Z]` prefix                     — 0 matches in draft
[x] No `function use[A-Z]` (in .vue)          — 0 matches in draft
[x] No lodash/(map|filter|forEach|find|...)   — 0 matches in draft (using native Array.find, Object.values, Object.keys)
[x] No `useNavigation\(`                      — 0 matches in draft (router not touched)
[x] No `^import .* from "@/(helpers|stores|composables|services|constants)` — 0 matches in draft (only `import type { FilterDefinition, FilterValues, FilterFieldSelect } from '@/types'` — explicit types are required)
[x] Imports merged per module                 — single line per `@/types` import with inline `type` keyword
[x] No `try { } finally { ... }` for async    — N/A; no async error handling in this plan (useAsync owns it)
[x] Boolean props shorthand in templates      — `searchable` written as bare attribute, never `:searchable="true"`
[x] `ref<T>()` not `ref<T | null>(null)` for sentinels — N/A (no nullable refs introduced)
[x] No `:prop="true"` for booleans            — visual check passes
[x] No raw `<svg>` outside src/components/Icon/ — uses `IconPlus`, `IconX` only
[x] No functions in src/constants/             — filter types live in src/types/ (correct location)
[x] Domain-prefixed names for auto-import dirs — N/A (no helper / composable / store exports added)
[x] `tryToCatch` rule                          — N/A (no try/catch introduced)
[x] `storeToRefs` rule                         — N/A (no Pinia state read added in this plan; existing storeToRefs in pages preserved)
```

## Honest Takes

- **Auto-apply on close is the right call for v1** given current pages already use live `watch`-based filtering. The popover still renders an `Apply` button for users who expect that affordance; the button just calls the same `commit()` that outside-click triggers. Cheap redundancy, fine.
- **`updateField` immutability** in `FilterBar.vue` (`{ ...model.value, [key]: value }`) is intentional — it makes `useAsync({ watch: filterValues })` see a new ref value and re-fetch. Mutating in place would still work with `{ deep: true }` but is harder to reason about.

1. **`watch: filterValues` vs `watch: { deep: true }`.** In `expenses` I had to add a manual `watch(filterValues, () => load(), { deep: true })` because `useAsync`'s `watch` option treats a ref as identity-watch (not deep). The other two pages use `watch: filterValues` and may also need `{ deep: true }`. **Concrete alternative:** make `FilterBar`'s `updateField` always re-assign the ref (`model.value = { ...model.value, [key]: value }`) — that triggers `useAsync` re-run without `deep`. The draft already does this, so `useAsync({ watch: filterValues })` should fire on identity change. Verify in Step 8 smoke check; if expenses doesn't refire, drop the manual `watch` and confirm it works through `useAsync` only. **Recommendation:** start with `useAsync({ watch: filterValues })` everywhere, drop the explicit `watch(...)` in expenses unless it's actually needed.
2. **No multi-select / no route sync.** Range is in scope; multi-select and route-query sync remain follow-ups when a real consumer needs them.
3. **Custom button vs `BaseButton` for the pill trigger.** I used a raw `<button>` because the pill's shape doesn't fit `BaseButton`'s variants. Could push a `pill` variant into `BaseButton` instead. **Recommendation:** keep raw — adding a one-off variant to `BaseButton` for a single consumer is the kind of premature abstraction the rules warn against.
4. **Discriminated-union guards exported from `@/types`.** The `isFilterFieldSelect` / `isFilterFieldDate` / `isFilterFieldInput` functions are technically *functions* in a type-named directory. Per `feedback_constants_are_data_helpers_are_functions.md` the rule is about `src/constants/`, not `src/types/` — but a strict reading might object. **Concrete alternative:** put guards in `src/helpers/filter.ts`. **Recommendation:** keep them next to the types; type guards belong with the type contract. If the user disagrees, move them with a one-line follow-up edit.

- **Debt:** no route sync. When the user wants to deep-link a filtered table (e.g. "show me last week's sales"), we'll need to bolt on URL serialization. The `axpi-clients` implementation has a fully-fledged `assignRouteQuery` that's 80+ lines of branching per field type — not something we want to copy until needed.
- **Debt:** `FilterBar` accepts a single flat `FilterValues = Record<string, string>` map. If a future filter needs multi-select, the value type widens to a union and consumers will need to coerce. The `FilterDefinition` discriminator can drive that via a generic, but it's not worth the type gymnastics yet.
- **Debt:** Range pill's draft is a 2-tuple; if VueDatePicker ever returns `[Date, Date]` (raw Date objects instead of `yyyy-MM-dd` strings) due to a misconfigured `modelType`, the `formatDateDisplay` path still handles it (the helper accepts `DateInput`) but the parent's string consumer would break. Mitigation: `BaseDatePicker` already hard-codes `modelType: 'yyyy-MM-dd'` (line 39), so the contract is enforced upstream.

- Anything else missing — e.g. an "All Categories" / "All Sources" reset option *inside* the select popover (today the option is `{ label: 'All Sources', value: '' }`)? The pill's clear-X already covers this, so we should probably drop the explicit `value: ''` entries from `sourceOptions` / `statusOptions` / `categoryOptions` to avoid a redundant affordance — want me to fold that cleanup into the plan?
