<script setup lang="ts">
import { supabase } from '@/helpers/supabase';

const todayDate = today();
const todayPlus3Date = addDays(todayDate, 3);

function getPast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => subtractDays(todayDate, 6 - i));
}

function monthRange(): { from: string; to: string } {
  return { from: startOfMonth(todayDate), to: endOfMonth(todayDate) };
}

const counters = useDashboardCounters();

const { data: weeklyRevenueResult, loading: loadingWeeklyRevenue } = useAsync(
  async () => {
    const days = getPast7Days();
    const { data: sales } = await supabase
      .from('sales')
      .select('id, sale_date')
      .gte('sale_date', days[0]!)
      .lte('sale_date', days[6]!)
      .eq('status', 'completed')
      .is('deleted_at', null);

    const saleDateMap: Record<string, string> = Object.fromEntries((sales ?? []).map((s: { id: string; sale_date: string }) => [s.id, s.sale_date]));
    const saleIds = Object.keys(saleDateMap);
    const dayTotals: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));

    if (saleIds.length > 0) {
      const { data: payments } = await supabase.from('sale_payments').select('sale_id, amount_centavos').in('sale_id', saleIds);

      for (const p of payments ?? []) {
        if (p.sale_id === null) {
          continue;
        }

        const date = saleDateMap[p.sale_id];

        if (date) {
          dayTotals[date] = (dayTotals[date] ?? 0) + (p.amount_centavos ?? 0);
        }
      }
    }

    return {
      labels: days.map((d) => formatWeekdayShort(d)),
      data: days.map((d) => Math.round((dayTotals[d] ?? 0) / 100)),
    };
  },
  {
    immediate: true,
    defaultValue: { labels: [], data: [] },
    disableResetValue: true,
  },
);

const weeklyRevenueLabels = computed(() => weeklyRevenueResult.value?.labels ?? []);
const weeklyRevenueData = computed(() => weeklyRevenueResult.value?.data ?? []);

const { data: weeklyByDay, loading: loadingWeeklyDeliveries } = useAsync(
  async () => {
    const days = getPast7Days();
    const results = await Promise.all(days.map((d) => listDeliverySales(d)));
    const map: Record<string, { completed: number; pending: number; void: number }> = {};

    days.forEach((d, i) => {
      const items = results[i] ?? [];

      map[d] = {
        completed: items.filter((x) => x.status === 'completed' || x.status === 'booking_fulfilled').length,
        pending: items.filter((x) => x.status === 'pending_delivery').length,
        void: items.filter((x) => x.status === 'void').length,
      };
    });

    return map;
  },
  {
    immediate: true,
    defaultValue: {},
    disableResetValue: true,
  },
);

const { data: deliveries, loading: loadingDeliveries } = useAsync(() => listDeliverySales(todayDate), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const { loading: loadingBookings } = useAsync(() => listBookings({ from: todayDate, to: todayPlus3Date, status: 'pending' }), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const { data: topPerformers, loading: loadingTopPerformers } = useAsync(
  () => {
    const { from, to } = monthRange();

    return listTopRiders(from, to, 4);
  },
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
  },
);

const loading = computed(
  () => loadingWeeklyRevenue.value || loadingWeeklyDeliveries.value || loadingDeliveries.value || loadingBookings.value || loadingTopPerformers.value,
);

const pendingDeliveries = computed(() => (deliveries.value ?? []).filter((d) => d.status === 'pending_delivery'));

const deliveryCompletionPct = computed(() => {
  let total = 0;
  let done = 0;

  for (const v of Object.values(weeklyByDay.value ?? {})) {
    total += v.completed + v.pending + v.void;
    done += v.completed;
  }

  if (total === 0) {
    return '0%';
  }

  return `${((done / total) * 100).toFixed(2)}%`;
});

const todayIdx = 6;

const todayBreakdown = computed(() => {
  const days = getPast7Days();
  const todayKey = days[todayIdx]!;
  const v = (weeklyByDay.value ?? {})[todayKey] ?? { completed: 0, pending: 0, void: 0 };

  return [
    { label: 'Completed', value: v.completed, color: '#00C9F0' },
    { label: 'Pending', value: v.pending, color: '#33D4F5' },
    { label: 'Void', value: v.void, color: '#94A3B8' },
  ];
});

const alertBody = computed(() => {
  if (counters.maintenanceAlertCount.value > 0) {
    return `You have ${counters.maintenanceAlertCount.value} overdue maintenance task${counters.maintenanceAlertCount.value === 1 ? '' : 's'}.`;
  }

  const first = pendingDeliveries.value[0];

  if (first) {
    return `Pending delivery for [${first.customer?.name ?? 'a customer'}] is awaiting dispatch.`;
  }

  return 'All operations are running smoothly today.';
});

const alertHighlight = computed(() => pendingDeliveries.value[0]?.customer?.name ?? undefined);
const alertTo = computed(() => (counters.maintenanceAlertCount.value > 0 ? '/maintenance' : '/deliveries'));
</script>

<template>
  <div v-if="loading" class="flex h-full items-center justify-center">
    <BaseSpinner size="lg" />
  </div>

  <div v-else class="h-full overflow-y-auto p-4">
    <div class="space-y-4">
      <!-- 1. Greeting / alert banner -->
      <DashboardGreetingBanner title="Dear Manager" :body="alertBody" :highlight="alertHighlight" :to="alertTo" />

      <!-- 2. KPI row -->
      <div class="grid grid-cols-4 gap-4">
        <BaseKpiCard expandable icon-tone="gray" label="Active Customers" :value="counters.activeCustomerCount.value">
          <template #icon><IconCustomers :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable icon-tone="gray" label="Pending Deliveries" :value="counters.pendingDeliveryCount.value">
          <template #icon><IconDeliveries :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable icon-tone="gray" label="Upcoming Bookings" :value="counters.upcomingBookingCount.value">
          <template #icon><IconBookings :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard expandable icon-tone="gray" label="Weekly Completion" :value="deliveryCompletionPct">
          <template #icon><IconCheck :size="18" /></template>
        </BaseKpiCard>
      </div>

      <!-- 3. Two-column body -->
      <div class="grid grid-cols-2 gap-4">
        <DashboardTaskList :deliveries="deliveries" />

        <div class="space-y-4">
          <BaseCard padding="md">
            <BaseBarChart
              title="Graphs and Analysis"
              subtitle="Deliveries completed per day this week."
              :labels="weeklyRevenueLabels"
              :data="weeklyRevenueData"
              :highlight-index="todayIdx"
              :tooltip="todayBreakdown"
            >
              <template #action>
                <div class="flex items-center gap-1">
                  <span class="rounded-lg border border-sparkling-silver bg-bright-chrome px-2 py-1 text-[11px] font-medium text-casual-navy">Week</span>
                  <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-oslo hover:bg-bright-chrome">
                    <IconDownload :size="14" />
                  </button>
                </div>
              </template>
            </BaseBarChart>
          </BaseCard>

          <DashboardTopPerformance :performers="topPerformers" />
        </div>
      </div>
    </div>
  </div>
</template>
