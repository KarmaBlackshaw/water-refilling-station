<script setup lang="ts">
const todayDate = today();

interface RiderRoute {
  name: string;
  total: number;
  done: number;
}

const { data: routesData, loading } = useAsync(
  async () => {
    const deliveries = await listDeliverySales(todayDate);
    const map = new Map<string, RiderRoute>();

    for (const d of deliveries) {
      const key = d.rider?.full_name ?? 'Unassigned';
      const existing = map.get(key) ?? { name: key, total: 0, done: 0 };

      existing.total++;
      if (d.status === 'completed') {
        existing.done++;
      }

      map.set(key, existing);
    }

    return Array.from(map.values());
  },
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
  },
);

const routes = computed(() => routesData.value ?? []);
</script>

<template>
  <div>
    <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-casual-navy">Today's Routes</p>
    <BaseSpinner v-if="loading" size="sm" class="mx-auto" />
    <p v-else-if="routes.length === 0" class="text-xs text-oslo">No deliveries today</p>
    <div v-else class="space-y-2">
      <div v-for="r in routes" :key="r.name" class="rounded-lg bg-bright-chrome p-2.5">
        <p class="text-xs font-semibold text-casual-navy">{{ r.name }}</p>
        <p class="mt-0.5 text-[10px] text-oslo">{{ r.total }} stops · {{ r.done }} done</p>
        <div class="mt-1.5 h-1 w-full rounded-full bg-sparkling-silver">
          <div class="h-1 rounded-full bg-tampa transition-all" :style="{ width: r.total > 0 ? `${Math.round((r.done / r.total) * 100)}%` : '0%' }" />
        </div>
      </div>
    </div>
  </div>
</template>
