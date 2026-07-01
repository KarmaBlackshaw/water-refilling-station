<script setup lang="ts">
import type { DeliverySaleRow } from '@/services/deliveries';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';
import { formatAddress } from '@/helpers/address';
import { today } from '@/helpers/date';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';

const { confirm } = useConfirm();

const { q: search, status: statusFilter, date: selectedDate } = useRouteQueryStrings({ q: '', status: '', date: today() });

const {
  data: deliveriesData,
  loading: boardLoading,
  run: reload,
} = useAsync(() => listDeliverySales(selectedDate.value || undefined, { search: search.value || undefined, status: statusFilter.value || undefined }), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
  watch: [search, statusFilter, selectedDate],
});

const deliveries = computed(() => deliveriesData.value ?? []);

const hasActiveFilter = computed(() => !!search.value || !!statusFilter.value);

const groups = computed(() => {
  const map = new Map<string | null, { riderName: string; items: DeliverySaleRow[] }>();

  for (const d of deliveries.value) {
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

const emptyDescription = computed(() => (hasActiveFilter.value ? 'No deliveries match your filters.' : 'No delivery sales for this date.'));

const reconcileOpen = ref(false);
const reconcileTarget = ref<DeliverySaleRow>();
const newDeliveryOpen = ref(false);
const editOpen = ref(false);
const editTarget = ref<DeliverySaleRow>();

function openReconcile(sale: DeliverySaleRow) {
  reconcileTarget.value = sale;
  reconcileOpen.value = true;
}

function openEdit(sale: DeliverySaleRow) {
  editTarget.value = sale;
  editOpen.value = true;
}

function confirmDelete(sale: DeliverySaleRow) {
  confirm({
    title: 'Delete delivery?',
    message: `Void the delivery for '${sale.customer?.name ?? 'this customer'}'? It will be removed from the board.`,
    variant: 'blaze-red',
    onConfirm: async () => {
      await voidSale(sale.id);
      await reload();
    },
  });
}

function rowMenu(sale: DeliverySaleRow) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(sale) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => confirmDelete(sale) },
  ];
}

function onReconciled() {
  reload();
}

function onDeliveryCreated(saleDate: string) {
  if (saleDate === selectedDate.value) {
    reload();
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
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Deliveries" subtitle="Track and manage all delivery orders" :count="deliveries.length">
        <template #actions>
          <BaseDatePicker v-model="selectedDate" class="w-44" />
          <BaseButton @click="newDeliveryOpen = true">New Delivery</BaseButton>
        </template>
      </BaseTableHeader>

      <!-- Loading + empty: one table, BaseTable picks spinner vs empty state itself.
           Initial load spins (date changes keep prior board via disableResetValue). -->
      <BaseTable
        v-if="groups.length === 0"
        :columns="deliveryColumns"
        :data="[]"
        :loading="boardLoading && deliveries.length === 0"
        empty-title="No deliveries"
        :empty-description="emptyDescription"
      />

      <!-- Board grouped by rider -->
      <div v-for="group in groups" v-else :key="group.riderId ?? 'unassigned'">
        <div class="flex items-center gap-2 px-5 pb-2">
          <h2 class="text-sm font-semibold text-casual-navy">{{ group.riderName }}</h2>
          <span class="rounded-full border border-sparkling-silver bg-bright-chrome px-2 py-0.5 text-xs font-medium text-independence">
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
            <div class="flex items-center justify-end gap-1">
              <BaseButton v-if="row.status === 'pending_delivery'" variant="full-white" @click="openReconcile(row)">Reconcile</BaseButton>
              <BaseTableActions :menu="rowMenu(row)" />
            </div>
          </template>
        </BaseTable>
      </div>
    </BaseCard>

    <DeliveryReconcileModal v-model="reconcileOpen" :sale="reconcileTarget" @reconciled="onReconciled" />
    <DeliveryEditModal v-model="editOpen" :sale="editTarget" @updated="reload" />
    <DeliveryNewModal v-model="newDeliveryOpen" :default-date="selectedDate" @created="onDeliveryCreated" />
  </div>
</template>
