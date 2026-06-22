---
name: basemodal-overlay-structure
description: BaseModal has two stacked full-screen layers; outside-click close lives on the z-50 dialog container via @click.self, not the z-40 backdrop.
metadata:
  type: project
---

`BaseModal.vue` renders two separate `fixed inset-0` layers inside the `Teleport`:
- z-40 backdrop (`bg-black/50`, `aria-hidden`) — **visual only**, fully covered by the layer above.
- z-50 dialog container (`flex items-center justify-center`) — sits on top, so all clicks (including the dimmed area around the panel) land here.

Because z-50 covers the backdrop, a click handler on the backdrop never fires. Outside-click-to-close must be on the **z-50 container** with `@click.self="handleClose"` — `.self` fires only on direct clicks on the container, ignoring clicks bubbled up from the panel, so no `@click.stop` on the panel is needed.

`handleClose` is gated by the `closable` prop (also guards Esc), so `:closable="false"` modals do not dismiss on outside click. Every `*Modal.vue` in the app composes `BaseModal`, so this behavior is global.

**Why:** the layered structure makes the "obvious" fix (handler on the backdrop) silently dead. Future modal-dismissal logic belongs on the z-50 container.

**How to apply:** put dismissal/overlay-click logic on the z-50 container, not the backdrop; use `@click.self`; rely on `closable` to opt out.
