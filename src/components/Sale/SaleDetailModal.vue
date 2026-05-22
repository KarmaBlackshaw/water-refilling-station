<script setup lang="ts">
import type { Sale, SaleLine, SalePayment } from '@/types/database';
import { formatMoney } from '@/helpers/money';

type SaleWithCustomer = Sale & { customer?: { name: string } | null };
type LineWithRels = SaleLine & { product?: { name: string }; container_type?: { name: string } };

const open = defineModel<boolean>('open', { required: true });

const { sale, lines, payments, loading, sourceBadgeVariant, sourceLabel, statusBadgeVariant, statusLabel } = defineProps<{
  sale?: SaleWithCustomer;
  lines: LineWithRels[];
  payments: SalePayment[];
  loading?: boolean;
  sourceBadgeVariant: (s: string) => 'default' | 'info' | 'warning' | 'success' | 'danger';
  sourceLabel: (s: string) => string;
  statusBadgeVariant: (s: string) => 'default' | 'info' | 'warning' | 'success' | 'danger';
  statusLabel: (s: string) => string;
}>();

const total = computed(() => payments.reduce((s, p) => s + p.amount_centavos, 0));
</script>

<template>
  <BaseModal v-model:open="open" title="Sale Detail" size="xl">
    <BaseSpinner v-if="loading" class="mx-auto my-4" />
    <div v-else-if="sale" class="space-y-4">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-independence">Date: </span>
          <span class="text-casual-navy">{{ sale.sale_date }}</span>
        </div>
        <div>
          <span class="text-independence">Customer: </span>
          <span class="text-casual-navy">{{ sale.customer?.name ?? 'Anonymous' }}</span>
        </div>
        <div>
          <span class="text-independence">Source: </span>
          <BaseBadge :variant="sourceBadgeVariant(sale.source)">{{ sourceLabel(sale.source) }}</BaseBadge>
        </div>
        <div>
          <span class="text-independence">Status: </span>
          <BaseBadge :variant="statusBadgeVariant(sale.status)">{{ statusLabel(sale.status) }}</BaseBadge>
        </div>
        <div v-if="sale.notes" class="col-span-2">
          <span class="text-independence">Notes: </span>
          <span class="text-casual-navy">{{ sale.notes }}</span>
        </div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-casual-navy mb-2">Line Items</h3>
        <BaseTable
          :columns="[
            { key: 'product', label: 'Product' },
            { key: 'container', label: 'Container' },
            { key: 'is_new_container', label: 'New?' },
            { key: 'quantity', label: 'Qty', align: 'right', class: 'num' },
            { key: 'unit_price', label: 'Unit Price', align: 'right', class: 'num' },
            { key: 'subtotal', label: 'Subtotal', align: 'right', class: 'num' },
          ]"
          :data="lines"
        >
          <template #cell-product="{ row }">{{ row.product?.name ?? '—' }}</template>
          <template #cell-container="{ row }">{{ row.container_type?.name ?? '—' }}</template>
          <template #cell-is_new_container="{ row }">{{ row.is_new_container ? 'Yes' : 'No' }}</template>
          <template #cell-unit_price="{ row }">{{ formatMoney(row.unit_price_centavos) }}</template>
          <template #cell-subtotal="{ row }">{{ formatMoney(row.quantity * row.unit_price_centavos) }}</template>
        </BaseTable>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-casual-navy mb-2">Payments</h3>
        <BaseTable
          :columns="[
            { key: 'method', label: 'Method', class: 'capitalize' },
            { key: 'gcash_ref', label: 'GCash Ref' },
            { key: 'amount', label: 'Amount', align: 'right', class: 'num' },
          ]"
          :data="payments"
        >
          <template #cell-gcash_ref="{ row }">{{ row.gcash_ref ?? '—' }}</template>
          <template #cell-amount="{ row }">{{ formatMoney(row.amount_centavos) }}</template>
        </BaseTable>
        <div class="text-right mt-2 text-sm font-semibold text-casual-navy num">Total: {{ formatMoney(total) }}</div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Close</BaseButton>
    </template>
  </BaseModal>
</template>
