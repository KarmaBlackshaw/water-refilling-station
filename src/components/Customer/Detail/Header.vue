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

    <div class="grid grid-cols-3 gap-3 px-4 pb-4">
      <BaseKpiTile label="AR Balance" :value="formatMoney(arBalance)" :tone="arBalance > 0 ? 'warning' : 'default'" />
      <BaseKpiTile label="Addresses" :value="addressCount" />
      <BaseKpiTile label="Containers out" :value="containersOut" :tone="containersOut > 0 ? 'warning' : 'default'" />
    </div>
  </BaseCard>
</template>
