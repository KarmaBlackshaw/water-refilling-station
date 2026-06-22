# Design tokens & card-surface convention

Tailwind v4 — **no `tailwind.config`**. All tokens live in `@theme` in [src/assets/main.css](../../src/assets/main.css).

**Semantic color names** (not raw scales): page bg `american-diamond`, surfaces `full-white` / `bright-chrome`, borders `sparkling-silver` / `tender-light-blue`, text `casual-navy` (heading) / `independence` (body) / `oslo` (subtle/labels), primary accent `tampa` (#1A73E8), success `dark-green-turquoise`, danger `blaze-red`, warning `strong-amber`. Subtle fills: `emerald-subtle` / `red-subtle` / `amber-subtle`. Radii: `rounded-panel` (0.75rem), `rounded-pill`. Shadow: `shadow-card`. `.num` class = JetBrains Mono tabular figures.

**Why:** `npm run lint:theme` greps-bans `bg-white`, `bg-gray-{50..400}`, `border-lightgray`, `text-dark`, `text-neutral`. Raw Tailwind color utilities will fail lint — always reach for a named token.

**How to apply:**
- Card surface = **always reuse [BaseCard.vue](../../src/components/Base/BaseCard.vue)** (`rounded-md bg-full-white shadow`; `padding` = `none|sm|md|lg`; optional `title` → `text-sm font-semibold` heading + `#action` slot). Do NOT hand-roll `rounded-panel border-sparkling-silver shadow-card` divs. User feedback (2026-06-22): every card on a page must be the same `BaseCard` surface for consistency — page header, the `BaseTabs` strip, and detail/stat blocks all wrap in `BaseCard`. For depth, sit white cards on a `bg-american-diamond` panel.
- Stat tiles = [BaseKpiCard.vue](../../src/components/Base/BaseKpiCard.vue) (`label`/`value`/`sub`/`#icon` slot/`icon-tone` `gray|turquoise`/`to`) — itself a `BaseCard`. Don't rebuild KPI markup.
- Avatar/icon badge = `size-12 rounded-full bg-tampa/10 text-tampa` (initial or `Icon*`); opacity modifier on named tokens works, e.g. `bg-tampa/10`.
- New component under `src/components/**` → run `npm run build-only` (or dev server) to regen `components.d.ts` before `type-check`; `vue-tsc` alone won't see the new auto-imported component. Relates to [[basetable-row-click]] auto-import setup.
