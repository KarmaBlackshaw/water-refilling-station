# BadgeVariant is a shared type in `@/types`

The `BaseBadge` variant union lives once in [src/types/badge.ts](../../src/types/badge.ts): `type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'` (re-exported via the auto-generated `@/types` barrel). `BaseBadge.vue`, page `xxxBadgeVariant(s)` helper fns, and modal props that pass those helpers all import it — no re-listing the union literals.

**Why:** The union was duplicated in 3+ spots (BaseBadge, `sales/index.vue`, `Sale/DetailModal.vue`). A function like `function statusBadgeVariant(st: string): BadgeVariant` needs the annotation — **do NOT delete it thinking TS infers it**. TS widens literal returns (`return 'success'`) to `string` in return position, which then fails to satisfy `BaseBadge :variant` and any `(s: string) => BadgeVariant` prop. The annotation is load-bearing; the fix for the duplication is to reference the shared type, not remove the annotation.

**How to apply:**
- New badge-variant helper → annotate `: BadgeVariant` (import from `@/types`), never inline the literal union, never drop the annotation.
- Component prop that receives such a helper → type it `(s: string) => BadgeVariant`.
- Adding a new badge color → edit `src/types/badge.ts` only; all consumers update.

Relates to [[design-tokens-and-card-surface]] (BaseBadge is part of the design-system surface).
