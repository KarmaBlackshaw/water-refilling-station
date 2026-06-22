<script setup lang="ts">
import type { FilterDefinition, FilterValues } from '@/types';
import type { SaleDetail, SaleWithCustomer } from '@/services/sales';
import type { WalkInSubmitPayload } from '@/components/Sale/WalkInModal.vue';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);
const { success: toastSuccess, error: toastError } = useToast();

type SaleRow = SaleWithCustomer & { total?: number };

const sourceOptions = [
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Booking', value: 'booking_fulfilled' },
];
const statusOptions = [
  { label: 'Completed', value: 'completed' },
  { label: 'Void', value: 'void' },
  { label: 'Pending Delivery', value: 'pending_delivery' },
];

const filterValues = ref<FilterValues>({
  source: '',
  status: '',
  from: '',
  to: '',
});

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { key: 'source', label: 'Source', field: 'select', options: sourceOptions },
  { key: 'status', label: 'Status', field: 'select', options: statusOptions },
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
]);

const {
  data: sales,
  loading: loadingSales,
  run: loadSales,
} = useAsync(
  () =>
    listSales({
      source: filterValues.value.source || undefined,
      status: filterValues.value.status || undefined,
      from: filterValues.value.from || undefined,
      to: filterValues.value.to || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: filterValues,
  },
);

function sourceBadgeVariant(source: string): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  if (source === 'delivery') {
    return 'info';
  }

  if (source === 'booking_fulfilled') {
    return 'warning';
  }

  return 'default';
}

function sourceLabel(source: string) {
  if (source === 'walk_in') {
    return 'Walk-in';
  }

  if (source === 'delivery') {
    return 'Delivery';
  }

  if (source === 'booking_fulfilled') {
    return 'Booking';
  }

  return source;
}

function statusBadgeVariant(status: string): 'default' | 'info' | 'warning' | 'success' | 'danger' {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'void') {
    return 'danger';
  }

  if (status === 'pending_delivery') {
    return 'warning';
  }

  return 'default';
}

function statusLabel(status: string) {
  if (status === 'pending_delivery') {
    return 'Pending';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

const detailOpen = ref(false);
const detailSale = ref<SaleDetail['sale']>();
const detailLines = ref<SaleDetail['lines']>([]);
const detailPayments = ref<SaleDetail['payments']>([]);
const loadingDetail = ref(false);

async function openDetail(sale: SaleRow) {
  loadingDetail.value = true;
  detailOpen.value = true;
  try {
    const result = await getSale(sale.id);

    if (result) {
      detailSale.value = result.sale;
      detailLines.value = result.lines;
      detailPayments.value = result.payments;
    }
  } finally {
    loadingDetail.value = false;
  }
}

const posOpen = ref(false);
const saving = ref(false);

const { data: customersRes } = useAsync(() => listCustomers(tenantId.value, branchId.value), {
  immediate: true,
  disableResetValue: true,
});
const customers = computed(() => customersRes.value?.data ?? []);

const { data: productsRes } = useAsync(() => listProducts(tenantId.value, branchId.value), {
  immediate: true,
  disableResetValue: true,
});
const products = computed(() => productsRes.value?.data ?? []);

const { data: containerTypesRes } = useAsync(() => listContainerTypes(tenantId.value, branchId.value), {
  immediate: true,
  disableResetValue: true,
});
const containerTypes = computed(() => containerTypesRes.value?.data ?? []);

async function submitWalkIn(payload: WalkInSubmitPayload) {
  saving.value = true;
  try {
    await createWalkInSale({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      customer_id: payload.customer_id,
      cashier_id: auth.authUser?.id ?? null,
      sale_date: payload.sale_date,
      notes: payload.notes,
      lines: payload.lines,
      payments: payload.payments,
    });
    toastSuccess('Sale recorded successfully');
    posOpen.value = false;
    await loadSales();
  } catch {
    toastError('Failed to record sale');
  } finally {
    saving.value = false;
  }
}

const search = ref('');

const filteredSales = computed(() => {
  const q = search.value.trim().toLowerCase();

  if (!q) {
    return sales.value ?? [];
  }

  return (sales.value ?? []).filter((s) => s.customer?.name?.toLowerCase().includes(q));
});

const salesColumns: TableColumn<SaleRow>[] = [
  { key: 'sale_date', label: 'Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'source', label: 'Source' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total', align: 'right', class: 'num' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
];

function rowMenu(row: SaleRow) {
  return [
    { label: 'View', onClick: () => openDetail(row) },
    {
      label: 'Void',
      icon: IconTrash,
      danger: true,
      hidden: row.status === 'void',
      onClick: () =>
        confirm({
          title: 'Void this sale?',
          message: `This will void the sale from ${row.sale_date}. This action cannot be undone.`,
          onConfirm: async () => {
            try {
              await voidSale(row.id);
              toastSuccess('Sale voided');
              await loadSales();
            } catch {
              toastError('Failed to void sale');
            }
          },
        }),
    },
  ];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Sales" subtitle="Record and manage walk-in and delivery sales" :count="filteredSales.length">
        <template #actions>
          <BaseButton @click="posOpen = true">New Walk-in Sale</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTableFilterBar v-model="filterValues" :definitions="filterDefinitions" />

      <BaseTable :columns="salesColumns" :data="filteredSales" :loading="loadingSales" empty-title="No sales found">
        <template #cell-customer="{ row }">{{ row.customer?.name ?? '—' }}</template>
        <template #cell-source="{ row }">
          <BaseBadge :variant="sourceBadgeVariant(row.source)">{{ sourceLabel(row.source) }}</BaseBadge>
        </template>
        <template #cell-items>—</template>
        <template #cell-total>—</template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="statusBadgeVariant(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="rowMenu(row)" />
        </template>
      </BaseTable>
    </BaseCard>

    <SaleDetailModal
      v-model:open="detailOpen"
      :sale="detailSale"
      :lines="detailLines"
      :payments="detailPayments"
      :loading="loadingDetail"
      :source-badge-variant="sourceBadgeVariant"
      :source-label="sourceLabel"
      :status-badge-variant="statusBadgeVariant"
      :status-label="statusLabel"
    />

    <SaleWalkInModal
      v-model:open="posOpen"
      :customers="customers ?? []"
      :products="products ?? []"
      :container-types="containerTypes ?? []"
      :saving="saving"
      @submit="submitWalkIn"
    />
  </div>
</template>
