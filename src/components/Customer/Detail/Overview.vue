<script setup lang="ts">
import type { CustomerAddressRow, CustomerDetail } from '@/services/customers';

defineOptions({ name: 'CustomerDetailOverview' });

defineProps<{
  customer: CustomerDetail;
  defaultAddress: CustomerAddressRow | null;
  containerBalance: Record<string, number>;
  hasContainerBalance: boolean;
}>();
</script>

<template>
  <div class="divide-y divide-sparkling-silver">
    <div class="p-4">
      <p class="mb-3 text-sm font-semibold text-casual-navy">Details</p>
      <dl class="divide-y divide-sparkling-silver text-sm">
        <div class="flex items-center justify-between gap-4 py-2.5 first:pt-0">
          <dt class="text-oslo">Area</dt>
          <dd class="font-medium text-casual-navy">{{ customer.area?.name ?? '—' }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-2.5 last:pb-0">
          <dt class="text-oslo">Default address</dt>
          <dd class="max-w-[60%] text-right">
            <template v-if="defaultAddress">
              <span class="block font-medium text-casual-navy">{{ formatAddress(defaultAddress) }}</span>
              <span class="block text-xs text-oslo">{{ defaultAddress.label }}</span>
            </template>
            <span v-else class="font-medium text-casual-navy">—</span>
          </dd>
        </div>
        <div v-if="customer.notes" class="flex justify-between gap-4 py-2.5 last:pb-0">
          <dt class="text-oslo">Notes</dt>
          <dd class="max-w-[60%] text-right font-medium text-casual-navy">{{ customer.notes }}</dd>
        </div>
      </dl>
    </div>

    <div v-if="hasContainerBalance" class="p-4">
      <p class="mb-3 text-sm font-semibold text-casual-navy">Container balance</p>
      <dl class="divide-y divide-sparkling-silver text-sm">
        <div v-for="(qty, typeId) in containerBalance" :key="typeId" class="flex items-center justify-between py-2 first:pt-0 last:pb-0">
          <dt class="text-oslo">{{ typeId }}</dt>
          <dd class="num font-medium" :class="qty > 0 ? 'text-strong-amber' : 'text-dark-green-turquoise'">{{ qty }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
