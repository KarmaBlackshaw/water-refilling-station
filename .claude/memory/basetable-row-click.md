# BaseTable row-click contract

`BaseTable` (`src/components/Base/BaseTable.vue`) emits `row-click` `[row: TRow, index]`. Cursor `cursor-pointer` is applied per-row ONLY when the parent binds `@row-click` — detected via `getCurrentInstance()?.vnode.props?.onRowClick` (computed `clickable`). Tables without the handler render unchanged.

**Why:** lets any table opt into clickable rows without a separate `clickable` prop; one source of truth (the listener) drives both the emit and the cursor affordance.

**How to apply:**
- Navigate on row click → `<BaseTable @row-click="goDetail" />` + `function goDetail(row) { router.push(...) }`.
- Action menus inside a row are safe: `BaseTableActions` buttons use `@click.stop`, so kebab clicks don't trigger row nav.
- In-cell links should target the same route as the row handler (e.g. customers page uses [[address-location-model]]-adjacent `ROUTES.CUSTOMER_DETAIL(id)`) so link-click and row-click agree.
