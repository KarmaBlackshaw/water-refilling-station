# Plan — InsightHub-style Dashboard Redesign

**Date:** 2026-05-18
**Source design:** Provided image (InsightHub dashboard mockup)
**Target:** `src/pages/dashboard.vue` + supporting layout/components
**Domain mapping:** Generic InsightHub → Water Refilling Station (WRS)

> Goal: replicate image's visual structure, hierarchy, spacing, color rhythm, and component composition **exactly** while preserving WRS data semantics (revenue, deliveries, bookings, riders, maintenance).

---

## 1. Visual audit of source image

Top-to-bottom, left-to-right:

| Region | What is shown |
|---|---|
| Sidebar (left, ~220px) | Logo + product name. "Dashboard" subtitle. Active item = filled pill, blue (`Dashboard`). Nav items: Dashboard, Inboxs, Performances, **Projects (expanded)** → Active Project · Project Done · Project On Hold (each with colored dot). Employe Task, Absence, Analytics, Client List, Notification (red dot pill), Help Center. |
| Topbar | Avatar circle (photo) + "Hey, Markus" + "Sunday, June 25, 2024" subtitle. Right: search input pill, gear icon button, bell icon button. |
| Greeting / Alert banner | Rounded white card, left avatar tile (dark with bell), title "Dear Manager", body "We have observed a decline in [Hermawan]'s performance over the past 2 weeks." with `[Hermawan]` as blue pill. Right: blue "View Detail" pill button. |
| KPI row (4 cards) | Each = icon tile (gray), label (small gray), big number, fullscreen-expand icon top-right. Cards: Active Employees `547`, Number of Projects `339`, Number of Task `147`, Target Percentage Completed `89.75%`. |
| Left column — On Going Task (card) | Title + subtitle. Top-right: search/filter icons. Rows: brand avatar (colored circle initials/logo), project name, sub label, status row (`Status: On Going`), Presentation `%`, Due Date, **avatar stack** (3 overlapping circles + `+N`). Three rows: Journey Scarves / Edifier / Ugreen / CNN. |
| Right column — Graphs and Analysis (card) | Title + subtitle. Right: "Month" dropdown + download icon. Vertical bar chart Jan–Sep. **Selected bar (Mei)** is taller, colored deep blue with floating tooltip (3-line legend with colored dots and values: 137 / 123 / 84). Other bars = light blue. |
| Right column — Top Performance (card, below chart) | Title + "Augustus" dropdown + download icon. 4 photo cards (1st/2nd/3rd/4th) — each = rounded photo with rank pill + name below. |

Color palette in image:
- Page bg: very light cool gray
- Cards: pure white, ~12px radius, soft shadow
- Primary action / active: vivid blue `~#2563EB`-ish
- Accent secondary on bars: deep navy + light blue gradient feel
- Status dots: green / orange / red / blue
- Avatars: solid color rings (purple, orange, red, gray)

WRS token mapping (uses existing tokens in `src/assets/main.css`):
- Primary blue → keep WRS brand: `turquoise-stone` (#00C9F0) + `cerulean` (#00A8CC) gradient (already used in sidebar logo + KPI hero)
- Page bg → `american-diamond` (already)
- Card bg → `full-white`
- Card border → `sparkling-silver`
- Muted text → `oslo`
- Strong text → `casual-navy`
- Status dots: green `dark-green-turquoise`, amber `strong-amber`, red `blaze-red`, blue `bondi-blue`

---

## 2. Domain mapping (InsightHub → WRS)

Keep image's information density and layout exactly. Re-label content:

| Image element | WRS equivalent | Data source |
|---|---|---|
| "Hey, Markus" | "Hey, {first_name}" | `authStore.profile.full_name` |
| "Sunday, June 25, 2024" | Today (Asia/Manila long format) | already in `dashboard.vue` `todayDisplay` |
| Alert banner ("decline in [Hermawan]'s performance") | Maintenance / overdue alert: "Overdue maintenance on [Rider Pickup-01]" — or, when none: "Pending delivery from [Customer Name]" | derived from `loadMaintenance`, `pendingDeliveries` |
| KPI: Active Employees `547` | **Active Customers** (or active riders) | new query: `customers.count where deleted_at is null` |
| KPI: Number of Projects `339` | **Pending Deliveries** | existing `pendingDeliveries.length` |
| KPI: Number of Task `147` | **Upcoming Bookings (3d)** | existing `upcomingBookingCount` |
| KPI: Target Percentage Completed `89.75%` | **Weekly Delivery Completion %** | existing `deliveryCompletionLabel` (re-cast as number) |
| On Going Task list | **Today's Deliveries** — show customer name + area + status + completion % + due date + avatar stack of items | existing `deliveries` array |
| Avatar stack on each row | Up to 3 product/item thumbnails for that delivery (round/slim/etc.) + `+N` | from delivery `items` (if loaded) — else show rider avatar + customer initials |
| Bar chart Jan–Sep | **Revenue — last 9 months** OR keep 7-day with bar-of-the-day highlighted | new monthly aggregator OR reuse `loadWeeklyRevenue` and render with highlighted "today" bar |
| Tooltip 3 stats on selected bar | Bookings done / In progress / On hold per month → in WRS: Completed / Pending / Void counts for that bucket | derived from sales/deliveries |
| Top Performance 1st–4th | **Top Riders this month** by delivery count | new query on `delivery_sales group by rider_id` |
| Sidebar nested "Projects" (Active/Done/On Hold) | Nested **Deliveries** (Pending / Completed / Void) — links to `/deliveries?status=…` | static |
| Sidebar "Notification" with red dot | Existing nav item + dot counter (overdue maintenance) | `maintenanceAlertCount` |

Any image element with no WRS equivalent (e.g. "Inboxs", "Absence", "Analytics", "Client List", "Help Center") is **dropped** — keep current WRS sidebar set (Dashboard / Customers / Sales / Deliveries / Bookings / Products / Areas / Employees / Maintenance / Vehicles / Expenses / Settings) but adopt the image's *visual treatment*: section headers ("Menu" / "General"), nested submenu with colored dots, active = filled pill.

---

## 3. Component-by-component plan

### 3.1 `src/layouts/MainLayout.vue` — adjust spacing only

- Wrap `<main>` in `p-4` so dashboard content sits inside the airy white frame seen in image.
- Page bg already `american-diamond`. No change.

### 3.2 `src/components/The/Sidebar.vue` — nested nav + active pill

Add to existing file:

- Convert flat array into typed structure supporting children:
  ```ts
  type NavItem = { label: string; to: string; icon: Component; dot?: string; badge?: number; children?: NavItem[] };
  ```
- For `Deliveries` add children:
  - Pending — dot `bg-strong-amber`
  - Completed — dot `bg-dark-green-turquoise`
  - Void — dot `bg-blaze-red`
  - Each links `to: '/deliveries?status=pending'` etc.
- Active item visual: **filled pill** `bg-turquoise-stone text-white shadow-sm` (image's selected Dashboard). Keep current subtle hover for inactive.
- Submenu expand: `ref<Set<string>>` keyed by parent label, persisted in `localStorage`. Auto-expand parent when child route active.
- Submenu visual: 1px left guide line in `sparkling-silver`, child rows `pl-9`, smaller text.
- Section headers `Menu` / `General` stay as-is.
- Notification row: red dot pill on the right using `maintenanceAlertCount` from a `useDashboardCounters()` composable (new — section 3.7).

No new icon files needed.

### 3.3 `src/components/The/Topbar.vue` — greeting + avatar-left layout

Restructure: image shows avatar + greeting on the **left** (not right). Search bar moves toward center-right; icon buttons + (no user block) on the far right.

- Left cluster:
  - `<img>` round avatar 36×36 (fallback = initials block already in file). Source: `authStore.profile.avatar_url` (assume exists in profile — if not, keep gradient initials).
  - Column: `Hey, {firstName}` in `text-sm font-bold text-casual-navy`; `{todayLong}` in `text-xs text-oslo`.
- Center spacer.
- Right cluster:
  - Search pill (existing).
  - Gear button (new — `IconSettings`) — routes to `/settings`.
  - Bell button (existing `IconBell`) — opens notifications drawer (stub: console.log for now; out of scope).
- Drop the right-side avatar + email block (now lives on the left).
- Topbar height bump: `h-16` → `h-[72px]` to match image proportion.

Pass props from parent or read auth store directly (already does). Add `firstName` computed: split `full_name` first token.

### 3.4 New: `src/components/Dashboard/DashboardGreetingBanner.vue`

- Layout: `flex items-center gap-3 rounded-2xl border border-sparkling-silver bg-full-white p-4 shadow-card`.
- Left icon tile: 40×40 `rounded-xl bg-casual-navy text-white` with `IconBell`.
- Middle: title `Dear Manager` `text-sm font-semibold text-casual-navy`; body `text-xs text-oslo` with a `<span class="rounded-md bg-turquoise-stone/10 text-turquoise-stone px-1.5 py-0.5 font-medium">{name}</span>` pill inline.
- Right: `<BaseButton variant="primary" size="sm">View Detail</BaseButton>` linking to relevant page.
- Prop: `{ title: string; body: string; highlight?: string; to?: string }`. Parent composes body from dashboard state.

### 3.5 `src/components/Base/BaseKpiCard.vue` — minor adjustments

- Add optional `expandable?: boolean` prop. When true, render a small `Maximize` icon (new `IconMaximize` — 4 corner arrows) in the top-right instead of/in addition to the existing `IconArrowUpRight`.
- Add `iconTone?: 'gray' | 'turquoise'` — image uses neutral gray tiles (`bg-sparkling-silver/60`) for all 4 KPIs. Default behavior preserved.
- Big number stays `num text-3xl font-bold`.
- Drop the `sub` line for the image-matching KPIs (the image has no sub-text on the four KPIs) — but **keep prop**; just pass nothing in dashboard.

Action: add new icon `src/components/Icon/IconMaximize.vue` (simple 4-corner svg).

### 3.6 New: `src/components/Dashboard/DashboardTaskList.vue` (replaces `DashboardDeliveryList.vue` usage)

Row anatomy per image:
```
[brand circle 40px]  [name + sub]                                                  [avatar stack]
                     [status pill]  [Presentation N%]  [Due Date M, d Y]
```
- Card header: title "Today's Deliveries" + subtitle "Active routes for today" + right icons (search, filter — stubs).
- Brand circle = colored avatar derived from customer name (hash → palette of 4 brand colors mirroring image: indigo, orange, green, red).
- Status pill: small badge in green/orange/red.
- "Presentation %" → "Progress %" = items delivered / items ordered for that delivery (0 if not started; 100 if completed; partial computed if multi-line). Falls back to "—" if items not loaded.
- Due Date: from `delivery.due_at` (or `created_at` if `due_at` null), formatted `MMM d, yyyy`.
- Avatar stack: up to 3 round 24px circles + `+N` badge — items thumbnails or initials. If item images not yet wired, render initial circles per product line.
- Empty state: keep current "No deliveries today".
- Use `BaseCard padding="md"` for the wrapper.

Props: `{ deliveries: DeliverySaleRow[] }`.

### 3.7 New composable: `src/composables/useDashboardCounters.ts`

Single source for sidebar badges + KPI counts. Methods: `activeCustomerCount`, `pendingDeliveryCount`, `upcomingBookingCount`, `maintenanceAlertCount`. Wraps `useAsync`. Exported so Sidebar can read overdue maintenance independently of Dashboard page.

### 3.8 `src/components/Base/BaseBarChart.vue` — selected-bar tooltip

Existing chart needs to mimic image's chart:
- Bars: light blue (`turquoise-stone/30`) baseline.
- One bar (current period — e.g. current month or today) rendered with a vertical **gradient** from `casual-navy` top to `turquoise-stone` bottom.
- Floating tooltip on the selected bar showing 3 stats with colored dots — implemented as an absolutely-positioned `<div>` on top of the highlighted bar:
  - Completed (cyan dot) — value
  - Pending (light cyan dot) — value
  - Void (gray dot) — value
- Month dropdown above the chart (`<BaseSelect>`): switches the aggregation window (`This year` / `Last year` — for scope, hardcode to "This year" and stub the dropdown).
- Download icon button next to dropdown (stub: triggers `console.log` for now, file ticket for CSV export).

Props additions: `{ highlightIndex?: number; tooltip?: { label: string; value: number; color: string }[] }`. If using Chart.js (per `chart.js` + `vue-chartjs` deps), implement gradient via dataset `backgroundColor` callback and tooltip via custom Chart.js plugin OR overlay div positioned by computed bar geometry. Prefer overlay div — simpler and matches the floating card visual.

### 3.9 New: `src/components/Dashboard/DashboardTopPerformance.vue`

- Card header: "Top Performance" + subtitle "Best performing employee ranking." + `Augustus` dropdown (month picker — stub current month) + download icon.
- Body: 4 photo cards in `grid-cols-4 gap-3`.
  - Each = `rounded-2xl` photo `aspect-[4/5]` with `bg-cover` (rider photo from `employees.avatar_url`). Falls back to initials gradient block.
  - Rank pill overlay top-left: `1st / 2nd / 3rd / 4th` in white text on `bg-casual-navy/80 rounded-pill px-2 py-0.5 text-[10px]`.
  - Name underneath outside the photo, `text-xs font-medium text-casual-navy`.
- Data: `loadTopPerformers()` — queries `delivery_sales` joined to `riders`, groups by `rider_id`, counts where `status in ('completed','booking_fulfilled')` for the current month, takes top 4. Implement as new service method `services/deliveries.ts → listTopRiders(monthStart, monthEnd, limit = 4)`.

### 3.10 Replace `DashboardRoutePanel` + `DashboardQuickActions` (right aside)

Drop the right aside entirely. Image has no such panel — its right column is the chart + top performance card. Existing `DashboardRoutePanel.vue` and `DashboardQuickActions.vue` are removed from the page (files kept for now in case wanted later; do not delete in this plan).

---

## 4. New `dashboard.vue` skeleton (post-redesign)

```vue
<template>
  <div v-if="loading" class="flex h-full items-center justify-center">
    <BaseSpinner size="lg" />
  </div>

  <div v-else class="h-full overflow-y-auto p-4">
    <div class="space-y-4">
      <!-- 1. Greeting banner -->
      <DashboardGreetingBanner
        title="Dear Manager"
        :body="alertBody"
        :highlight="alertHighlight"
        :to="alertTo"
      />

      <!-- 2. KPI row -->
      <div class="grid grid-cols-4 gap-4">
        <BaseKpiCard expandable label="Active Customers" :value="activeCustomerCount">
          <template #icon><IconCustomers :size="18" class="text-independence" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable label="Pending Deliveries" :value="pendingDeliveries.length">
          <template #icon><IconDeliveries :size="18" class="text-independence" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable label="Upcoming Bookings" :value="upcomingBookingCount">
          <template #icon><IconBookings :size="18" class="text-independence" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable label="Weekly Completion" :value="deliveryCompletionLabel">
          <template #icon><IconCheck :size="18" class="text-independence" /></template>
        </BaseKpiCard>
      </div>

      <!-- 3. Two-column body -->
      <div class="grid grid-cols-2 gap-4">
        <DashboardTaskList :deliveries="deliveries" />

        <div class="space-y-4">
          <BaseCard padding="md">
            <BaseBarChart
              title="Graphs and Analysis"
              subtitle="Projects completed per month based on trends."
              :labels="monthlyLabels"
              :data="monthlyRevenueData"
              :highlight-index="currentMonthIndex"
              :tooltip="monthlyBreakdownTooltip"
            />
          </BaseCard>

          <DashboardTopPerformance :performers="topPerformers" />
        </div>
      </div>
    </div>
  </div>
</template>
```

Header (page title + buttons) **dropped** — the topbar greeting now plays that role per image. If the user wants to keep the "New Sale / View Deliveries" actions, they can move into the greeting banner's CTA or a corner of the KPI row; flag for confirmation in step 5.

---

## 5. Sequenced execution checklist

Run in order. Each step is independently testable.

1. **Tokens / icons**
   1. Add `IconMaximize.vue` (4-corner arrows svg, 14px stroke).
   2. Add `IconFilter.vue` (sliders icon for task list header).
   3. Add `IconDownload.vue` (down-arrow into tray).
   4. Register all 3 in `src/components/Icon/index.ts`.

2. **Topbar redesign** ([Topbar.vue](src/components/The/Topbar.vue))
   1. Move avatar + greeting to left.
   2. Replace right-side identity block with gear + bell only.
   3. Add `firstName` computed.
   4. Bump height to `h-[72px]`.

3. **Sidebar nested nav** ([Sidebar.vue](src/components/The/Sidebar.vue))
   1. Convert nav arrays to `NavItem` tree.
   2. Add `Deliveries` children (Pending / Completed / Void).
   3. Implement expand/collapse with persistence.
   4. Switch active style to filled blue pill.
   5. Add status dots on child rows + Notification badge slot.

4. **Composable** — `src/composables/useDashboardCounters.ts`
   1. Centralize four counts.
   2. Expose `refresh()`.

5. **Greeting banner** — `DashboardGreetingBanner.vue` (new)
   1. Build per spec.
   2. Page composes body from `pendingDeliveries[0]` or `maintenanceAlertCount`.

6. **KPI card tweaks** ([BaseKpiCard.vue](src/components/Base/BaseKpiCard.vue))
   1. Add `expandable`, `iconTone` props.
   2. Render `IconMaximize` when `expandable`.

7. **Task list** — `DashboardTaskList.vue` (new)
   1. Build row layout.
   2. Customer brand-color hash util in `helpers/avatar.ts` (new).
   3. Avatar stack from delivery items (or rider/customer fallback).

8. **Bar chart upgrade** ([BaseBarChart.vue](src/components/Base/BaseBarChart.vue))
   1. Add `highlightIndex` + `tooltip` props.
   2. Gradient bar via Chart.js dataset callback (`createLinearGradient`).
   3. Overlay tooltip card via absolute positioning + `ResizeObserver`.
   4. Header: title + subtitle + `<BaseSelect>` (stub options) + download button.

9. **Top performance** — `DashboardTopPerformance.vue` (new)
   1. Add `services/deliveries.ts → listTopRiders()`.
   2. 4-up grid with rank overlays.

10. **Page wiring** ([dashboard.vue](src/pages/dashboard.vue))
    1. Replace template with skeleton in §4.
    2. Add `loadActiveCustomers`, `loadMonthlyRevenue`, `loadTopPerformers`.
    3. Drop right aside.
    4. Drop in-page header row (the greeting banner replaces it).

11. **QA pass**
    1. `npm run dev` and visually diff against image.
    2. Check responsive: hide right column < `lg`, stack KPI 2×2 < `md`.
    3. Verify all empty states (no deliveries, no top riders, no alerts).
    4. Run `vue-tsc` and `eslint`.

---

## 6. Out of scope (flagged, not done in this plan)

- Notifications drawer.
- Search bar full-text query.
- Period switcher logic on chart + top-performance (dropdowns are visual stubs).
- CSV download from chart card.
- Real photo upload pipeline for rider avatars (uses existing `avatar_url` if present; else initials).
- Mobile/tablet layout polish — desktop-first; collapse rules above are coarse.

---

## 7. Decisions (locked 2026-05-18)

1. **Hey-Markus pattern confirmed.** Drop in-page `Dashboard` H1 + "New Sale" / "View Deliveries" buttons. Topbar greeting + banner CTA carry the load.
2. **KPI styling uniform** — all 4 use the same big-number treatment (image style). Active Customers metric = `customers.count where deleted_at is null`.
3. **Chart stays weekly** — past 7 days; highlight **today's** bar with the navy-to-turquoise gradient. Tooltip on highlighted bar shows that day's Completed / Pending / Void counts.
4. **Performance avatars = initials gradient** — skip photo upload pipeline. Render initials on `bg-linear-to-br from-turquoise-stone to-cerulean`.
5. **Add `?status=` query support** to `/deliveries` route as part of this work (filter the existing page by status param on mount + watch).
