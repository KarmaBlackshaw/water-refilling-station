<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { CustomerSaleWithRels } from '@/services/customers';

defineOptions({ name: 'CustomerDetailSales' });

defineProps<{ sales: CustomerSaleWithRels[] }>();

const columns: TableColumn<CustomerSaleWithRels>[] = [
  { key: 'sale_date', label: 'Date' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'lines', label: 'Lines' },
];
</script>

<template>
  <BaseTable :columns="columns" :data="sales" empty-title="No sales yet" class="-mt-px">
    <template #cell-source="{ row }">
      <BaseBadge variant="default">{{ row.source }}</BaseBadge>
    </template>
    <template #cell-status="{ row }">
      <BaseBadge :variant="row.status === 'completed' ? 'success' : row.status === 'void' ? 'danger' : 'warning'">
        {{ row.status }}
      </BaseBadge>
    </template>
    <template #cell-lines="{ row }">{{ row.sale_lines.length }}</template>
  </BaseTable>
</template>
