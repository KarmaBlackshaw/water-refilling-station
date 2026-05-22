<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries';

const route = useRoute();
const selectedDate = ref(new Date().toISOString().slice(0, 10));

const STATUS_QUERY_MAP: Record<string, string[]> = {
  pending: ['pending_delivery'],
  completed: ['completed', 'booking_fulfilled'],
  void: ['void'],
};

const statusFilter = computed(() => {
  const q = route.query.status;

  return typeof q === 'string' ? q : null;
});

const {
  data: deliveriesData,
  loading: boardLoading,
  run: loadDeliveries,
} = useAsync(() => listDeliverySales(selectedDate.value), {
  immediate: true,
  defaultValue: [],
  watch: selectedDate,
  disableResetValue: true,
});

const deliveries = computed(() => deliveriesData.value ?? []);

const filteredDeliveries = computed(() => {
  if (!statusFilter.value) {
    return deliveries.value;
  }

  const allowed = STATUS_QUERY_MAP[statusFilter.value];

  if (!allowed) {
    return deliveries.value;
  }

  return deliveries.value.filter((d) => allowed.includes(d.status));
});

const groups = computed(() => {
  const map = new Map<string | null, { riderName: string; items: DeliverySaleRow[] }>();

  for (const d of filteredDeliveries.value) {
    const key = d.rider_id;
    const existing = map.get(key);

    if (existing) {
      existing.items.push(d);
    } else {
      map.set(key, {
        riderName: d.rider?.full_name ?? 'Unassigned',
        items: [d],
      });
    }
  }
  const entries = [...map.entries()].sort(([a], [b]) => {
    if (a === null) {
      return 1;
    }

    if (b === null) {
      return -1;
    }

    return 0;
  });

  return entries.map(([key, val]) => ({ riderId: key, ...val }));
});

function saleTotal(sale: DeliverySaleRow): number {
  return sale.lines.reduce((sum, l) => sum + l.quantity * l.unit_price_centavos, 0);
}

const reconcileOpen = ref(false);
const reconcileTarget = ref<DeliverySaleRow>();
const newDeliveryOpen = ref(false);

function openReconcile(sale: DeliverySaleRow) {
  reconcileTarget.value = sale;
  reconcileOpen.value = true;
}

function onReconciled() {
  loadDeliveries();
}

function onDeliveryCreated(saleDate: string) {
  if (saleDate === selectedDate.value) {
    loadDeliveries();
  }
}

function statusLabel(status: string) {
  if (status === 'pending_delivery') {
    return 'Pending';
  }

  if (status === 'completed') {
    return 'Delivered';
  }

  return status;
}

function statusVariant(status: string): 'warning' | 'success' | 'default' {
  if (status === 'pending_delivery') {
    return 'warning';
  }

  if (status === 'completed') {
    return 'success';
  }

  return 'default';
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Deliveries</h1>
          <p class="text-sm text-oslo">Track and manage all delivery orders</p>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <BaseDatePicker v-model="selectedDate" class="w-44" />
          <BaseButton @click="newDeliveryOpen = true">New Delivery</BaseButton>
        </div>
      </div>

      <!-- Board -->
      <BaseSpinner v-if="boardLoading" class="mx-auto mt-10" />
      <BaseEmptyState v-else-if="deliveries.length === 0" title="No deliveries" description="No delivery sales for this date." />
      <div v-else class="space-y-8">
        <section v-for="group in groups" :key="group.riderId ?? 'unassigned'">
          <div class="mb-3 flex items-center gap-2">
            <h2 class="text-sm font-semibold text-casual-navy">{{ group.riderName }}</h2>
            <span class="inline-flex items-center justify-center rounded-full bg-[--color-surface-raised] px-2 py-0.5 text-xs font-medium text-independence">
              {{ group.items.length }}
            </span>
          </div>
          <div class="grid gap-3 grid-cols-3">
            <BaseCard v-for="sale in group.items" :key="sale.id" padding="sm" class="flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-medium text-casual-navy">{{ sale.customer?.name ?? '—' }}</p>
                  <p v-if="sale.customer?.phone" class="text-xs text-independence">{{ sale.customer.phone }}</p>
                </div>
                <BaseBadge :variant="statusVariant(sale.status)">{{ statusLabel(sale.status) }}</BaseBadge>
              </div>
              <p v-if="sale.address" class="text-xs text-independence">{{ sale.address.label }} — {{ sale.address.address_line }}</p>
              <ul class="space-y-0.5">
                <li v-for="line in sale.lines" :key="line.id" class="text-xs text-casual-navy">
                  {{ line.quantity }}× {{ line.container_type?.name ?? '?' }}
                  {{ line.product?.name ?? '' }}
                  <span class="text-independence">
                    @ <span class="num">{{ formatMoney(line.unit_price_centavos) }}</span>
                  </span>
                </li>
              </ul>
              <p class="text-sm font-semibold text-casual-navy">
                Total: <span class="num">{{ formatMoney(saleTotal(sale)) }}</span>
              </p>
              <p v-if="sale.notes" class="text-xs italic text-independence">{{ sale.notes }}</p>
              <div v-if="sale.status === 'pending_delivery'" class="pt-1">
                <BaseButton variant="full-white" @click="openReconcile(sale)">Reconcile</BaseButton>
              </div>
              <p v-else class="pt-1 text-xs text-independence">Delivered</p>
            </BaseCard>
          </div>
        </section>
      </div>
    </div>

    <DeliveryReconcileModal v-model="reconcileOpen" :sale="reconcileTarget" @reconciled="onReconciled" />
    <DeliveryNewModal v-model="newDeliveryOpen" :default-date="selectedDate" @created="onDeliveryCreated" />
  </div>
</template>
