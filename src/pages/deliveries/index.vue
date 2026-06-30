<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import { formatAddress } from '@/helpers/address';

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

const deliveryColumns: TableColumn<DeliverySaleRow>[] = [
  { key: 'customer', label: 'Customer' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: '', align: 'right' },
];
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
      <div v-else class="space-y-6">
        <BaseCard v-for="group in groups" :key="group.riderId ?? 'unassigned'" padding="none">
          <div class="flex items-center gap-2 px-5 py-3">
            <h2 class="text-sm font-semibold text-casual-navy">{{ group.riderName }}</h2>
            <span class="inline-flex items-center justify-center rounded-full bg-[--color-surface-raised] px-2 py-0.5 text-xs font-medium text-independence">
              {{ group.items.length }}
            </span>
          </div>
          <BaseTable :columns="deliveryColumns" :data="group.items" row-key="id">
            <template #cell-customer="{ row }">
              <p class="font-medium text-casual-navy">{{ row.customer?.name ?? '—' }}</p>
              <p v-if="row.customer?.phone" class="text-xs text-independence">{{ row.customer.phone }}</p>
            </template>

            <template #cell-address="{ row }">
              <p v-if="row.address" class="text-independence">{{ row.address.label }} — {{ formatAddress(row.address) }}</p>
              <p v-else class="text-oslo">—</p>
              <p v-if="row.notes" class="text-xs italic text-oslo">{{ row.notes }}</p>
            </template>

            <template #cell-status="{ row }">
              <BaseBadge :variant="statusVariant(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
            </template>

            <template #cell-action="{ row }">
              <BaseButton v-if="row.status === 'pending_delivery'" variant="full-white" @click="openReconcile(row)">Reconcile</BaseButton>
              <span v-else class="text-xs text-independence">Delivered</span>
            </template>
          </BaseTable>
        </BaseCard>
      </div>
    </div>

    <DeliveryReconcileModal v-model="reconcileOpen" :sale="reconcileTarget" @reconciled="onReconciled" />
    <DeliveryNewModal v-model="newDeliveryOpen" :default-date="selectedDate" @created="onDeliveryCreated" />
  </div>
</template>
