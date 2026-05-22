<script setup lang="ts">
import { loadPricing as fetchPricing, resolvePrice as resolvePriceFn, type PricingData } from '@/services/pricing';
import type { Sale, Customer, Product, ContainerType, SaleLine, SalePayment } from '@/types/database';
import IconClose from '@/components/Icon/IconClose.vue';

const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');
const { success: toastSuccess, error: toastError } = useToast();

const pricingData = ref<PricingData>({ overrides: [], pricing: [] });

async function loadPricing(customerId: string | null) {
  pricingData.value = await fetchPricing(customerId);
}

function resolvePrice(productId: string, containerTypeId: string, isNewContainer: boolean): number {
  return resolvePriceFn(pricingData.value, productId, containerTypeId, isNewContainer);
}

type SaleRow = Sale & {
  customer?: { name: string } | null;
  total?: number;
};

const filterSource = ref('');
const filterStatus = ref('');
const filterFrom = ref('');
const filterTo = ref('');

const sourceOptions = [
  { label: 'All Sources', value: '' },
  { label: 'Walk-in', value: 'walk_in' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Booking', value: 'booking_fulfilled' },
];
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Void', value: 'void' },
  { label: 'Pending Delivery', value: 'pending_delivery' },
];

const {
  data: sales,
  loading: loadingSales,
  run: loadSales,
} = useAsync<SaleRow[]>(
  () =>
    listSales({
      source: filterSource.value || undefined,
      status: filterStatus.value || undefined,
      from: filterFrom.value || undefined,
      to: filterTo.value || undefined,
    }),
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
    watch: [filterSource, filterStatus, filterFrom, filterTo],
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

const voidTarget = ref<SaleRow | null>(null);
const voiding = ref(false);

async function confirmVoid() {
  if (!voidTarget.value) {
    return;
  }

  voiding.value = true;
  try {
    await voidSale(voidTarget.value.id);
    toastSuccess('Sale voided');
    voidTarget.value = null;
    await loadSales();
  } catch {
    toastError('Failed to void sale');
  } finally {
    voiding.value = false;
  }
}

const detailOpen = ref(false);
const detailSale = ref<(Sale & { customer?: { name: string } | null }) | null>(null);
const detailLines = ref<(SaleLine & { product?: { name: string }; container_type?: { name: string } })[]>([]);
const detailPayments = ref<SalePayment[]>([]);
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

const detailTotal = computed(() => detailPayments.value.reduce((s, p) => s + p.amount_centavos, 0));

const posOpen = ref(false);
const saving = ref(false);

// Customer search
type CustomerWithArea = Customer & { area: { id: string; name: string } | null };

const { data: customers } = useAsync<CustomerWithArea[]>(
  () => listCustomers(tenantId.value, branchId.value).then((r) => (r.data ?? []) as CustomerWithArea[]),
  { immediate: true, defaultValue: [], disableResetValue: true },
);
const customerSearch = ref('');
const selectedCustomer = ref<CustomerWithArea | null>(null);
const showCustomerDropdown = ref(false);

const filteredCustomers = computed(() => {
  const q = customerSearch.value.toLowerCase().trim();

  if (!q) {
    return customers.value!.slice(0, 10);
  }

  return customers.value!.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)).slice(0, 10);
});

function closeCustomerDropdown() {
  setTimeout(() => {
    showCustomerDropdown.value = false;
  }, 150);
}

function selectCustomer(c: CustomerWithArea) {
  selectedCustomer.value = c;
  customerSearch.value = c.name;
  showCustomerDropdown.value = false;
  loadPricing(c.id);
  // Re-resolve prices for all existing lines
  for (const line of posLines.value) {
    if (line.product_id && line.container_type_id) {
      line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
    }
  }
}

function clearCustomer() {
  selectedCustomer.value = null;
  customerSearch.value = '';
  loadPricing(null);
}

// Products & container types
const { data: products } = useAsync<Product[]>(() => listProducts(tenantId.value, branchId.value).then((r) => (r.data ?? []) as Product[]), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});
const { data: containerTypes } = useAsync<ContainerType[]>(
  () => listContainerTypes(tenantId.value, branchId.value).then((r) => (r.data ?? []) as ContainerType[]),
  { immediate: true, defaultValue: [], disableResetValue: true },
);

const productOptions = computed(() => products.value!.map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => containerTypes.value!.map((ct) => ({ label: ct.name, value: ct.id })));

// Line items
interface PosLine {
  id: number;
  product_id: string;
  container_type_id: string;
  quantity: number;
  unit_price_centavos: number;
  is_new_container: boolean;
}

let lineCounter = 0;

function makeLine(): PosLine {
  return {
    id: ++lineCounter,
    product_id: '',
    container_type_id: '',
    quantity: 1,
    unit_price_centavos: 0,
    is_new_container: false,
  };
}

const posLines = ref<PosLine[]>([makeLine()]);

function addLine() {
  posLines.value.push(makeLine());
}

function removeLine(id: number) {
  if (posLines.value.length === 1) {
    return;
  }

  posLines.value = posLines.value.filter((l) => l.id !== id);
}

function onLineProductOrContainerChange(line: PosLine) {
  if (line.product_id && line.container_type_id) {
    line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
  }
}

function onNewContainerChange(line: PosLine) {
  if (line.product_id && line.container_type_id) {
    line.unit_price_centavos = resolvePrice(line.product_id, line.container_type_id, line.is_new_container);
  }
}

const linesTotal = computed(() => posLines.value.reduce((s, l) => s + l.quantity * l.unit_price_centavos, 0));

// Payments
interface PosPayment {
  id: number;
  method: string;
  amount_centavos: number;
  gcash_ref: string;
}

let payCounter = 0;

function makePayment(): PosPayment {
  return { id: ++payCounter, method: 'cash', amount_centavos: 0, gcash_ref: '' };
}

const posPayments = ref<PosPayment[]>([makePayment()]);

function addPayment() {
  posPayments.value.push(makePayment());
}

function removePayment(id: number) {
  if (posPayments.value.length === 1) {
    return;
  }

  posPayments.value = posPayments.value.filter((p) => p.id !== id);
}

const paymentsTotal = computed(() => posPayments.value.reduce((s, p) => s + p.amount_centavos, 0));

const balance = computed(() => paymentsTotal.value - linesTotal.value);

// POS form date & notes
const posDate = ref(today());
const posNotes = ref('');

const paymentMethodOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'GCash', value: 'gcash' },
  { label: 'On Account', value: 'on_account' },
];

function openPos() {
  posLines.value = [makeLine()];
  posPayments.value = [makePayment()];
  selectedCustomer.value = null;
  customerSearch.value = '';
  posDate.value = today();
  posNotes.value = '';
  loadPricing(null);
  posOpen.value = true;
}

async function submitSale() {
  const validLines = posLines.value.filter((l) => l.product_id && l.container_type_id && l.quantity > 0);

  if (validLines.length === 0) {
    toastError('Add at least one line item');
    return;
  }

  const validPayments = posPayments.value.filter((p) => p.amount_centavos > 0);

  if (validPayments.length === 0) {
    toastError('Add at least one payment');
    return;
  }

  saving.value = true;
  try {
    await createWalkInSale({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      customer_id: selectedCustomer.value?.id ?? null,
      cashier_id: auth.authUser?.id ?? null,
      sale_date: posDate.value,
      notes: posNotes.value || null,
      lines: validLines.map((l) => ({
        product_id: l.product_id,
        container_type_id: l.container_type_id,
        quantity: l.quantity,
        unit_price_centavos: l.unit_price_centavos,
        is_new_container: l.is_new_container,
      })),
      payments: validPayments.map((p) => ({
        method: p.method,
        amount_centavos: p.amount_centavos,
        gcash_ref: p.gcash_ref || null,
      })),
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
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Sales</h1>
          <p class="text-sm text-oslo">Record and manage walk-in and delivery sales</p>
        </div>
        <BaseButton @click="openPos">New Walk-in Sale</BaseButton>
      </div>

      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <BaseSelect v-model="filterSource" :options="sourceOptions" class="w-40" />
        <BaseSelect v-model="filterStatus" :options="statusOptions" class="w-44" />
        <BaseDatePicker v-model="filterFrom" label="" placeholder="From" class="w-40" />
        <BaseDatePicker v-model="filterTo" label="" placeholder="To" class="w-40" />
      </div>

      <BaseCard padding="none">
        <BaseTable
          :columns="[
            { key: 'sale_date', label: 'Date' },
            { key: 'customer', label: 'Customer' },
            { key: 'source', label: 'Source' },
            { key: 'items', label: 'Items' },
            { key: 'total', label: 'Total', align: 'right', class: 'num' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '', align: 'right' },
          ]"
          :data="sales"
          :loading="loadingSales"
          empty-title="No sales found"
        >
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
            <BaseButton variant="independence" @click="openDetail(row)">View</BaseButton>
            <BaseButton v-if="row.status !== 'void'" variant="independence" class="text-blaze-red" @click="voidTarget = row"> Void </BaseButton>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <!-- ── Sale Detail Modal ─────────────────────────────────────── -->
    <BaseModal :open="detailOpen" title="Sale Detail" size="xl" @close="detailOpen = false">
      <BaseSpinner v-if="loadingDetail" class="mx-auto my-4" />
      <div v-else-if="detailSale" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-independence">Date: </span>
            <span class="text-casual-navy">{{ detailSale.sale_date }}</span>
          </div>
          <div>
            <span class="text-independence">Customer: </span>
            <span class="text-casual-navy">{{ detailSale.customer?.name ?? 'Anonymous' }}</span>
          </div>
          <div>
            <span class="text-independence">Source: </span>
            <BaseBadge :variant="sourceBadgeVariant(detailSale.source)">
              {{ sourceLabel(detailSale.source) }}
            </BaseBadge>
          </div>
          <div>
            <span class="text-independence">Status: </span>
            <BaseBadge :variant="statusBadgeVariant(detailSale.status)">
              {{ statusLabel(detailSale.status) }}
            </BaseBadge>
          </div>
          <div v-if="detailSale.notes" class="col-span-2">
            <span class="text-independence">Notes: </span>
            <span class="text-casual-navy">{{ detailSale.notes }}</span>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-casual-navy mb-2">Line Items</h3>
          <BaseTable
            :columns="[
              { key: 'product', label: 'Product' },
              { key: 'container', label: 'Container' },
              { key: 'is_new_container', label: 'New?' },
              { key: 'quantity', label: 'Qty', align: 'right', class: 'num' },
              { key: 'unit_price', label: 'Unit Price', align: 'right', class: 'num' },
              { key: 'subtotal', label: 'Subtotal', align: 'right', class: 'num' },
            ]"
            :data="detailLines"
          >
            <template #cell-product="{ row }">{{ row.product?.name ?? '—' }}</template>
            <template #cell-container="{ row }">{{ row.container_type?.name ?? '—' }}</template>
            <template #cell-is_new_container="{ row }">{{ row.is_new_container ? 'Yes' : 'No' }}</template>
            <template #cell-unit_price="{ row }">{{ formatMoney(row.unit_price_centavos) }}</template>
            <template #cell-subtotal="{ row }">{{ formatMoney(row.quantity * row.unit_price_centavos) }}</template>
          </BaseTable>
        </div>

        <div>
          <h3 class="text-sm font-semibold text-casual-navy mb-2">Payments</h3>
          <BaseTable
            :columns="[
              { key: 'method', label: 'Method', class: 'capitalize' },
              { key: 'gcash_ref', label: 'GCash Ref' },
              { key: 'amount', label: 'Amount', align: 'right', class: 'num' },
            ]"
            :data="detailPayments"
          >
            <template #cell-gcash_ref="{ row }">{{ row.gcash_ref ?? '—' }}</template>
            <template #cell-amount="{ row }">{{ formatMoney(row.amount_centavos) }}</template>
          </BaseTable>
          <div class="text-right mt-2 text-sm font-semibold text-casual-navy num">Total: {{ formatMoney(detailTotal) }}</div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="independence" @click="detailOpen = false">Close</BaseButton>
      </template>
    </BaseModal>

    <!-- ── Void Confirm ──────────────────────────────────────────── -->
    <BaseConfirm
      :open="voidTarget !== null"
      title="Void this sale?"
      :message="`This will void the sale from ${voidTarget?.sale_date}. This action cannot be undone.`"
      @confirm="confirmVoid"
      @cancel="voidTarget = null"
    />

    <!-- ── New Walk-in Sale Modal (POS) ──────────────────────────── -->
    <BaseModal :open="posOpen" title="New Walk-in Sale" size="xl" @close="posOpen = false">
      <form id="pos-form" class="space-y-6" @submit.prevent="submitSale">
        <!-- Date & Notes row -->
        <div class="grid grid-cols-2 gap-4">
          <BaseDatePicker v-model="posDate" label="Sale Date" :required="true" />
          <BaseInput v-model="posNotes" label="Notes (optional)" placeholder="Any notes..." />
        </div>

        <!-- Customer search -->
        <div class="relative">
          <label class="text-xs font-medium text-oslo block mb-1"> Customer (optional) </label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <BaseInput
                v-model="customerSearch"
                placeholder="Search by name or phone..."
                @focus="showCustomerDropdown = true"
                @blur="closeCustomerDropdown"
                @input="showCustomerDropdown = true"
              />
              <div
                v-if="showCustomerDropdown && filteredCustomers.length > 0"
                class="absolute z-30 mt-1 w-full bg-full-white border border-sparkling-silver rounded-lg shadow-lg overflow-hidden"
              >
                <button
                  v-for="c in filteredCustomers"
                  :key="c.id"
                  type="button"
                  class="w-full text-left px-3 py-2 text-sm hover:bg-bright-chrome text-casual-navy flex justify-between"
                  @mousedown.prevent="selectCustomer(c)"
                >
                  <span>{{ c.name }}</span>
                  <span class="text-independence text-xs">{{ c.area?.name ?? '' }}</span>
                </button>
              </div>
            </div>
            <BaseButton v-if="selectedCustomer" type="button" variant="independence" @click="clearCustomer"> Clear </BaseButton>
          </div>
          <p v-if="selectedCustomer" class="text-xs text-dark-green-turquoise mt-1">
            Selected: {{ selectedCustomer.name }}
            <span v-if="selectedCustomer.area"> — {{ selectedCustomer.area.name }}</span>
          </p>
        </div>

        <!-- Line Items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold text-casual-navy">Line Items</h3>
          </div>

          <div class="space-y-2">
            <div v-for="line in posLines" :key="line.id" class="grid grid-cols-[1fr_1fr_auto_80px_110px_auto_auto] gap-2 items-end">
              <BaseSelect
                v-model="line.product_id"
                :options="productOptions"
                placeholder="Product"
                @update:model-value="onLineProductOrContainerChange(line)"
              />
              <BaseSelect
                v-model="line.container_type_id"
                :options="containerTypeOptions"
                placeholder="Container"
                @update:model-value="onLineProductOrContainerChange(line)"
              />
              <div class="flex flex-col gap-1 items-center justify-end pb-0.5">
                <span class="text-xs text-oslo whitespace-nowrap">New?</span>
                <BaseCheckbox v-model="line.is_new_container" @update:model-value="onNewContainerChange(line)" />
              </div>
              <BaseInput v-model.number="line.quantity" type="number" label="Qty" min="1" :required="true" />
              <BaseInput v-model.number="line.unit_price_centavos" type="number" label="Unit Price (¢)" min="0" />
              <div class="flex flex-col justify-end pb-0.5">
                <span class="text-xs text-independence whitespace-nowrap num">
                  {{ formatMoney(line.quantity * line.unit_price_centavos) }}
                </span>
              </div>
              <button
                type="button"
                class="mb-0.5 text-blaze-red hover:opacity-70 transition-opacity"
                aria-label="Remove line"
                :disabled="posLines.length === 1"
                @click="removeLine(line.id)"
              >
                <IconClose class="size-4" />
              </button>
            </div>
          </div>

          <BaseButton type="button" variant="independence" class="mt-2" @click="addLine"> + Add Item </BaseButton>
        </div>

        <!-- Payments -->
        <div>
          <h3 class="text-sm font-semibold text-casual-navy mb-2">Payment</h3>

          <div class="space-y-2">
            <div v-for="pay in posPayments" :key="pay.id" class="grid grid-cols-[160px_1fr_1fr_auto] gap-2 items-end">
              <BaseSelect v-model="pay.method" :options="paymentMethodOptions" label="Method" />
              <BaseInput v-model.number="pay.amount_centavos" type="number" label="Amount (¢)" min="0" />
              <BaseInput v-if="pay.method === 'gcash'" v-model="pay.gcash_ref" label="GCash Ref" placeholder="Ref number" />
              <div v-else />
              <button
                type="button"
                class="mb-0.5 text-blaze-red hover:opacity-70 transition-opacity"
                aria-label="Remove payment"
                :disabled="posPayments.length === 1"
                @click="removePayment(pay.id)"
              >
                <IconClose class="size-4" />
              </button>
            </div>
          </div>

          <BaseButton type="button" variant="independence" class="mt-2" @click="addPayment"> + Add Payment </BaseButton>
        </div>

        <!-- Summary -->
        <div class="rounded-lg border border-sparkling-silver bg-bright-chrome p-4 space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-independence">Items Total</span>
            <span class="num text-casual-navy">{{ formatMoney(linesTotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-independence">Payment Total</span>
            <span class="num text-casual-navy">{{ formatMoney(paymentsTotal) }}</span>
          </div>
          <div class="flex justify-between border-t border-sparkling-silver pt-1 font-semibold">
            <span :class="balance >= 0 ? 'text-dark-green-turquoise' : 'text-blaze-red'">
              {{ balance >= 0 ? 'Change' : 'Remaining' }}
            </span>
            <span class="num" :class="balance >= 0 ? 'text-dark-green-turquoise' : 'text-blaze-red'">
              {{ formatMoney(Math.abs(balance)) }}
            </span>
          </div>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="independence" @click="posOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="pos-form" :loading="saving">Record Sale</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
