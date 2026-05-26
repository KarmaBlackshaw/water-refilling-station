<script setup lang="ts">
import { ROUTES } from '@/constants/routes';
import type { DeliverySaleRow } from '@/services/deliveries';

const props = defineProps<{ deliveries: DeliverySaleRow[] }>();

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending_delivery: 'warning',
    completed: 'success',
    void: 'danger',
    booking_fulfilled: 'info',
  };

  return map[status] ?? 'default';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_delivery: 'Pending',
    completed: 'Delivered',
    void: 'Void',
    booking_fulfilled: 'Fulfilled',
  };

  return map[status] ?? status;
}

const visible = computed(() => props.deliveries.slice(0, 8));
</script>

<template>
  <BaseCard padding="md">
    <template #action>
      <RouterLink v-if="deliveries.length > 8" :to="ROUTES.DELIVERIES" class="text-xs text-tampa hover:underline">View all →</RouterLink>
    </template>
    <template #default>
      <p class="mb-3 text-sm font-semibold text-casual-navy">Today's Deliveries</p>
      <p v-if="deliveries.length === 0" class="text-sm text-oslo">No deliveries today</p>
      <ul v-else class="space-y-2">
        <li v-for="d in visible" :key="d.id" class="flex items-center justify-between gap-2 text-sm">
          <div class="min-w-0 flex-1">
            <span class="truncate font-medium text-casual-navy">{{ d.customer?.name ?? '—' }}</span>
            <span class="ml-1.5 text-xs text-oslo">· {{ d.rider?.full_name ?? 'Unassigned' }}</span>
          </div>
          <BaseBadge :variant="statusVariant(d.status)" size="sm">{{ statusLabel(d.status) }}</BaseBadge>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>
