<script setup lang="ts">
import type { CustomerAddressRow, CustomerPriceOverrideWithRels } from '@/services/customers';
import { ROUTES } from '@/constants/routes';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { confirm } = useConfirm();
const toast = useToast();
const { tenantId, branchId } = storeToRefs(auth);

type AddrSubmitPayload = {
  payload: {
    label: string;
    street: string;
    barangay: string;
    city: string;
    landmark: string | null;
    lat: number | null;
    lng: number | null;
    is_default: boolean;
    needs_pin_review: boolean;
  };
  photoFile: File | undefined;
  removePhoto: boolean;
};

type OverridePayload = {
  product_id: string;
  container_type_id: string;
  refill_price_centavos: number;
  new_container_price_centavos: number;
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
} = useAsync(
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

const hasContainerBalance = computed(() => Object.keys(containerBalance.value).length > 0);

const defaultAddress = computed(() => {
  const live = addresses.value.filter((a) => !a.deleted_at);

  return live.find((a) => a.is_default) ?? live[0] ?? null;
});

const liveAddressCount = computed(() => addresses.value.filter((a) => !a.deleted_at).length);

const containersOut = computed(() => Object.values(containerBalance.value).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0));

const addrModalOpen = ref(false);
const editingAddr = ref<CustomerAddressRow>();

function openAddAddr() {
  editingAddr.value = undefined;
  addrModalOpen.value = true;
}

function openEditAddr(addr: CustomerAddressRow) {
  editingAddr.value = addr;
  addrModalOpen.value = true;
}

const { loading: addrSaving, run: saveAddress } = useAsync(async ({ payload, photoFile, removePhoto }: AddrSubmitPayload) => {
  if (!customer.value) {
    return;
  }

  const target = editingAddr.value;
  const savedRes = target
    ? await updateAddress(target.id, payload)
    : await createAddress({
        tenant_id: tenantId.value,
        branch_id: branchId.value,
        customer_id: customer.value.id,
        ...payload,
      });

  const row = savedRes.data;

  if (!row) {
    return;
  }

  let nextPath: string | null = row.photo_path ?? null;

  try {
    if (removePhoto && nextPath) {
      await deleteAddressPhoto(nextPath);
      nextPath = null;
    }

    if (photoFile) {
      if (row.photo_path) {
        await deleteAddressPhoto(row.photo_path);
      }

      nextPath = await uploadAddressPhoto(photoFile, tenantId.value, branchId.value, row.id);
    }

    if (nextPath !== (row.photo_path ?? null)) {
      await updateAddress(row.id, { photo_path: nextPath });
    }
  } catch (e) {
    toast.error(getErrorMessage(e, 'Address saved, but photo update failed.'));
  }

  addrModalOpen.value = false;
  await load();
});

function removeAddress(addr: CustomerAddressRow) {
  confirm({
    title: 'Delete address?',
    message: `Delete '${addr.label}'?`,
    onConfirm: async () => {
      if (!auth.authUser) {
        return;
      }

      await softDeleteAddress(addr.id, auth.authUser.id);
      await load();
    },
  });
}

const overrideModalOpen = ref(false);

function openAddOverride() {
  overrideModalOpen.value = true;
}

const { loading: overrideSaving, run: saveOverride } = useAsync(async (payload: OverridePayload) => {
  if (!customer.value) {
    return;
  }

  await upsertPriceOverride({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    customer_id: customer.value.id,
    ...payload,
  });
  overrideModalOpen.value = false;
  await load();
});

function removeOverride(override: CustomerPriceOverrideWithRels) {
  confirm({
    title: 'Remove price override?',
    message: `Remove override for ${override.product?.name ?? 'this product'}?`,
    onConfirm: async () => {
      if (!auth.authUser) {
        return;
      }

      await softDeletePriceOverride(override.id, auth.authUser.id);
      await load();
    },
  });
}

const tabAction = computed(() => {
  if (activeTab.value === 'addresses') {
    return { label: 'Add address', onClick: openAddAddr };
  }

  if (activeTab.value === 'price-overrides') {
    return { label: 'Add override', onClick: openAddOverride };
  }

  return null;
});

function editCustomer() {
  if (customer.value) {
    router.push(ROUTES.CUSTOMER_EDIT(customer.value.id));
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <BaseEmptyState v-else-if="!customer" title="Customer not found" />

    <div v-else class="space-y-4">
      <CustomerDetailHeader
        :customer="customer"
        :ar-balance="arBalance"
        :address-count="liveAddressCount"
        :containers-out="containersOut"
        @edit="editCustomer"
      />

      <BaseCard padding="none">
        <div class="flex items-center justify-between gap-3 border-b border-sparkling-silver px-3">
          <BaseTabs v-model="activeTab" :tabs="tabs" variant="underline" class="flex-1" />
          <BaseButton v-if="tabAction" size="sm" @click="tabAction?.onClick()">
            <IconPlus class="size-4" />
            {{ tabAction?.label }}
          </BaseButton>
        </div>

        <CustomerDetailOverview
          v-if="activeTab === 'overview'"
          :customer="customer"
          :default-address="defaultAddress"
          :container-balance="containerBalance"
          :has-container-balance="hasContainerBalance"
        />
        <CustomerDetailAddresses v-else-if="activeTab === 'addresses'" :addresses="addresses" @edit="openEditAddr" @delete="removeAddress" />
        <CustomerDetailPriceOverrides v-else-if="activeTab === 'price-overrides'" :price-overrides="priceOverrides" @remove="removeOverride" />
        <CustomerDetailSales v-else-if="activeTab === 'sales'" :sales="sales" />
      </BaseCard>
    </div>

    <CustomerAddressFormModal
      v-model:open="addrModalOpen"
      :address="editingAddr"
      :is-first-address="addresses.length === 0"
      :saving="addrSaving"
      @submit="saveAddress"
    />

    <CustomerPriceOverrideFormModal v-model:open="overrideModalOpen" :saving="overrideSaving" @submit="saveOverride" />
  </div>
</template>
