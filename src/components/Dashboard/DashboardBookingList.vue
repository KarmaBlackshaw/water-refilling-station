<script setup lang="ts">
import { ROUTES } from '@/constants/routes';
import type { BookingRow } from '@/services/bookings';

const props = defineProps<{ bookings: BookingRow[] }>();

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

function bookingVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    fulfilled: 'success',
    cancelled: 'danger',
  };

  return map[status] ?? 'default';
}

function formatDate(dateStr: string): string {
  return formatMonthShortDay(dateStr);
}

const visible = computed(() => props.bookings.slice(0, 8));
</script>

<template>
  <BaseCard padding="md">
    <template #action>
      <RouterLink v-if="bookings.length > 8" :to="ROUTES.BOOKINGS" class="text-xs text-turquoise-stone hover:underline">View all →</RouterLink>
    </template>
    <template #default>
      <p class="mb-3 text-sm font-semibold text-casual-navy">Upcoming Bookings</p>
      <p v-if="bookings.length === 0" class="text-sm text-oslo">No upcoming bookings</p>
      <ul v-else class="space-y-2">
        <li v-for="b in visible" :key="b.id" class="flex items-center justify-between gap-2 text-sm">
          <div class="min-w-0 flex-1">
            <span class="tabular-nums text-xs text-oslo">{{ formatDate(b.scheduled_date) }}</span>
            <span class="ml-1.5 font-medium text-casual-navy">{{ b.customer?.name ?? '—' }}</span>
            <span class="ml-1 text-xs text-oslo">· {{ b.rider?.full_name ?? 'Unassigned' }}</span>
          </div>
          <BaseBadge :variant="bookingVariant(b.status)" size="sm">{{ b.status }}</BaseBadge>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>
