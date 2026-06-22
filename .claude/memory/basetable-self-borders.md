---
name: basetable-self-borders
description: BaseTable root always renders a top border; stacking under another bordered row causes a double border.
metadata:
  type: project
---

`BaseTable` root `<div>` always renders `border-t border-sparkling-silver`, and each header `<th>` + body `<td>` renders `border-b border-sparkling-silver`. The `BaseTabs` `underline` variant root also renders `border-b`.

**Why:** These component-owned borders are invisible normally, but stack into a visible **double border** when a `BaseTable` sits flush under another bordered element (e.g. a tab/header row with its own `border-b`, no padding between).

**How to apply:**
- When placing `BaseTable` directly below a bordered row, collapse the seam with `class="-mt-px"` on the table (fallthrough adds it to the root) so its `border-t` overlaps the row's `border-b` → single line. Page-only; don't strip the border from the shared `BaseTable`/`BaseTabs` (other pages rely on it).
- Seen on the customer detail card ([id].vue): tab-row wrapper `border-b` + table `border-t` = double.
- Related: [[basetable-row-click]], [[design-tokens-and-card-surface]].
