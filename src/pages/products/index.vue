<script setup lang="ts">
import { formatMoney } from '@/helpers/money';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';
import {
  listProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  listContainerTypes,
  createContainerType,
  updateContainerType,
  softDeleteContainerType,
} from '@/services/products';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { Product, ContainerType } from '@/types/database';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';

const tabs = [
  { key: 'products', label: 'Products' },
  { key: 'containers', label: 'Container Types' },
];

const productColumns: TableColumn<Product>[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
];

const containerColumns: TableColumn<ContainerType>[] = [
  { key: 'name', label: 'Name' },
  { key: 'deposit', label: 'Deposit', class: 'num' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
];

const auth = useAuthStore();
const { confirm } = useConfirm();

const activeTab = ref<'products' | 'containers'>('products');

const { tenantId, branchId } = storeToRefs(auth);

const { q: search } = useRouteQueryStrings({ q: '' });

const {
  data: productsRes,
  loading: productsLoading,
  run: loadProducts,
} = useAsync(() => listProducts(tenantId.value, branchId.value, { search: search.value || undefined }), {
  immediate: true,
  disableResetValue: true,
  watch: [search],
});

const products = computed(() => productsRes.value?.data ?? []);
const productModalOpen = ref(false);
const editingProduct = ref<Product>();

const { loading: productSaving, run: saveProduct } = useAsync(async (payload: { name: string; active: boolean }) => {
  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, payload);
  } else {
    await createProduct({ tenant_id: tenantId.value, branch_id: branchId.value, name: payload.name });
  }

  productModalOpen.value = false;
  await loadProducts();
});

const {
  data: containerTypesRes,
  loading: containerTypesLoading,
  run: loadContainerTypes,
} = useAsync(() => listContainerTypes(tenantId.value, branchId.value, { search: search.value || undefined }), {
  immediate: true,
  disableResetValue: true,
  watch: [search],
});

const containerTypes = computed(() => containerTypesRes.value?.data ?? []);
const containerModalOpen = ref(false);
const editingContainer = ref<ContainerType>();

const { loading: containerSaving, run: saveContainer } = useAsync(async (payload: { name: string; deposit_centavos: number; active: boolean }) => {
  if (editingContainer.value) {
    await updateContainerType(editingContainer.value.id, payload);
  } else {
    await createContainerType({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      name: payload.name,
      deposit_centavos: payload.deposit_centavos,
    });
  }

  containerModalOpen.value = false;
  await loadContainerTypes();
});

function openAddProduct() {
  editingProduct.value = undefined;
  productModalOpen.value = true;
}

function openEditProduct(p: Product) {
  editingProduct.value = p;
  productModalOpen.value = true;
}

function openAddContainer() {
  editingContainer.value = undefined;
  containerModalOpen.value = true;
}

function openEditContainer(c: ContainerType) {
  editingContainer.value = c;
  containerModalOpen.value = true;
}

function productMenu(row: Product) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditProduct(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete product?',
          message: `Delete '${row.name}'? This cannot be undone.`,
          onConfirm: async () => {
            if (!auth.authUser) {
              return;
            }

            await softDeleteProduct(row.id, auth.authUser.id);
            await loadProducts();
          },
        }),
    },
  ];
}

function containerMenu(row: ContainerType) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditContainer(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete container type?',
          message: `Delete '${row.name}'? This cannot be undone.`,
          onConfirm: async () => {
            if (!auth.authUser) {
              return;
            }

            await softDeleteContainerType(row.id, auth.authUser.id);
            await loadContainerTypes();
          },
        }),
    },
  ];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader
        v-model:search="search"
        title="Products"
        subtitle="Manage products and pricing"
        :count="activeTab === 'products' ? products.length : containerTypes.length"
      >
        <template #actions>
          <BaseButton v-if="activeTab === 'products'" @click="openAddProduct">Add product</BaseButton>
          <BaseButton v-else @click="openAddContainer">Add container type</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTableTabs v-model="activeTab" :tabs="tabs" />

      <BaseTable v-if="activeTab === 'products'" :columns="productColumns" :data="products" :loading="productsLoading" empty-title="No products yet">
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.active ? 'success' : 'default'">
            {{ row.active ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="productMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No products yet">
            <template #actions>
              <BaseButton @click="openAddProduct">Add first product</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>

      <BaseTable v-else :columns="containerColumns" :data="containerTypes" :loading="containerTypesLoading" empty-title="No container types yet">
        <template #cell-deposit="{ row }">{{ formatMoney(row.deposit_centavos) }}</template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.active ? 'success' : 'default'">
            {{ row.active ? 'Active' : 'Inactive' }}
          </BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="containerMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No container types yet">
            <template #actions>
              <BaseButton @click="openAddContainer">Add first container type</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </BaseCard>

    <ProductFormModal v-model:open="productModalOpen" :product="editingProduct" :saving="productSaving" @submit="saveProduct" />

    <ProductContainerTypeFormModal v-model:open="containerModalOpen" :container-type="editingContainer" :saving="containerSaving" @submit="saveContainer" />
  </div>
</template>
