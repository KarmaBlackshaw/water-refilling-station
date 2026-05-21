# WRS Admin — Full App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire WRS Admin Portal UI following the Donezo dashboard structure, keeping teal brand (#00C9F0) and all existing data logic untouched.

**Architecture:** Component-first — icon components and base components are built first, then shell (Sidebar/Topbar/Layout), then Dashboard widgets, then the dashboard page composes everything, then inner pages get the page-header pattern. Pages are thin composers; components own all reusable UI logic.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS v4, Vite, vue-chartjs + chart.js (already installed), unplugin-vue-components (auto-imports all `src/components/**` by name), unplugin-auto-import (auto-imports all services, composables, Vue APIs).

---

## Critical Setup Notes

- **`indexGenerator` Vite plugin** auto-generates `components/Icon/index.ts` — **never manually edit it**. Just create/delete `.vue` files in `components/Icon/` and the index updates on next `npm run dev`.
- **`unplugin-vue-components`** with `directoryAsNamespace: true, collapseSamePrefixes: true`: `Icon/IconDashboard.vue` → `<IconDashboard />`, `Dashboard/DashboardRoutePanel.vue` → `<DashboardRoutePanel />`. Direct template usage is auto-imported. Script-level imports (e.g. for `:is="icon"` dynamic refs) must be explicit.
- **No test framework** — verification is `npm run type-check` (TypeScript) + visual check in `npm run dev`.
- **`BaseButton.vue`** already has `ghost` variant — no changes needed.
- **Services are auto-imported** — `listDeliverySales`, `listBookings`, `supabase`, etc. are available without import in `<script setup>`.

---

## File Map

**Create:**
- `src/components/Icon/IconDashboard.vue`
- `src/components/Icon/IconCustomers.vue`
- `src/components/Icon/IconSales.vue`
- `src/components/Icon/IconDeliveries.vue`
- `src/components/Icon/IconBookings.vue`
- `src/components/Icon/IconProducts.vue`
- `src/components/Icon/IconAreas.vue`
- `src/components/Icon/IconEmployees.vue`
- `src/components/Icon/IconMaintenance.vue`
- `src/components/Icon/IconVehicles.vue`
- `src/components/Icon/IconExpenses.vue`
- `src/components/Icon/IconSettings.vue`
- `src/components/Icon/IconSearch.vue`
- `src/components/Icon/IconBell.vue`
- `src/components/Icon/IconMail.vue`
- `src/components/Icon/IconMoney.vue`
- `src/components/Icon/IconArrowUpRight.vue`
- `src/components/Icon/IconPlus.vue`
- `src/components/Icon/IconX.vue`
- `src/components/Icon/IconMenu.vue`
- `src/components/Base/BaseKpiCard.vue`
- `src/components/Base/BaseBarChart.vue`
- `src/components/Base/BaseDonutChart.vue`
- `src/components/Dashboard/DashboardRoutePanel.vue`
- `src/components/Dashboard/DashboardQuickActions.vue`
- `src/components/Dashboard/DashboardDeliveryList.vue`
- `src/components/Dashboard/DashboardBookingList.vue`

**Modify:**
- `src/components/Base/BaseCard.vue` — remove kpi variant, add title prop + action slot
- `src/components/Base/BaseTh.vue` — add font-semibold
- `src/components/Base/BaseTr.vue` — update hover color
- `src/components/The/Sidebar.vue` — full redesign with IconXxx components
- `src/components/The/Topbar.vue` — search bar, icons, avatar, user info
- `src/layouts/MainLayout.vue` — flex layout, remove title slot/routeTitle
- `src/pages/dashboard.vue` — full compose with charts + right panel
- `src/pages/customers/index.vue` — page header pattern
- `src/pages/customers/[id].vue` — page header pattern
- `src/pages/sales/index.vue` — page header pattern
- `src/pages/deliveries/index.vue` — page header pattern
- `src/pages/bookings/index.vue` — page header pattern
- `src/pages/products/index.vue` — page header pattern
- `src/pages/areas/index.vue` — page header pattern
- `src/pages/employees/index.vue` — page header pattern
- `src/pages/employees/[id].vue` — page header pattern
- `src/pages/maintenance/index.vue` — page header pattern
- `src/pages/vehicles/index.vue` — page header pattern
- `src/pages/expenses/index.vue` — page header pattern
- `src/pages/settings/index.vue` — page header pattern

---

## Task 1: Icon Components

**Files:** Create all 20 icon files in `src/components/Icon/`. Do NOT touch `index.ts` — the `indexGenerator` plugin regenerates it automatically.

Every icon follows this exact contract:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- path(s) here -->
  </svg>
</template>
```

- [ ] **Create `IconDashboard.vue`** — 4-square grid:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
</template>
```

- [ ] **Create `IconCustomers.vue`** — two users:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
</template>
```

- [ ] **Create `IconSales.vue`** — activity pulse:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
</template>
```

- [ ] **Create `IconDeliveries.vue`** — truck:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v3h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
</template>
```

- [ ] **Create `IconBookings.vue`** — calendar:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
</template>
```

- [ ] **Create `IconProducts.vue`** — package box:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
</template>
```

- [ ] **Create `IconAreas.vue`** — map:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
</template>
```

- [ ] **Create `IconEmployees.vue`** — single user:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
</template>
```

- [ ] **Create `IconMaintenance.vue`** — wrench:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
</template>
```

- [ ] **Create `IconVehicles.vue`** — car:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
    <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
  </svg>
</template>
```

- [ ] **Create `IconExpenses.vue`** — receipt:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z"/>
    <line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/>
    <line x1="10" y1="16" x2="8" y2="16"/>
  </svg>
</template>
```

- [ ] **Create `IconSettings.vue`** — gear:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
</template>
```

- [ ] **Create `IconSearch.vue`** — magnifier:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
</template>
```

- [ ] **Create `IconBell.vue`** — bell:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
</template>
```

- [ ] **Create `IconMail.vue`** — envelope:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
</template>
```

- [ ] **Create `IconMoney.vue`** — dollar sign:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
</template>
```

- [ ] **Create `IconArrowUpRight.vue`** — diagonal arrow:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
  </svg>
</template>
```

- [ ] **Create `IconPlus.vue`** — plus:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
</template>
```

- [ ] **Create `IconX.vue`** — close:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
</template>
```

- [ ] **Create `IconMenu.vue`** — hamburger:
```vue
<script setup lang="ts">
defineProps<{ size?: number }>()
</script>
<template>
  <svg :width="size ?? 20" :height="size ?? 20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
</template>
```

- [ ] **Verify:** `npm run type-check` — expect 0 errors. `npm run dev` — open app, icons are not visible yet (used in next tasks).

- [ ] **Commit:**
```bash
git add src/components/Icon/
git commit -m "feat: add icon components (IconDashboard, IconCustomers, etc.)"
```

---

## Task 2: Update BaseCard.vue

**File:** `src/components/Base/BaseCard.vue`

Remove `kpi` variant (replaced by `BaseKpiCard` in Task 4). Add optional `title` prop and `#action` slot for card headers.

- [ ] **Replace entire file:**

```vue
<script setup lang="ts">
defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'hero'
  title?: string
}>()

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const variantClasses = {
  default: 'rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-sm',
  hero: 'rounded-2xl bg-[--color-accent] border-0 shadow-md',
}
</script>

<template>
  <div :class="[variantClasses[variant ?? 'default'], paddingClasses[padding ?? 'md']]">
    <div v-if="title || $slots.action" class="mb-3 flex items-center justify-between">
      <p v-if="title" class="text-sm font-semibold text-[--color-fg]">{{ title }}</p>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>
```

- [ ] **Verify:** `npm run type-check` — 0 errors. Any page using `variant="kpi"` will now fall back to `default` (Tailwind unknown variant ignored). Search for `variant="kpi"` across `src/` — if found, remove that prop:
```bash
grep -r 'variant="kpi"' src/
```

- [ ] **Commit:**
```bash
git add src/components/Base/BaseCard.vue
git commit -m "feat: update BaseCard — remove kpi variant, add title prop + action slot"
```

---

## Task 3: Update BaseTh.vue + BaseTr.vue

**Files:** `src/components/Base/BaseTh.vue`, `src/components/Base/BaseTr.vue`

- [ ] **Replace `BaseTh.vue`** — add `font-semibold`:
```vue
<script setup lang="ts">
// No props — renders a styled <th> wrapper
</script>
<template>
  <th class="px-4 py-3 text-xs font-semibold text-[--color-fg-subtle] uppercase tracking-wide bg-[--color-surface-2] border-b border-[--color-border]">
    <slot />
  </th>
</template>
```

- [ ] **Replace `BaseTr.vue`** — swap hover color:
```vue
<script setup lang="ts">
// No props — renders a styled <tr> wrapper
</script>
<template>
  <tr class="hover:bg-[--color-surface-2] transition-colors">
    <slot />
  </tr>
</template>
```

- [ ] **Commit:**
```bash
git add src/components/Base/BaseTh.vue src/components/Base/BaseTr.vue
git commit -m "feat: update BaseTh/BaseTr table styles"
```

---

## Task 4: Create BaseKpiCard.vue

**File:** `src/components/Base/BaseKpiCard.vue`

Single source of truth for all KPI stat cards. `variant` controls color scheme. `to` prop makes the whole card a router link.

- [ ] **Create the file:**

```vue
<script setup lang="ts">
const props = defineProps<{
  variant?: 'hero' | 'default' | 'warning' | 'danger'
  label: string
  value: string | number
  sub?: string
  to?: string
}>()

const router = useRouter()

const cardClass = computed(() => {
  const v = props.variant ?? 'default'
  return {
    hero: 'rounded-2xl bg-gradient-to-br from-[--color-accent] to-[--color-teal-dark] border-0 shadow-md cursor-default',
    default: 'rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-sm',
    warning: 'rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-sm',
    danger: 'rounded-2xl border border-[--color-border] bg-[--color-surface] shadow-sm',
  }[v]
})

const valueClass = computed(() => {
  const v = props.variant ?? 'default'
  return {
    hero: 'text-white',
    default: 'text-[--color-fg]',
    warning: 'text-[--color-warning]',
    danger: 'text-[--color-negative]',
  }[v]
})

const iconBgClass = computed(() =>
  props.variant === 'hero' ? 'bg-white/20' : 'bg-[--color-accent-soft]',
)

const labelClass = computed(() =>
  props.variant === 'hero' ? 'text-white/70' : 'text-[--color-fg-subtle]',
)

const subClass = computed(() =>
  props.variant === 'hero' ? 'text-white/60' : 'text-[--color-fg-subtle]',
)

function handleClick() {
  if (props.to) router.push(props.to)
}
</script>

<template>
  <div
    :class="[cardClass, to ? 'cursor-pointer transition-opacity hover:opacity-80' : '']"
    class="p-4"
    @click="handleClick"
  >
    <div class="mb-3 flex items-center justify-between">
      <div :class="iconBgClass" class="flex h-9 w-9 items-center justify-center rounded-lg">
        <slot name="icon" />
      </div>
      <IconArrowUpRight v-if="to" :size="14" class="opacity-40" />
    </div>
    <p :class="labelClass" class="text-xs font-medium">{{ label }}</p>
    <p :class="valueClass" class="num mt-1 text-3xl font-bold">{{ value }}</p>
    <p v-if="sub" :class="subClass" class="mt-1 text-xs">{{ sub }}</p>
  </div>
</template>
```

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/components/Base/BaseKpiCard.vue
git commit -m "feat: add BaseKpiCard component"
```

---

## Task 5: Create BaseBarChart.vue

**File:** `src/components/Base/BaseBarChart.vue`

Thin wrapper over `vue-chartjs` Bar. Registers required Chart.js pieces. Teal color scheme baked in.

- [ ] **Create the file:**

```vue
<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  labels: string[]
  data: number[]
  title?: string
  height?: number
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: 'rgba(0, 201, 240, 0.25)',
      hoverBackgroundColor: '#00C9F0',
      borderRadius: 4,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#94A3B8', font: { size: 11 } },
    },
    y: { display: false },
  },
}
</script>

<template>
  <div>
    <p v-if="title" class="mb-2 text-sm font-semibold text-[--color-fg]">{{ title }}</p>
    <div :style="{ height: `${height ?? 160}px` }">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
```

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/components/Base/BaseBarChart.vue
git commit -m "feat: add BaseBarChart component (vue-chartjs wrapper)"
```

---

## Task 6: Create BaseDonutChart.vue

**File:** `src/components/Base/BaseDonutChart.vue`

- [ ] **Create the file:**

```vue
<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{
  segments: { label: string; value: number; color: string }[]
  title?: string
  centerLabel?: string
}>()

const chartData = computed(() => ({
  labels: props.segments.map((s) => s.label),
  datasets: [
    {
      data: props.segments.map((s) => s.value),
      backgroundColor: props.segments.map((s) => s.color),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
}
</script>

<template>
  <div>
    <p v-if="title" class="mb-2 text-sm font-semibold text-[--color-fg]">{{ title }}</p>
    <div class="flex items-center gap-4">
      <div class="relative shrink-0" style="width: 80px; height: 80px;">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div
          v-if="centerLabel"
          class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-[--color-fg]"
        >
          {{ centerLabel }}
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <div v-for="seg in segments" :key="seg.label" class="flex items-center gap-2 text-xs text-[--color-fg-muted]">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: seg.color }" />
          <span>{{ seg.label }} ({{ seg.value }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/components/Base/BaseDonutChart.vue
git commit -m "feat: add BaseDonutChart component (vue-chartjs wrapper)"
```

---

## Task 7: Update The/Sidebar.vue

**File:** `src/components/The/Sidebar.vue`

Key changes: import IconXxx components explicitly (needed for `:is` dynamic ref), active state uses teal bg + text only (no border), sidebar width 210px.

- [ ] **Replace entire file:**

```vue
<script setup lang="ts">
import IconDashboard from '@/components/Icon/IconDashboard.vue'
import IconCustomers from '@/components/Icon/IconCustomers.vue'
import IconSales from '@/components/Icon/IconSales.vue'
import IconDeliveries from '@/components/Icon/IconDeliveries.vue'
import IconBookings from '@/components/Icon/IconBookings.vue'
import IconProducts from '@/components/Icon/IconProducts.vue'
import IconAreas from '@/components/Icon/IconAreas.vue'
import IconEmployees from '@/components/Icon/IconEmployees.vue'
import IconMaintenance from '@/components/Icon/IconMaintenance.vue'
import IconVehicles from '@/components/Icon/IconVehicles.vue'
import IconExpenses from '@/components/Icon/IconExpenses.vue'
import IconSettings from '@/components/Icon/IconSettings.vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()

const MAIN_NAV = [
  { label: 'Dashboard',   to: '/dashboard',   icon: IconDashboard },
  { label: 'Customers',   to: '/customers',   icon: IconCustomers },
  { label: 'Sales',       to: '/sales',       icon: IconSales },
  { label: 'Deliveries',  to: '/deliveries',  icon: IconDeliveries },
  { label: 'Bookings',    to: '/bookings',    icon: IconBookings },
  { label: 'Products',    to: '/products',    icon: IconProducts },
  { label: 'Areas',       to: '/areas',       icon: IconAreas },
  { label: 'Employees',   to: '/employees',   icon: IconEmployees },
  { label: 'Maintenance', to: '/maintenance', icon: IconMaintenance },
  { label: 'Vehicles',    to: '/vehicles',    icon: IconVehicles },
  { label: 'Expenses',    to: '/expenses',    icon: IconExpenses },
]

const GENERAL_NAV = [
  { label: 'Settings', to: '/settings', icon: IconSettings },
]

function isActive(to: string) {
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="flex h-full flex-col border-r border-[--color-border] bg-[--color-surface]">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[--color-border] px-4 py-4">
      <div class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[--color-accent] to-[--color-teal-dark]">
          <span class="text-[10px] font-black text-white tracking-tight">WRS</span>
        </div>
        <div class="flex flex-col leading-none">
          <span class="text-sm font-bold text-[--color-fg] tracking-tight">WRS</span>
          <span class="text-[9px] uppercase tracking-widest text-[--color-fg-subtle] mt-0.5">Admin Portal</span>
        </div>
      </div>
      <button
        v-if="open"
        type="button"
        class="rounded-md p-1.5 text-[--color-fg-muted] hover:bg-[--color-hover] lg:hidden"
        @click="emit('close')"
      >
        <IconX :size="18" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <div>
        <p class="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[--color-fg-subtle]">Menu</p>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in MAIN_NAV"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-[--color-accent-soft] text-[--color-accent] font-medium'
              : 'text-[--color-fg-muted] hover:bg-[--color-surface-2] hover:text-[--color-fg]'"
            @click="open && emit('close')"
          >
            <component :is="item.icon" :size="16" class="shrink-0" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>

      <div>
        <p class="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[--color-fg-subtle]">General</p>
        <div class="space-y-0.5">
          <RouterLink
            v-for="item in GENERAL_NAV"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-[--color-accent-soft] text-[--color-accent] font-medium'
              : 'text-[--color-fg-muted] hover:bg-[--color-surface-2] hover:text-[--color-fg]'"
            @click="open && emit('close')"
          >
            <component :is="item.icon" :size="16" class="shrink-0" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="border-t border-[--color-border] px-3 py-3">
      <span class="text-[--color-fg-subtle] text-xs">v0.1.0</span>
    </div>
  </div>
</template>
```

- [ ] **Verify:** `npm run dev` — sidebar renders with icon components, active item has teal bg + text, no border.

- [ ] **Commit:**
```bash
git add src/components/The/Sidebar.vue
git commit -m "feat: redesign Sidebar with IconXxx components, new active state"
```

---

## Task 8: Update The/Topbar.vue

**File:** `src/components/The/Topbar.vue`

Replace inline SVG hamburger with `<IconMenu />`. Add search bar (UI-only), mail/bell icon buttons, avatar with initials from auth email, user name + email.

- [ ] **Replace entire file:**

```vue
<script setup lang="ts">
const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()

const initials = computed(() => {
  const email = authStore.authUser?.email ?? ''
  return email.charAt(0).toUpperCase() || 'A'
})

const displayEmail = computed(() => authStore.authUser?.email ?? '')
const displayName = computed(() =>
  authStore.profile?.name ?? displayEmail.value.split('@')[0] ?? 'Admin',
)
</script>

<template>
  <header class="flex h-[52px] shrink-0 items-center gap-3 border-b border-[--color-border] bg-[--color-surface] px-4">
    <!-- Hamburger (mobile only) -->
    <button
      type="button"
      class="rounded-md p-1.5 text-[--color-fg-muted] hover:bg-[--color-hover] transition-colors lg:hidden"
      @click="emit('toggle-sidebar')"
    >
      <IconMenu :size="20" />
    </button>

    <!-- Search bar -->
    <div class="flex h-8 max-w-[260px] flex-1 items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-surface-2] px-3">
      <IconSearch :size="14" class="shrink-0 text-[--color-fg-subtle]" />
      <span class="flex-1 text-xs text-[--color-fg-subtle]">Search...</span>
      <kbd class="rounded bg-[--color-border] px-1 py-0.5 text-[9px] text-[--color-fg-subtle]">⌘F</kbd>
    </div>

    <div class="flex-1" />

    <!-- Icon buttons -->
    <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:bg-[--color-hover] transition-colors">
      <IconMail :size="14" />
    </button>
    <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg border border-[--color-border] bg-[--color-surface-2] text-[--color-fg-muted] hover:bg-[--color-hover] transition-colors">
      <IconBell :size="14" />
    </button>

    <!-- Divider -->
    <div class="h-5 w-px bg-[--color-border]" />

    <!-- Avatar + user info -->
    <div class="flex items-center gap-2">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[--color-accent] to-[--color-teal-dark] text-xs font-bold text-white">
        {{ initials }}
      </div>
      <div class="hidden flex-col leading-tight sm:flex">
        <span class="text-xs font-semibold text-[--color-fg]">{{ displayName }}</span>
        <span class="text-[10px] text-[--color-fg-subtle]">{{ displayEmail }}</span>
      </div>
    </div>
  </header>
</template>
```

- [ ] **Verify:** `npm run dev` — topbar shows search bar, icons, avatar with first letter of email.

- [ ] **Commit:**
```bash
git add src/components/The/Topbar.vue
git commit -m "feat: redesign Topbar with search, icon buttons, user avatar"
```

---

## Task 9: Update layouts/MainLayout.vue

**File:** `src/layouts/MainLayout.vue`

Switch from fixed-sidebar + padding-left approach to a proper flex layout. Remove the `routeTitle` computed and `#title` slot (Topbar no longer uses them). Sidebar width updated from 240px → 210px. Main `<RouterView />` wrapped without padding — pages own their padding.

- [ ] **Replace entire file:**

```vue
<script setup lang="ts">
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-[--color-bg]">
    <!-- Mobile backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="closeSidebar"
    />

    <!-- Sidebar: fixed on mobile, flex child on lg -->
    <TheSidebar
      :open="sidebarOpen"
      class="fixed left-0 top-0 z-50 h-full w-[210px] -translate-x-full transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:shrink-0"
      :class="{ 'translate-x-0': sidebarOpen }"
      @close="closeSidebar"
    />

    <!-- Right column: topbar + main -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <TheTopbar @toggle-sidebar="toggleSidebar" />
      <main class="flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>
  </div>
</template>
```

- [ ] **Verify:** `npm run dev` — layout works, sidebar slides in on mobile, pages are visible.

- [ ] **Commit:**
```bash
git add src/layouts/MainLayout.vue
git commit -m "feat: update MainLayout to flex layout, remove title slot"
```

---

## Task 10: Create Dashboard/DashboardRoutePanel.vue

**File:** `src/components/Dashboard/DashboardRoutePanel.vue`

Self-fetching. Groups today's deliveries by rider. Shows stop count + completion progress bar. "Unassigned" group for deliveries with no rider.

- [ ] **Create the file:**

```vue
<script setup lang="ts">
const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

interface RiderRoute {
  name: string
  total: number
  done: number
}

const routes = ref<RiderRoute[]>([])
const loading = ref(true)

onMounted(async () => {
  const deliveries = await listDeliverySales(todayDate)
  const map = new Map<string, RiderRoute>()

  for (const d of deliveries) {
    const key = d.rider?.full_name ?? 'Unassigned'
    const existing = map.get(key) ?? { name: key, total: 0, done: 0 }
    existing.total++
    if (d.status === 'completed' || d.status === 'booking_fulfilled') existing.done++
    map.set(key, existing)
  }

  routes.value = Array.from(map.values())
  loading.value = false
})
</script>

<template>
  <div>
    <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-[--color-fg]">Today's Routes</p>
    <BaseSpinner v-if="loading" size="sm" class="mx-auto" />
    <p v-else-if="routes.length === 0" class="text-xs text-[--color-fg-subtle]">No deliveries today</p>
    <div v-else class="space-y-2">
      <div v-for="r in routes" :key="r.name" class="rounded-lg bg-[--color-surface-2] p-2.5">
        <p class="text-xs font-semibold text-[--color-fg]">{{ r.name }}</p>
        <p class="mt-0.5 text-[10px] text-[--color-fg-subtle]">{{ r.total }} stops · {{ r.done }} done</p>
        <div class="mt-1.5 h-1 w-full rounded-full bg-[--color-border]">
          <div
            class="h-1 rounded-full bg-[--color-accent] transition-all"
            :style="{ width: r.total > 0 ? `${Math.round((r.done / r.total) * 100)}%` : '0%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/components/Dashboard/
git commit -m "feat: add DashboardRoutePanel component"
```

---

## Task 11: Create Dashboard/DashboardQuickActions.vue

**File:** `src/components/Dashboard/DashboardQuickActions.vue`

Static buttons only — no data fetching.

- [ ] **Create the file:**

```vue
<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <div>
    <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-[--color-fg]">Quick Actions</p>
    <div class="flex flex-col gap-1.5">
      <BaseButton variant="primary" size="sm" class="w-full justify-start" @click="router.push('/sales')">
        + New Sale
      </BaseButton>
      <BaseButton variant="ghost" size="sm" class="w-full justify-start" @click="router.push('/bookings')">
        + Add Booking
      </BaseButton>
      <BaseButton variant="ghost" size="sm" class="w-full justify-start" @click="router.push('/expenses')">
        + Log Expense
      </BaseButton>
      <BaseButton variant="ghost" size="sm" class="w-full justify-start" @click="router.push('/deliveries')">
        → View Deliveries
      </BaseButton>
    </div>
  </div>
</template>
```

- [ ] **Commit:**
```bash
git add src/components/Dashboard/DashboardQuickActions.vue
git commit -m "feat: add DashboardQuickActions component"
```

---

## Task 12: Create Dashboard/DashboardDeliveryList.vue

**File:** `src/components/Dashboard/DashboardDeliveryList.vue`

Accepts deliveries prop from parent. Status badge map defined internally.

- [ ] **Create the file:**

```vue
<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries'

const props = defineProps<{ deliveries: DeliverySaleRow[] }>()

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending_delivery: 'warning',
    completed: 'success',
    void: 'danger',
    booking_fulfilled: 'info',
  }
  return map[status] ?? 'default'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_delivery: 'Pending',
    completed: 'Delivered',
    void: 'Void',
    booking_fulfilled: 'Fulfilled',
  }
  return map[status] ?? status
}

const visible = computed(() => props.deliveries.slice(0, 8))
</script>

<template>
  <BaseCard padding="md">
    <template #action>
      <RouterLink
        v-if="deliveries.length > 8"
        to="/deliveries"
        class="text-xs text-[--color-accent] hover:underline"
      >View all →</RouterLink>
    </template>
    <template #default>
      <p class="mb-3 text-sm font-semibold text-[--color-fg]">Today's Deliveries</p>
      <p v-if="deliveries.length === 0" class="text-sm text-[--color-fg-subtle]">No deliveries today</p>
      <ul v-else class="space-y-2">
        <li
          v-for="d in visible"
          :key="d.id"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <div class="min-w-0 flex-1">
            <span class="truncate font-medium text-[--color-fg]">{{ d.customer?.name ?? '—' }}</span>
            <span class="ml-1.5 text-xs text-[--color-fg-subtle]">· {{ d.rider?.full_name ?? 'Unassigned' }}</span>
          </div>
          <BaseBadge :variant="statusVariant(d.status)" size="sm">{{ statusLabel(d.status) }}</BaseBadge>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>
```

- [ ] **Commit:**
```bash
git add src/components/Dashboard/DashboardDeliveryList.vue
git commit -m "feat: add DashboardDeliveryList component"
```

---

## Task 13: Create Dashboard/DashboardBookingList.vue

**File:** `src/components/Dashboard/DashboardBookingList.vue`

- [ ] **Create the file:**

```vue
<script setup lang="ts">
import type { BookingRow } from '@/services/bookings'

const props = defineProps<{ bookings: BookingRow[] }>()

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

function bookingVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    fulfilled: 'success',
    cancelled: 'danger',
  }
  return map[status] ?? 'default'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

const visible = computed(() => props.bookings.slice(0, 8))
</script>

<template>
  <BaseCard padding="md">
    <template #action>
      <RouterLink
        v-if="bookings.length > 8"
        to="/bookings"
        class="text-xs text-[--color-accent] hover:underline"
      >View all →</RouterLink>
    </template>
    <template #default>
      <p class="mb-3 text-sm font-semibold text-[--color-fg]">Upcoming Bookings</p>
      <p v-if="bookings.length === 0" class="text-sm text-[--color-fg-subtle]">No upcoming bookings</p>
      <ul v-else class="space-y-2">
        <li
          v-for="b in visible"
          :key="b.id"
          class="flex items-center justify-between gap-2 text-sm"
        >
          <div class="min-w-0 flex-1">
            <span class="tabular-nums text-xs text-[--color-fg-subtle]">{{ formatDate(b.scheduled_date) }}</span>
            <span class="ml-1.5 font-medium text-[--color-fg]">{{ b.customer?.name ?? '—' }}</span>
            <span class="ml-1 text-xs text-[--color-fg-subtle]">· {{ b.rider?.full_name ?? 'Unassigned' }}</span>
          </div>
          <BaseBadge :variant="bookingVariant(b.status)" size="sm">{{ b.status }}</BaseBadge>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>
```

- [ ] **Commit:**
```bash
git add src/components/Dashboard/DashboardBookingList.vue
git commit -m "feat: add DashboardBookingList component"
```

---

## Task 14: Update pages/dashboard.vue

**File:** `src/pages/dashboard.vue`

Full compose. Two new data loaders added (`loadWeeklyRevenue`, `loadWeeklyDeliveries`). Layout uses `flex h-full` with main column + right panel aside.

- [ ] **Replace entire file:**

```vue
<script setup lang="ts">
import { supabase } from '@/helpers/supabase'
import { formatMoney } from '@/helpers/money'
import type { DeliverySaleRow } from '@/services/deliveries'
import type { BookingRow } from '@/services/bookings'
import type { MaintenanceTask } from '@/types/database'

const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
const todayPlus3Date = (() => {
  const d = new Date(todayDate)
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
})()
const todayDisplay = new Date().toLocaleDateString('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

function getPast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(true)
const todayRevenue = ref(0)
const deliveries = ref<DeliverySaleRow[]>([])
const bookings = ref<BookingRow[]>([])
const maintenanceAlertCount = ref(0)
const weeklyRevenueLabels = ref<string[]>([])
const weeklyRevenueData = ref<number[]>([])
const weeklyDeliverySegments = ref<{ label: string; value: number; color: string }[]>([])

// ── Computed ──────────────────────────────────────────────────────────────────
const pendingDeliveries = computed(() =>
  deliveries.value.filter((d) => d.status === 'pending_delivery'),
)
const upcomingBookingCount = computed(() => bookings.value.length)
const deliveryCompletionLabel = computed(() => {
  const total = weeklyDeliverySegments.value.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return '0%'
  const done = weeklyDeliverySegments.value.find((s) => s.label === 'Completed')?.value ?? 0
  return `${Math.round((done / total) * 100)}%`
})

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadRevenue(): Promise<void> {
  const { data: sales } = await supabase
    .from('sales')
    .select('id')
    .eq('sale_date', todayDate)
    .eq('status', 'completed')
    .is('deleted_at', null)
  const saleIds = (sales ?? []).map((s: { id: string }) => s.id)
  if (saleIds.length === 0) { todayRevenue.value = 0; return }
  const { data: payments } = await supabase
    .from('sale_payments')
    .select('amount_centavos')
    .in('sale_id', saleIds)
  todayRevenue.value = (payments ?? []).reduce(
    (sum: number, p: { amount_centavos: number }) => sum + p.amount_centavos, 0,
  )
}

async function loadWeeklyRevenue(): Promise<void> {
  const days = getPast7Days()
  const { data: sales } = await supabase
    .from('sales')
    .select('id, sale_date')
    .gte('sale_date', days[0])
    .lte('sale_date', days[6])
    .eq('status', 'completed')
    .is('deleted_at', null)

  const saleDateMap: Record<string, string> = Object.fromEntries(
    (sales ?? []).map((s: { id: string; sale_date: string }) => [s.id, s.sale_date]),
  )
  const saleIds = Object.keys(saleDateMap)
  const dayTotals: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]))

  if (saleIds.length > 0) {
    const { data: payments } = await supabase
      .from('sale_payments')
      .select('sale_id, amount_centavos')
      .in('sale_id', saleIds)
    for (const p of payments ?? []) {
      const date = saleDateMap[p.sale_id as string]
      if (date) dayTotals[date] += p.amount_centavos as number
    }
  }

  weeklyRevenueLabels.value = days.map((d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'short' }),
  )
  weeklyRevenueData.value = days.map((d) => Math.round(dayTotals[d] / 100))
}

async function loadWeeklyDeliveries(): Promise<void> {
  const days = getPast7Days()
  const results = await Promise.all(days.map((d) => listDeliverySales(d)))
  const all = results.flat()
  weeklyDeliverySegments.value = [
    { label: 'Completed', value: all.filter((d) => d.status === 'completed' || d.status === 'booking_fulfilled').length, color: '#00C9F0' },
    { label: 'Pending',   value: all.filter((d) => d.status === 'pending_delivery').length, color: '#F59E0B' },
    { label: 'Void',      value: all.filter((d) => d.status === 'void').length, color: '#CBD5E1' },
  ]
}

async function loadDeliveries(): Promise<void> {
  deliveries.value = await listDeliverySales(todayDate)
}

async function loadBookings(): Promise<void> {
  bookings.value = await listBookings({ from: todayDate, to: todayPlus3Date, status: 'pending' })
}

async function loadMaintenance(): Promise<void> {
  const [plantTasks, vehicleTasks] = await Promise.all([listTasks('water_plant'), listTasks('vehicle')])
  const allTasks: MaintenanceTask[] = [...plantTasks, ...vehicleTasks]
  maintenanceAlertCount.value = allTasks.filter(
    (t) => t.next_due_at !== null && t.next_due_at < todayDate,
  ).length
}

const router = useRouter()

onMounted(async () => {
  try {
    await Promise.all([
      loadRevenue(),
      loadWeeklyRevenue(),
      loadWeeklyDeliveries(),
      loadDeliveries(),
      loadBookings(),
      loadMaintenance(),
    ])
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="flex h-full items-center justify-center">
    <BaseSpinner size="lg" />
  </div>

  <div v-else class="flex h-full overflow-hidden">
    <!-- Main content -->
    <div class="flex-1 overflow-y-auto p-4 lg:p-6">
      <div class="space-y-5">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-[--color-fg]">Dashboard</h1>
            <p class="text-sm text-[--color-fg-subtle]">{{ todayDisplay }} · Manage your operations at a glance</p>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton variant="primary" size="md" @click="router.push('/sales')">
              <IconPlus :size="14" /> New Sale
            </BaseButton>
            <BaseButton variant="secondary" size="md" @click="router.push('/deliveries')">
              View Deliveries
            </BaseButton>
          </div>
        </div>

        <!-- KPI row -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <BaseKpiCard variant="hero" label="Today's Revenue" :value="formatMoney(todayRevenue)" sub="Completed sales today">
            <template #icon><IconMoney :size="18" class="text-white" /></template>
          </BaseKpiCard>
          <BaseKpiCard
            :variant="pendingDeliveries.length > 0 ? 'warning' : 'default'"
            label="Pending Deliveries"
            :value="pendingDeliveries.length"
            sub="Awaiting delivery today"
            to="/deliveries"
          >
            <template #icon><IconDeliveries :size="18" class="text-[--color-accent]" /></template>
          </BaseKpiCard>
          <BaseKpiCard label="Upcoming Bookings" :value="upcomingBookingCount" sub="Bookings in next 3 days" to="/bookings">
            <template #icon><IconBookings :size="18" class="text-[--color-accent]" /></template>
          </BaseKpiCard>
          <BaseKpiCard
            :variant="maintenanceAlertCount > 0 ? 'danger' : 'default'"
            label="Maintenance Alerts"
            :value="maintenanceAlertCount"
            sub="Tasks overdue"
            to="/maintenance"
          >
            <template #icon><IconMaintenance :size="18" class="text-[--color-accent]" /></template>
          </BaseKpiCard>
        </div>

        <!-- Charts row -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BaseCard padding="md">
            <BaseBarChart title="Revenue — Past 7 Days" :labels="weeklyRevenueLabels" :data="weeklyRevenueData" />
          </BaseCard>
          <BaseCard padding="md">
            <BaseDonutChart
              title="Deliveries — Past 7 Days"
              :segments="weeklyDeliverySegments"
              :center-label="deliveryCompletionLabel"
            />
          </BaseCard>
        </div>

        <!-- Lists row -->
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DashboardDeliveryList :deliveries="deliveries" />
          <DashboardBookingList :bookings="bookings" />
        </div>
      </div>
    </div>

    <!-- Right panel (desktop only) -->
    <aside class="hidden w-[200px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-[--color-border] bg-[--color-surface] p-3 lg:flex">
      <DashboardRoutePanel />
      <DashboardQuickActions />
    </aside>
  </div>
</template>
```

- [ ] **Verify:** `npm run dev` — dashboard shows KPI cards, two charts, delivery + booking lists, right panel with routes + quick actions.

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/pages/dashboard.vue
git commit -m "feat: redesign dashboard with charts, KPI cards, right panel"
```

---

## Task 15: Inner Pages — Page Header Pattern + Layout Fix

All inner pages need two changes:
1. Root `<div>` gains `h-full overflow-y-auto p-4 lg:p-6` (since MainLayout's `<main>` no longer adds padding)
2. Page header `<h1>` updated to `text-2xl font-bold` + subtitle line

Apply these changes to each file. The data/logic sections are untouched.

**Pattern:** Replace the existing root `<template>` structure:
```html
<!-- BEFORE -->
<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-[--color-fg]">PageTitle</h1>
      <BaseButton ...>Action</BaseButton>
    </div>
    ...content...
  </div>
</template>
```

```html
<!-- AFTER -->
<template>
  <div class="h-full overflow-y-auto p-4 lg:p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-[--color-fg]">PageTitle</h1>
          <p class="text-sm text-[--color-fg-subtle]">Subtitle text</p>
        </div>
        <BaseButton ...>Action</BaseButton>
      </div>
      ...content...
    </div>
  </div>
</template>
```

- [ ] **Update `src/pages/customers/index.vue`:**
  - Outer div: `<div class="h-full overflow-y-auto p-4 lg:p-6"><div class="space-y-4">`
  - h1: `class="text-2xl font-bold text-[--color-fg]"` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Manage customer accounts and delivery addresses</p>`
  - Close the extra wrapper div before `</template>`

- [ ] **Update `src/pages/customers/[id].vue`:**
  - Same outer wrapper pattern
  - h1: `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Customer profile and order history</p>`

- [ ] **Update `src/pages/sales/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Record and manage walk-in and delivery sales</p>`

- [ ] **Update `src/pages/deliveries/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Track and manage all delivery orders</p>`

- [ ] **Update `src/pages/bookings/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Schedule and manage customer bookings</p>`

- [ ] **Update `src/pages/products/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Manage products and pricing</p>`

- [ ] **Update `src/pages/areas/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Manage delivery areas and coverage zones</p>`

- [ ] **Update `src/pages/employees/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Manage staff accounts and roles</p>`

- [ ] **Update `src/pages/employees/[id].vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Employee profile and payroll</p>`

- [ ] **Update `src/pages/maintenance/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Track maintenance schedules for plant and vehicles</p>`

- [ ] **Update `src/pages/vehicles/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Manage fleet vehicles and assignments</p>`

- [ ] **Update `src/pages/expenses/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Track and categorize operational expenses</p>`

- [ ] **Update `src/pages/settings/index.vue`:**
  - Outer wrapper, h1 `text-2xl font-bold` + subtitle: `<p class="text-sm text-[--color-fg-subtle]">Configure tenant settings and preferences</p>`

- [ ] **Verify all pages:** `npm run dev` — navigate to each page, confirm header renders correctly, content is scrollable, no layout overflow.

- [ ] **Verify:** `npm run type-check` — 0 errors.

- [ ] **Commit:**
```bash
git add src/pages/
git commit -m "feat: apply consistent page header pattern to all inner pages"
```
