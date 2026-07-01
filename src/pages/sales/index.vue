<script setup lang="ts">
import type { BadgeVariant, FilterDefinition, FilterValues } from '@/types';
import type { SaleDetail, SaleWithCustomer } from '@/services/sales';
import type { WalkInSubmitPayload } from '@/components/Sale/WalkInModal.vue';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { SaleSource, SaleStatus } from '@/types/database';
import IconTrash from '@/components/Icon/IconTrash.vue';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);
const { success: toastSuccess, error: toastError } = useToast();

type SaleRow = SaleWithCustomer & { total?: number };

const SOURCE_VALUES: SaleSource[] = ['walk_in', 'delivery', 'booking_fulfilled'];
const STATUS_VALUES: SaleStatus[] = ['pending_delivery', 'completed', 'void'];

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

/** Runtime guard: returns the typed enum value only when `v` is a known `SaleSource`. */
function toSaleSource(v: string): SaleSource | undefined {
  return SOURCE_VALUES.find((s) => s === v);
}

/** Runtime guard: returns the typed enum value only when `v` is a known `SaleStatus`. */
function toSaleStatus(v: string): SaleStatus | undefined {
  return STATUS_VALUES.find((s) => s === v);
}

const { q: search, source, status, from, to } = useRouteQueryStrings({ q: '', source: '', status: '', from: '', to: '' });

/** Bridges individual URL-backed refs to the object shape `BaseTableFilterBar` expects. */
const filterValues = computed<FilterValues>({
  get: () => ({ source: source.value, status: status.value, from: from.value, to: to.value }),
  set: (v) => {
    source.value = v.source ?? '';
    status.value = v.status ?? '';
    from.value = v.from ?? '';
    to.value = v.to ?? '';
  },
});

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { key: 'source', label: 'Source', field: 'select', options: sourceOptions },
  { key: 'status', label: 'Status', field: 'select', options: statusOptions },
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
]);

const {
  data: salesRes,
  loading: loadingSales,
  run: loadSales,
} = useAsync(
  () =>
    listSales({
      source: toSaleSource(source.value),
      status: toSaleStatus(status.value),
      from: from.value || undefined,
      to: to.value || undefined,
      search: search.value || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: [search, source, status, from, to],
  },
);

const sales = computed(() => salesRes.value ?? []);

function sourceBadgeVariant(src: string): BadgeVariant {
  if (src === 'delivery') {
    return 'info';
  }

  if (src === 'booking_fulfilled') {
    return 'warning';
  }

  return 'default';
}

function sourceLabel(src: string) {
  if (src === 'walk_in') {
    return 'Walk-in';
  }

  if (src === 'delivery') {
    return 'Delivery';
  }

  if (src === 'booking_fulfilled') {
    return 'Booking';
  }

  return src;
}

function statusBadgeVariant(st: string): BadgeVariant {
  if (st === 'completed') {
    return 'success';
  }

  if (st === 'void') {
    return 'danger';
  }

  if (st === 'pending_delivery') {
    return 'warning';
  }

  return 'default';
}

function statusLabel(st: string) {
  if (st === 'pending_delivery') {
    return 'Pending';
  }

  return st.charAt(0).toUpperCase() + st.slice(1);
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
      <BaseTableHeader v-model:search="search" title="Sales" subtitle="Record and manage walk-in and delivery sales" :count="sales.length">
        <template #actions>
          <BaseButton @click="posOpen = true">New Walk-in Sale</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTableFilterBar v-model="filterValues" :definitions="filterDefinitions" />

      <BaseTable :columns="salesColumns" :data="sales" :loading="loadingSales" empty-title="No sales found">
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
