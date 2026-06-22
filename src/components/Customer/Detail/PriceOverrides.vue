<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { CustomerPriceOverrideWithRels } from '@/services/customers';
import IconTrash from '@/components/Icon/IconTrash.vue';

defineOptions({ name: 'CustomerDetailPriceOverrides' });

defineProps<{ priceOverrides: CustomerPriceOverrideWithRels[] }>();

const emit = defineEmits<{ remove: [override: CustomerPriceOverrideWithRels] }>();

const columns: TableColumn<CustomerPriceOverrideWithRels>[] = [
  { key: 'product', label: 'Product' },
  { key: 'container', label: 'Container' },
  { key: 'refill_price', label: 'Refill price' },
  { key: 'new_container_price', label: 'New container' },
  { key: 'actions', label: '', align: 'right' },
];

function rowMenu(override: CustomerPriceOverrideWithRels) {
  return [{ label: 'Remove', icon: IconTrash, danger: true, onClick: () => emit('remove', override) }];
}
</script>

<template>
  <BaseTable :columns="columns" :data="priceOverrides" empty-title="No price overrides" class="-mt-px">
    <template #cell-product="{ row }">{{ row.product?.name ?? '—' }}</template>
    <template #cell-container="{ row }">{{ row.container_type?.name ?? '—' }}</template>
    <template #cell-refill_price="{ row }">{{ formatMoney(row.refill_price_centavos) }}</template>
    <template #cell-new_container_price="{ row }">{{ formatMoney(row.new_container_price_centavos) }}</template>
    <template #cell-actions="{ row }">
      <BaseTableActions :menu="rowMenu(row)" />
    </template>
  </BaseTable>
</template>
