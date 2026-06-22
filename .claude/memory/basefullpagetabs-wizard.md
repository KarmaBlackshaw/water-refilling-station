# BaseFullPageTabs wizard contract

`BaseFullPageTabs` is the full-screen stepped-wizard shell (Teleport overlay, progress tabs, back/next/save). It is driven by an array of `FullPageTab` objects and a `v-model:tab` active-tab ref.

`FullPageTab` (exported from `src/components/Base/BaseFullPageTabs.vue`):
- `label` / `value` — tab chip + identity
- `title?` / `subtitle?` — per-tab header text
- `canNavigateTo?: () => boolean` — gate; forward jumps require every intermediate gated tab to pass

**Why:** header text lives on the tab definition, not in the page template. The page renders `<BaseFullPageTabsHeader :title="activeTab.title" :subtitle="activeTab.subtitle" />` so the header swaps automatically as the active tab changes — single source of truth for each step's heading.

**How to apply:**
- Add a step → push a `FullPageTab` with its own `title`/`subtitle`; build edit-vs-create tab lists from shared tab consts (see [new.vue](../../src/pages/customers/new.vue)).
- `BaseFullPageTabsHeader` is presentational only (`title?`/`subtitle?`, each `v-if`-guarded). Don't hardcode `<h1>/<p>` headers in the page content slot.
- Tab body components stay dumb: `v-show="activeTab.value === '<value>'"` toggles them inside the `#content` slot; the page owns form state and the `useAsync` save.
