<script setup lang="ts">
import type { Customer, CustomerAddress, CustomerPriceOverride, Sale } from '@/types/database';
import { formatMoney } from '@/helpers/money';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const route = useRoute();
const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

type CustomerWithArea = Customer & { area: { id: string; name: string } | null };
type PriceOverrideWithRels = CustomerPriceOverride & {
  product: { name: string } | null;
  container_type: { name: string } | null;
};
type SaleWithLines = Sale & { sale_lines: unknown[]; sale_payments: unknown[] };
type PageData = {
  customer: CustomerWithArea | null;
  addresses: CustomerAddress[];
  priceOverrides: PriceOverrideWithRels[];
  sales: SaleWithLines[];
  containerBalance: Record<string, number>;
  arBalance: number;
};

const activeTab = ref('overview');

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'price-overrides', label: 'Price Overrides' },
  { key: 'sales', label: 'Sales History' },
];

const {
  data: pageData,
  loading,
  run: load,
} = useAsync<PageData>(
  async () => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

    if (!id) {
      throw new Error('Customer ID is required');
    }

    const [custRes, addrRes, overrideRes, salesRes, balanceRes, arRes] = await Promise.all([
      getCustomer(id),
      listAddresses(id),
      listPriceOverrides(id),
      listCustomerSales(id),
      getContainerBalance(id),
      getARBalance(id),
    ]);

    return {
      customer: custRes.data,
      addresses: addrRes.data ?? [],
      priceOverrides: overrideRes.data ?? [],
      sales: salesRes.data ?? [],
      containerBalance: balanceRes,
      arBalance: arRes,
    };
  },
  {
    immediate: true,
    defaultValue: {
      customer: null,
      addresses: [],
      priceOverrides: [],
      sales: [],
      containerBalance: {},
      arBalance: 0,
    },
    disableResetValue: true,
  },
);

const customer = computed(() => pageData.value?.customer ?? null);
const addresses = computed(() => pageData.value?.addresses ?? []);
const priceOverrides = computed(() => pageData.value?.priceOverrides ?? []);
const sales = computed(() => pageData.value?.sales ?? []);
const containerBalance = computed(() => pageData.value?.containerBalance ?? {});
const arBalance = computed(() => pageData.value?.arBalance ?? 0);

const addrModalOpen = ref(false);
const editingAddr = ref<CustomerAddress>();
const addrSaving = ref(false);
const deleteAddrConfirm = ref<CustomerAddress>();

function openAddAddr() {
  editingAddr.value = undefined;
  addrModalOpen.value = true;
}

function openEditAddr(a: CustomerAddress) {
  editingAddr.value = a;
  addrModalOpen.value = true;
}

async function saveAddr(payload: { label: string; address_line: string; is_default: boolean }) {
  if (!customer.value) {
    return;
  }

  addrSaving.value = true;
  if (editingAddr.value) {
    await updateAddress(editingAddr.value.id, payload);
  } else {
    await createAddress({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      customer_id: customer.value.id,
      ...payload,
    });
  }

  addrModalOpen.value = false;
  await load();
  addrSaving.value = false;
}

async function confirmDeleteAddr() {
  if (!deleteAddrConfirm.value || !auth.authUser) {
    return;
  }

  await softDeleteAddress(deleteAddrConfirm.value.id, auth.authUser.id);
  deleteAddrConfirm.value = undefined;
  await load();
}

const overrideModalOpen = ref(false);
const overrideSaving = ref(false);
const deleteOverrideConfirm = ref<PriceOverrideWithRels>();

function openAddOverride() {
  overrideModalOpen.value = true;
}

async function saveOverride(payload: { product_id: string; container_type_id: string; refill_price_centavos: number; new_container_price_centavos: number }) {
  if (!customer.value) {
    return;
  }

  overrideSaving.value = true;
  await upsertPriceOverride({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    customer_id: customer.value.id,
    ...payload,
  });
  overrideModalOpen.value = false;
  await load();
  overrideSaving.value = false;
}

async function confirmDeleteOverride() {
  if (!deleteOverrideConfirm.value || !auth.authUser) {
    return;
  }

  await softDeletePriceOverride(deleteOverrideConfirm.value.id, auth.authUser.id);
  deleteOverrideConfirm.value = undefined;
  await load();
}

const hasContainerBalance = computed(() => Object.keys(containerBalance.value).length > 0);

const defaultAddress = computed(() => {
  const live = addresses.value.filter((a) => !a.deleted_at);

  return live.find((a) => a.is_default) ?? live[0] ?? null;
});

function addrMenu(addr: CustomerAddress) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditAddr(addr) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => (deleteAddrConfirm.value = addr) },
  ];
}

function overrideMenu(override: PriceOverrideWithRels) {
  return [{ label: 'Remove', icon: IconTrash, danger: true, onClick: () => (deleteOverrideConfirm.value = override) }];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="customer" class="space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">{{ customer.name }}</h1>
          <p class="text-sm text-oslo">Customer profile and order history</p>
          <p class="mt-0.5 text-sm text-independence">{{ customer.phone ?? 'No phone' }} · {{ customer.type }}</p>
        </div>
      </div>

      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <div v-if="activeTab === 'overview'" class="space-y-4">
        <BaseCard padding="sm">
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-independence">Area</dt>
              <dd class="text-casual-navy">{{ customer.area?.name ?? '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-independence">Default address</dt>
              <dd class="max-w-[60%] text-right text-casual-navy">
                <template v-if="defaultAddress">
                  <span class="block">{{ defaultAddress.address_line }}</span>
                  <span class="block text-xs text-oslo">{{ defaultAddress.label }}</span>
                </template>
                <template v-else>—</template>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-independence">AR Balance</dt>
              <dd class="font-medium text-casual-navy">{{ formatMoney(arBalance) }}</dd>
            </div>
            <div v-if="customer.notes" class="flex justify-between">
              <dt class="text-independence">Notes</dt>
              <dd class="text-casual-navy">{{ customer.notes }}</dd>
            </div>
          </dl>
        </BaseCard>

        <BaseCard v-if="hasContainerBalance" padding="sm">
          <p class="mb-2 text-sm font-medium text-casual-navy">Container Balance</p>
          <dl class="space-y-1 text-sm">
            <div v-for="(qty, typeId) in containerBalance" :key="typeId" class="flex justify-between">
              <dt class="text-independence">{{ typeId }}</dt>
              <dd :class="qty > 0 ? 'text-strong-amber' : 'text-dark-green-turquoise'">
                {{ qty }}
              </dd>
            </div>
          </dl>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'addresses'" class="space-y-3">
        <div class="flex justify-end">
          <BaseButton @click="openAddAddr">Add address</BaseButton>
        </div>
        <BaseEmptyState v-if="addresses.length === 0" title="No addresses yet" />
        <BaseCard v-for="a in addresses" :key="a.id" padding="sm">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-medium text-casual-navy">{{ a.label }}</p>
              <p class="text-sm text-independence">{{ a.address_line }}</p>
              <BaseBadge v-if="a.is_default" variant="info" class="mt-1">Default</BaseBadge>
            </div>
            <BaseTableActions :menu="addrMenu(a)" />
          </div>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'price-overrides'" class="space-y-3">
        <div class="flex justify-end">
          <BaseButton @click="openAddOverride">Add override</BaseButton>
        </div>
        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'product', label: 'Product' },
              { key: 'container', label: 'Container' },
              { key: 'refill_price', label: 'Refill price' },
              { key: 'new_container_price', label: 'New container' },
              { key: 'actions', label: '', align: 'right' },
            ]"
            :data="priceOverrides"
            empty-title="No price overrides"
          >
            <template #cell-product="{ row }">{{ row.product?.name ?? '—' }}</template>
            <template #cell-container="{ row }">{{ row.container_type?.name ?? '—' }}</template>
            <template #cell-refill_price="{ row }">{{ formatMoney(row.refill_price_centavos) }}</template>
            <template #cell-new_container_price="{ row }">{{ formatMoney(row.new_container_price_centavos) }}</template>
            <template #cell-actions="{ row }">
              <BaseTableActions :menu="overrideMenu(row)" />
            </template>
          </BaseTable>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'sales'" class="space-y-3">
        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'sale_date', label: 'Date' },
              { key: 'source', label: 'Source' },
              { key: 'status', label: 'Status' },
              { key: 'lines', label: 'Lines' },
            ]"
            :data="sales"
            empty-title="No sales yet"
          >
            <template #cell-source="{ row }">
              <BaseBadge variant="default">{{ row.source }}</BaseBadge>
            </template>
            <template #cell-status="{ row }">
              <BaseBadge :variant="row.status === 'completed' ? 'success' : row.status === 'void' ? 'danger' : 'warning'">
                {{ row.status }}
              </BaseBadge>
            </template>
            <template #cell-lines="{ row }">{{ row.sale_lines.length }}</template>
          </BaseTable>
        </BaseCard>
      </div>
    </div>

    <BaseEmptyState v-else title="Customer not found" />

    <CustomerAddressFormModal
      v-model:open="addrModalOpen"
      :address="editingAddr"
      :is-first-address="addresses.length === 0"
      :saving="addrSaving"
      @submit="saveAddr"
    />

    <BaseConfirm
      :open="!!deleteAddrConfirm"
      title="Delete address?"
      :message="`Delete '${deleteAddrConfirm?.label}'?`"
      @confirm="confirmDeleteAddr"
      @cancel="deleteAddrConfirm = undefined"
    />

    <CustomerPriceOverrideFormModal v-model:open="overrideModalOpen" :saving="overrideSaving" @submit="saveOverride" />

    <BaseConfirm
      :open="!!deleteOverrideConfirm"
      title="Remove price override?"
      :message="`Remove override for ${deleteOverrideConfirm?.product?.name ?? 'this product'}?`"
      @confirm="confirmDeleteOverride"
      @cancel="deleteOverrideConfirm = undefined"
    />
  </div>
</template>
