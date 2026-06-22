---
name: sale-total-from-payments
description: A sale's total / revenue is the sum of its sale_payments.amount_centavos, not line totals.
metadata:
  type: project
---

A sale's **total / revenue = sum of `sale_payments.amount_centavos`** for that sale — NOT the sum of `sale_lines (quantity * unit_price_centavos)`.

**Why:** This is the established definition in [SaleDetailModal.vue](../../src/components/Sale/SaleDetailModal.vue) (`total = payments.reduce((s, p) => s + p.amount_centavos, 0)`). Payments include all methods (cash, gcash, `on_account`), so this represents the full amount charged. Customer-level analytics (lifetime spend, avg order value) should follow the same definition for consistency.

**How to apply:**
- Any revenue / spend / sales-total aggregate → sum `sale_payments.amount_centavos`. Filter `status = 'completed'` and `deleted_at IS NULL` for "real" sales.
- Line subtotal (display only) = `quantity * unit_price_centavos`.
- Gotcha: `listCustomerSales()` in [customers.ts](../../src/services/customers.ts) caps at `.limit(20)` — fine for the history list, WRONG for lifetime totals. Use a dedicated unbounded aggregate query for lifetime stats.
- Customer staleness: thresholds come from `useTenantStore()` getters `stalenessDaysDelivery` / `stalenessDaysWalkin`; helpers `getDaysSinceOrder` + `isCustomerStale` live in the customers service.
