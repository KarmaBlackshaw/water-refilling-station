<script setup lang="ts">
import { ROUTES } from '@/constants/routes';
import type { DeliverySaleRow } from '@/services/deliveries';
import { avatarColor, initials } from '@/helpers/avatar';
import { formatAddress } from '@/helpers/address';

defineOptions({ name: 'DashboardTaskList' });

const props = defineProps<{ deliveries: DeliverySaleRow[]; loading?: boolean }>();

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending_delivery: 'warning',
    completed: 'success',
    void: 'danger',
  };

  return map[status] ?? 'default';
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending_delivery: 'On Going',
    completed: 'Delivered',
    void: 'Void',
  };

  return map[status] ?? status;
}

function progressPct(d: DeliverySaleRow): string {
  if (d.status === 'completed') {
    return '100%';
  }

  if (d.status === 'void') {
    return '0%';
  }

  return '—';
}

function dueDate(d: DeliverySaleRow): string {
  return formatDateDisplay(d.sale_date);
}

function brand(d: DeliverySaleRow) {
  const name = d.customer?.name ?? '—';

  return { color: avatarColor(name), initials: initials(name) };
}

function itemAvatars(d: DeliverySaleRow): { label: string; color: { bg: string; text: string } }[] {
  return d.lines.slice(0, 3).map((l) => ({
    label: initials(l.product?.name ?? '?', 1),
    color: avatarColor(l.product?.name ?? '?'),
  }));
}

function extraCount(d: DeliverySaleRow): number {
  return Math.max(0, d.lines.length - 3);
}

const visible = computed(() => props.deliveries.slice(0, 6));
</script>

<template>
  <BaseCard padding="md">
    <div class="mb-3 flex items-start justify-between">
      <div>
        <p class="text-sm font-semibold text-casual-navy">On Going Deliveries</p>
        <p class="text-xs text-oslo">Today's delivery routes ranked by status.</p>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-oslo hover:bg-bright-chrome">
          <IconSearch :size="14" />
        </button>
        <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-oslo hover:bg-bright-chrome">
          <IconFilter :size="14" />
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="flex items-start gap-3 rounded-xl border border-sparkling-silver p-3">
        <BaseSkeleton rounded="full" class="h-10 w-10 shrink-0" />
        <div class="min-w-0 flex-1 space-y-2">
          <BaseSkeleton class="h-4 w-32" />
          <BaseSkeleton class="h-3 w-44" />
          <BaseSkeleton class="h-3 w-24" />
        </div>
      </div>
    </div>

    <p v-else-if="deliveries.length === 0" class="py-6 text-center text-sm text-oslo">No deliveries today</p>

    <ul v-else class="space-y-3">
      <li v-for="d in visible" :key="d.id" class="flex items-start gap-3 rounded-xl border border-sparkling-silver p-3">
        <div :class="[brand(d).color.bg, brand(d).color.text]" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold">
          {{ brand(d).initials }}
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-casual-navy">{{ d.customer?.name ?? '—' }}</p>
          <p class="truncate text-xs text-oslo">{{ d.address ? formatAddress(d.address) : (d.rider?.full_name ?? 'Unassigned') }}</p>

          <div class="mt-2 flex items-center gap-4 text-[11px]">
            <span class="flex items-center gap-1">
              <span class="text-oslo">Status:</span>
              <BaseBadge :variant="statusVariant(d.status)" size="sm">{{ statusLabel(d.status) }}</BaseBadge>
            </span>
            <span class="flex items-center gap-1">
              <span class="text-oslo">Progress:</span>
              <span class="num font-semibold text-casual-navy">{{ progressPct(d) }}</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="text-oslo">Due:</span>
              <span class="font-medium text-casual-navy">{{ dueDate(d) }}</span>
            </span>
          </div>
        </div>

        <div class="flex shrink-0 items-center">
          <div
            v-for="(a, idx) in itemAvatars(d)"
            :key="idx"
            :class="[a.color.bg, a.color.text]"
            class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-full-white text-[9px] font-bold"
            :style="{ marginLeft: idx === 0 ? '0' : '-8px' }"
          >
            {{ a.label }}
          </div>
          <div
            v-if="extraCount(d) > 0"
            class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-full-white bg-american-diamond text-[9px] font-bold text-independence"
            style="margin-left: -8px"
          >
            +{{ extraCount(d) }}
          </div>
        </div>
      </li>
    </ul>

    <div v-if="deliveries.length > 6" class="mt-3 text-right">
      <RouterLink :to="ROUTES.DELIVERIES" class="text-xs text-tampa hover:underline">View all →</RouterLink>
    </div>
  </BaseCard>
</template>
