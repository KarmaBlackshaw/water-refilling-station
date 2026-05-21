# Crypto Minimal Light — Design Spec

**Date:** 2026-05-16
**Scope:** Full visual redesign of WRS Admin — light-only, crypto-native aesthetic (Approach A)

---

## Goal

Replace the current dual-mode (light/dark toggle) glass-morphism design with a single light-only "Crypto Minimal" theme. Inspired by Coingecko / Binance light: pure white surfaces, near-black text with a blue tint, electric cyan accent, flat sharp cards, JetBrains Mono for numeric data.

---

## Color System

All tokens live in `src/assets/main.css` under `@theme {}`. The `.dark {}` block and all dark-mode aliases are removed entirely.

| Token | Value | Purpose |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Page background |
| `--color-surface` | `#FFFFFF` | Card / panel background |
| `--color-surface-2` | `#F8FAFC` | Inputs, hover, subtle bg |
| `--color-border` | `#E2E8F0` | Default 1px borders |
| `--color-border-strong` | `#CBD5E1` | Dividers, focused borders |
| `--color-fg` | `#0A0E1A` | Primary text |
| `--color-fg-muted` | `#475569` | Secondary text |
| `--color-fg-subtle` | `#94A3B8` | Tertiary / placeholder |
| `--color-accent` | `#00C9F0` | Electric cyan — brand accent |
| `--color-accent-soft` | `rgba(0,201,240,0.10)` | Cyan tints |
| `--color-positive` | `#10B981` | Success |
| `--color-negative` | `#EF4444` | Error |
| `--color-warning` | `#F59E0B` | Warning |

**Removed:** `--color-void`, `--color-obsidian`, `--color-onyx`, `--color-charcoal`, `--color-elevated`, `--color-glass*`, `--shadow-glass`, `--blur-glass`, all dark-mode aliases. The `.dark {}` override block is deleted.

**Kept as aliases** (components reference these): `--color-teal` → accent, `--color-azure`, `--color-emerald`, `--color-red`, `--color-amber`, `--color-purple`, etc.

---

## Typography

- **Body / UI:** Inter (system, unchanged)
- **Numbers / KPIs:** JetBrains Mono 500/700 (Google Fonts)
- `.num` class gains `font-family: 'JetBrains Mono', monospace`
- All dashboard KPI values (`text-2xl font-bold`), money amounts, timestamps use `.num`

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=swap');
```

---

## Components

### BaseCard

- `rounded-lg` (8px, down from `rounded-xl` 12px)
- `border border-[--color-border]` (1px, no shadow)
- New prop `variant?: 'default' | 'kpi'`
- `kpi` variant adds `border-t-2 border-t-[--color-accent]`

### BaseButton

| Variant | bg | text | border |
|---|---|---|---|
| `primary` | `--color-accent` | `#0A0E1A` | none |
| `secondary` | white | `--color-fg` | `1px --color-border` |
| `ghost` | transparent | `--color-fg-muted` | none |
| `danger` | `--color-negative` | white | none |

- `rounded-md` → `rounded` (6px)

### BaseBadge

| Variant | bg | text |
|---|---|---|
| `default` | `--color-surface-2` | `--color-fg-muted` |
| `success` | `rgba(16,185,129,0.10)` | `#059669` |
| `warning` | `rgba(245,158,11,0.10)` | `#D97706` |
| `danger` | `rgba(239,68,68,0.10)` | `#DC2626` |
| `info` | `--color-accent-soft` | `#0099B8` |

- `rounded` (4px, not pill)

### Sidebar

- bg `--color-surface`, `border-r border-[--color-border]`
- Active: `bg-[--color-accent-soft] text-[--color-accent] border-l-2 border-[--color-accent]`
- Inactive: `text-[--color-fg-muted] hover:bg-[--color-surface-2]`
- Remove `TheThemeToggle` from footer

### Topbar

- Inherits tokens, no structural change
- Avatar: `bg-[--color-accent-soft] text-[--color-accent]`

### Dashboard KPI Cards

- Use `variant="kpi"` on the 4 stat cards in row 1
- All KPI numeric values get `.num` class added

---

## Removals

- `TheThemeToggle.vue` — delete or keep as dead file (no longer rendered)
- `stores/theme.ts` — delete (no longer needed)
- `.dark {}` CSS block — delete
- `glass` utility class — delete (no glass on light-only)
- `bg-dotgrid` utility — delete (not needed)
- All `--color-glass*` tokens
- All legacy dark aliases (`--color-void`, `--color-obsidian`, etc.)

---

## Files Changed

| File | Change |
|---|---|
| `src/assets/main.css` | Rewrite `@theme`, remove `.dark`, add JetBrains Mono import, update `.num` |
| `src/components/Base/BaseCard.vue` | Add `kpi` variant prop |
| `src/components/Base/BaseButton.vue` | Update variant colors + radius |
| `src/components/Base/BaseBadge.vue` | Update variant colors + radius |
| `src/components/The/Sidebar.vue` | New active styles, remove ThemeToggle |
| `src/components/The/Topbar.vue` | Avatar token update |
| `src/pages/dashboard.vue` | Add `variant="kpi"` + `.num` to KPI values |
| `src/stores/theme.ts` | Delete |
| `src/components/The/ThemeToggle.vue` | Delete |
