<script setup lang="ts">
import type { TopRiderRow } from '@/services/deliveries';
import { initials } from '@/helpers/avatar';

defineProps<{ performers: TopRiderRow[] }>();

const RANK_LABELS = ['1st', '2nd', '3rd', '4th', '5th'];

const monthName = dayjs().tz(MANILA_TZ).format('MMMM');
</script>

<template>
  <BaseCard padding="md">
    <div class="mb-3 flex items-start justify-between">
      <div>
        <p class="text-sm font-semibold text-casual-navy">Top Performance</p>
        <p class="text-xs text-oslo">Best performing riders this period.</p>
      </div>
      <div class="flex items-center gap-1">
        <span class="rounded-lg border border-sparkling-silver bg-bright-chrome px-2 py-1 text-[11px] font-medium text-casual-navy">{{ monthName }}</span>
        <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-oslo hover:bg-bright-chrome">
          <IconDownload :size="14" />
        </button>
      </div>
    </div>

    <p v-if="performers.length === 0" class="py-6 text-center text-sm text-oslo">No delivery data yet</p>

    <div v-else class="grid grid-cols-4 gap-3">
      <div v-for="(p, idx) in performers" :key="p.rider_id" class="flex flex-col items-center">
        <div class="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-linear-to-br from-tampa to-cerulean">
          <div class="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
            {{ initials(p.full_name) }}
          </div>
          <span class="absolute left-2 top-2 rounded-pill bg-casual-navy/80 px-2 py-0.5 text-[10px] font-semibold text-white">
            {{ RANK_LABELS[idx] ?? `${idx + 1}th` }}
          </span>
        </div>
        <p class="mt-2 truncate text-xs font-medium text-casual-navy">{{ p.full_name }}</p>
        <p class="text-[10px] text-oslo">{{ p.count }} deliveries</p>
      </div>
    </div>
  </BaseCard>
</template>
