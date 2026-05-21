# WRS Admin — Full App Redesign Spec

**Date:** 2026-05-16
**Status:** Approved
**Reference:** Donezo dashboard (provided screenshot)

---

## Overview

Redesign the entire WRS Admin Portal UI following the Donezo dashboard structure. Keep existing teal brand (`#00C9F0`). Keep all data logic, services, stores, and composables untouched. Only presentation layer changes.

**Approach:** All-at-once. Component specs are defined first. Pages are built by composing those components. Every page edit propagates through shared components automatically (DRY/KISS/SOLID).

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Color brand | Keep teal `#00C9F0` | Existing brand identity |
| Layout structure | Donezo: sidebar + topbar + main + right panel | Reference design |
| Active nav state | Teal bg + teal text, **no border indicator** | User preference |
| Scope | Full structural match | Dashboard charts + right panel included |
| Icons | Hand-rolled `IconXxx.vue` in `components/Icon/` | No external library, keep lean |
| Charts | `vue-chartjs` + `chart.js` (already installed) | Too complex to build from scratch |
| No new packages | Only `vue-chartjs`/`chart.js` already present | Keep deps minimal |
| Inline SVGs | **Forbidden everywhere** | All SVGs live in `Icon/` components only |

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (210px)  │  Topbar (full width, 52px tall)     │
│                   ├────────────────────────┬────────────│
│  Logo             │  Main content area     │ Right      │
│  Nav items        │  (page header + body)  │ panel      │
│  General section  │                        │ (200px)    │
│  Footer           │                        │            │
└───────────────────┴────────────────────────┴────────────┘
```

- **Sidebar**: white bg, `border-r`, fixed 210px, scrollable nav
- **Topbar**: white bg, `border-b`, 52px, spans main + right panel columns
- **Main content**: scrollable, `p-4`, `gap-3` flex column
- **Right panel**: white bg, `border-l`, fixed 200px, only on dashboard; absent on inner pages
- Right panel is **dashboard-only** — inner pages use full-width main content

---

## CSS Tokens

No new tokens needed. Existing `main.css` tokens are sufficient. Key tokens used throughout:

| Token | Value | Usage |
|---|---|---|
| `--color-accent` | `#00C9F0` | Active nav, hero card bg, chart bars, buttons |
| `--color-accent-soft` | `rgba(0,201,240,0.10)` | Active nav bg, KPI icon bg |
| `--color-bg` | `#F1F5F9` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, sidebar, topbar |
| `--color-border` | `#E2E8F0` | All dividers |
| `--color-fg` | `#0A0E1A` | Headings, values |
| `--color-fg-muted` | `#475569` | Body text |
| `--color-fg-subtle` | `#94A3B8` | Labels, sub-text |

---

## Component Specs

### Rule: Component-first

Every piece of UI that appears in more than one place, or that has meaningful internal logic, is a component. Pages are thin composers — they load data and pass props down. No inline SVGs anywhere.

---

### Icon Components — `src/components/Icon/`

**Contract:** Every icon component accepts `size?: number` (default `20`) and `class?: string`. Template renders a single `<svg>` with `stroke="currentColor"`.

**No external icon library.** SVG paths are copied from Heroicons outline set (MIT license).

| Component | SVG source | Used in |
|---|---|---|
| `IconDashboard.vue` | 4 squares grid | Sidebar |
| `IconCustomers.vue` | Two users | Sidebar |
| `IconSales.vue` | Activity/polyline | Sidebar |
| `IconDeliveries.vue` | Truck | Sidebar, KPI card |
| `IconBookings.vue` | Calendar | Sidebar, KPI card |
| `IconProducts.vue` | Package box | Sidebar |
| `IconAreas.vue` | Map | Sidebar |
| `IconEmployees.vue` | Single user | Sidebar |
| `IconMaintenance.vue` | Wrench | Sidebar, KPI card |
| `IconVehicles.vue` | Car/truck variant | Sidebar |
| `IconExpenses.vue` | Receipt/dollar | Sidebar |
| `IconSettings.vue` | Gear/cog | Sidebar |
| `IconSearch.vue` | Magnifier | Topbar |
| `IconBell.vue` | Bell | Topbar |
| `IconMail.vue` | Envelope | Topbar |
| `IconMoney.vue` | Dollar sign | KPI: Revenue card |
| `IconArrowUpRight.vue` | Diagonal arrow | KPI card link |
| `IconPlus.vue` | Plus | Buttons |
| `IconX.vue` | X / close | Sidebar mobile close |
| `IconBuilding.vue` | Building (exists) | Keep, no change |
| `IconCheck.vue` | Check (exists) | Keep, no change |

`src/components/Icon/index.ts` — re-exports all icon components.

---

### Shell Components

#### `The/Sidebar.vue`

**Props:** `open: boolean`
**Emits:** `close`

Nav items defined as array of `{ label, to, icon: Component }` where `icon` is an imported `IconXxx` component. Rendered via `<component :is="item.icon" :size="16" />`.

Active state class (when `route.path.startsWith(to)`):
```
bg-[--color-accent-soft] text-[--color-accent] font-medium
```
No `border-l` or `border-r` on the active item.

Sections: **MENU** (11 items) and **GENERAL** (Settings). Footer shows version string.

Mobile: overlay drawer controlled by `open` prop. `<IconX />` close button visible when `open`.

#### `The/Topbar.vue`

**Props:** none. Reads `authStore.user` directly.

Structure (left → right):
1. Search bar — `bg-[--color-surface-2]`, `border`, rounded-lg, `<IconSearch />` + placeholder "Search..." + `⌘F` kbd chip. Non-functional (UI only).
2. Spacer (`flex-1`)
3. `<IconMail />` icon button
4. `<IconBell />` icon button
5. Avatar circle — initials from `authStore.user.email`, teal gradient bg
6. User name + email — from `authStore.user`

---

### Base Components — New

#### `Base/BaseKpiCard.vue`

Single source of truth for all KPI stat cards.

**Props:**
```ts
variant: 'hero' | 'default' | 'warning' | 'danger'  // default: 'default'
label: string
value: string | number
sub?: string
to?: string   // if set, entire card is clickable, navigates to route
```

**Slots:** `icon` — renders any `IconXxx` component passed in.

**Variant styles:**
- `hero` — teal gradient bg, white text, white/20 icon bg
- `default` — white bg, `--color-fg` value
- `warning` — white bg, `--color-warning` value color
- `danger` — white bg, `--color-negative` value color

Icon container always `rounded-lg w-9 h-9 flex items-center justify-center`.

#### `Base/BaseBarChart.vue`

Thin wrapper over `vue-chartjs` `Bar` component.

**Props:**
```ts
labels: string[]
data: number[]
title?: string
height?: number  // default: 180
```

Chart.js options baked in: teal bars (`--color-accent`), no legend, subtle grid lines (`--color-border`), responsive, no animation on re-render after mount. Caller passes pre-formatted label strings (e.g. `"Mon"`, `"Tue"`).

#### `Base/BaseDonutChart.vue`

Thin wrapper over `vue-chartjs` `Doughnut` component.

**Props:**
```ts
segments: { label: string; value: number; color: string }[]
title?: string
centerLabel?: string  // shown in donut hole via CSS overlay
```

Renders legend beside the donut (flex row layout). Each legend row: colored dot + label + value count.

---

### Base Components — Updated

#### `Base/BaseCard.vue`

- **Remove** `kpi` variant — replaced by `BaseKpiCard`.
- **Keep** `default` and `hero` variants.
- **Add** `title` prop (optional) — renders card header with title text.
- **Add** `#action` slot — renders top-right of card header (e.g. "View all →" link).

#### `Base/BaseButton.vue`

- **Add** `ghost` variant — transparent bg, teal text, teal border on hover.
- **Add** `#icon` slot — renders before label, handles spacing.
- Existing `primary`, `secondary`, `danger` variants unchanged.

#### `Base/BaseTable.vue`

- Update `<th>` styles: `text-[--color-fg-subtle] text-xs font-semibold uppercase tracking-wide`.
- Update `<tr>` hover: `hover:bg-[--color-surface-2]`.
- No structural changes — slot API unchanged.

---

### Dashboard Components — New

All live in `src/components/Dashboard/`. Only used by `pages/dashboard.vue`.

#### `Dashboard/DashboardRoutePanel.vue`

**Props:** none. Self-fetching.

On mount: calls `listDeliverySales(today)`. Groups results by `rider.full_name` (or "Unassigned"). For each rider, shows: name, `X stops · Y done`, progress bar (`completed / total * 100%`).

Progress bar: `bg-[--color-border]` track, `bg-[--color-accent]` fill, `h-1 rounded-full`.

#### `Dashboard/DashboardQuickActions.vue`

**Props:** none. No data fetching.

Renders 4 buttons using `BaseButton`:
- `+ New Sale` → `router.push('/sales')` (primary variant)
- `+ Add Booking` → `router.push('/bookings')` (ghost variant)
- `+ Log Expense` → `router.push('/expenses')` (ghost variant)
- `→ View Deliveries` → `router.push('/deliveries')` (ghost variant)

#### `Dashboard/DashboardDeliveryList.vue`

**Props:** `deliveries: DeliverySaleRow[]`

Renders list of up to 8 deliveries. Each row: customer name + rider name + `BaseBadge` status. "View all →" link if `deliveries.length > 8`. Empty state if empty. Status badge variants defined internally (same map as current `dashboard.vue`).

#### `Dashboard/DashboardBookingList.vue`

**Props:** `bookings: BookingRow[]`

Renders list of up to 8 bookings. Each row: formatted date + customer name + rider + `BaseBadge` status. "View all →" link if `bookings.length > 8`. Date formatting via existing `helpers/date.ts` or inline `toLocaleDateString`.

---

## Page Structure

### `pages/dashboard.vue` — Full Redesign

Layout: 3-column shell (sidebar + main + right panel).

Main content column:
```
Page header (title + date + action buttons)
KPI row (4x BaseKpiCard, 2-col on mobile, 4-col on lg)
Charts row (BaseBarChart + BaseDonutChart, 2-col)
Lists row (DashboardDeliveryList + DashboardBookingList, 2-col on lg)
```

Right panel (always visible on lg+, hidden on mobile):
```
DashboardRoutePanel
DashboardQuickActions
```

Data loading stays in `dashboard.vue` — `loadRevenue`, `loadDeliveries`, `loadBookings`, `loadMaintenance` unchanged. New: `loadWeeklyRevenue` (7-day revenue for bar chart) and `loadWeeklyDeliveries` (7-day delivery counts for donut chart).

### Inner Pages — Aesthetic Only

All 11 inner pages (`customers`, `sales`, `deliveries`, `bookings`, `products`, `areas`, `employees`, `maintenance`, `vehicles`, `expenses`, `settings`) get:

1. Page header pattern: `<h1>` title + subtitle text + action button(s) — consistent across all pages.
2. Updated `BaseTable`, `BaseCard`, `BaseButton` styles (inherited automatically from updated base components).
3. No right panel — full-width main content.
4. No data logic changes.

Detail pages (`customers/[id].vue`, `employees/[id].vue`) follow same page header pattern.

---

## MainLayout Update

`layouts/MainLayout.vue` restructured to support right panel slot:

```
<div class="flex h-screen overflow-hidden">
  <Sidebar />
  <div class="flex flex-col flex-1 overflow-hidden">
    <Topbar />
    <div class="flex flex-1 overflow-hidden">
      <main class="flex-1 overflow-y-auto p-4">
        <slot />
      </main>
      <aside v-if="$slots.panel" class="w-[200px] border-l overflow-y-auto bg-surface">
        <slot name="panel" />
      </aside>
    </div>
  </div>
</div>
```

`dashboard.vue` uses `<template #panel>` to inject the right panel. All other pages use the default slot only — the aside disappears automatically when panel slot is unused.

---

## Execution Order

Build in this order so each step is testable:

1. **Icon components** — all 19 `IconXxx.vue` files + update `Icon/index.ts`
2. **Base component updates** — `BaseCard`, `BaseButton`, `BaseTable`
3. **New Base components** — `BaseKpiCard`, `BaseBarChart`, `BaseDonutChart`
4. **Shell** — `The/Sidebar.vue`, `The/Topbar.vue`
5. **MainLayout** — add panel slot
6. **Dashboard widget components** — `Dashboard/*`
7. **`pages/dashboard.vue`** — compose everything
8. **Inner pages** — page header pattern + any component updates

---

## Out of Scope

- Search functionality (topbar search is UI-only placeholder)
- Notifications (bell + mail icons are UI-only)
- Dark mode
- Mobile-specific layout changes beyond existing responsive behavior
- Any backend / service / store changes
