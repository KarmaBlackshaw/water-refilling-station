<script setup lang="ts">
import type { CustomerDetail } from '@/services/customers';

defineOptions({ name: 'CustomerDetailHeader' });

const { customer, arBalance, addressCount, containersOut } = defineProps<{
  customer: CustomerDetail;
  arBalance: number;
  addressCount: number;
  containersOut: number;
}>();

const emit = defineEmits<{ edit: [] }>();
</script>

<template>
  <BaseCard padding="none">
    <div class="flex items-start gap-4 p-4">
      <div class="flex size-12 flex-none items-center justify-center rounded-full bg-tampa/10 text-lg font-bold text-tampa uppercase">
        {{ customer.name.charAt(0) }}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="truncate text-xl font-bold text-casual-navy">{{ customer.name }}</h1>
          <BaseBadge variant="info" class="capitalize">{{ customer.type }}</BaseBadge>
        </div>
        <p class="mt-1 text-sm text-independence">{{ customer.phone ?? 'No phone' }}</p>
      </div>
      <BaseButton variant="full-white" size="sm" @click="emit('edit')">
        <IconEdit class="size-4" />
        Edit
      </BaseButton>
    </div>

    <div class="grid grid-cols-3 divide-x divide-sparkling-silver border-t border-sparkling-silver">
      <div class="px-4 py-3">
        <p class="text-xs text-oslo">AR Balance</p>
        <p class="num mt-0.5 text-lg font-semibold" :class="arBalance > 0 ? 'text-strong-amber' : 'text-casual-navy'">{{ formatMoney(arBalance) }}</p>
      </div>
      <div class="px-4 py-3">
        <p class="text-xs text-oslo">Addresses</p>
        <p class="num mt-0.5 text-lg font-semibold text-casual-navy">{{ addressCount }}</p>
      </div>
      <div class="px-4 py-3">
        <p class="text-xs text-oslo">Containers out</p>
        <p class="num mt-0.5 text-lg font-semibold" :class="containersOut > 0 ? 'text-strong-amber' : 'text-casual-navy'">{{ containersOut }}</p>
      </div>
    </div>
  </BaseCard>
</template>
