---
name: vmodel-object-needs-ref
description: v-model bound to a parent value must be a `ref` (not `const reactive`) when the child replaces the whole object.
metadata:
  type: project
---

A `v-model:x="parentVar"` binding compiles to `:x="parentVar" @update:x="parentVar = $event"`. If a child does `model.value = { ...model.value, ... }` (replaces the whole object — as `AddressFieldCascade` / `CustomerAddressTab` do), the parent binding gets **reassigned**. A `const reactive({...})` cannot be reassigned, so the update silently no-ops and the parent's value never changes.

**Why:** Bit the customer-create wizard ([new.vue](../../src/pages/customers/new.vue)) — `addressFields` was `reactive`, so address data entered in the Address tab never reached the `addressSummary` computed, and the Review tab showed "No address added".

**How to apply:**
- Any parent value passed via `v-model`/`v-model:slot` to a child that **replaces** the whole object → declare it `ref<T>(...)`, not `reactive`. Script reads use `.value`.
- Use `reactive` only when the child mutates fields in place and you never bind the object itself with `v-model`.
- Shared `AddressFields` type lives in [constants/customer.ts](../../src/constants/customer.ts) — reuse it, don't redeclare. See [[basefullpagetabs-wizard]].
