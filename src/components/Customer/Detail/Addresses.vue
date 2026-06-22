<script setup lang="ts">
import type { CustomerAddressRow } from '@/services/customers';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

defineOptions({ name: 'CustomerDetailAddresses' });

defineProps<{ addresses: CustomerAddressRow[] }>();

const emit = defineEmits<{
  edit: [addr: CustomerAddressRow];
  delete: [addr: CustomerAddressRow];
}>();

function rowMenu(addr: CustomerAddressRow) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => emit('edit', addr) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => emit('delete', addr) },
  ];
}
</script>

<template>
  <BaseEmptyState v-if="addresses.length === 0" title="No addresses yet" />
  <div v-else class="divide-y divide-sparkling-silver">
    <div v-for="a in addresses" :key="a.id" class="flex items-start justify-between gap-3 p-4">
      <CustomerAddressPhoto v-if="a.photo_path" :photo-path="a.photo_path" />
      <div class="flex-1">
        <p class="font-medium text-casual-navy">{{ a.label }}</p>
        <p class="text-sm text-independence">{{ formatAddress(a) }}</p>
        <BaseBadge v-if="a.is_default" variant="info" class="mt-1">Default</BaseBadge>
      </div>
      <BaseTableActions :menu="rowMenu(a)" />
    </div>
  </div>
</template>
