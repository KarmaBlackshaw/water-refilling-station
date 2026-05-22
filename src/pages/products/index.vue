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
import type { Product, ContainerType } from '@/types/database';

const auth = useAuthStore();
const { confirm } = useConfirm();

const activeTab = ref<'products' | 'containers'>('products');

const { tenantId, branchId } = storeToRefs(auth);

const {
  data: productsRes,
  loading: productsLoading,
  run: loadProducts,
} = useAsync(() => listProducts(tenantId.value, branchId.value), {
  immediate: true,
  disableResetValue: true,
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
} = useAsync(() => listContainerTypes(tenantId.value, branchId.value), {
  immediate: true,
  disableResetValue: true,
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
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Products</h1>
          <p class="text-sm text-oslo">Manage products and pricing</p>
        </div>
        <BaseButton v-if="activeTab === 'products'" @click="openAddProduct">Add product</BaseButton>
        <BaseButton v-else @click="openAddContainer">Add container type</BaseButton>
      </div>

      <BaseTabs
        v-model="activeTab"
        :tabs="[
          { key: 'products', label: 'Products' },
          { key: 'containers', label: 'Container Types' },
        ]"
      />

      <div v-if="activeTab === 'products'">
        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'name', label: 'Name' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '', align: 'right' },
            ]"
            :data="products"
            :loading="productsLoading"
            empty-title="No products yet"
          >
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
        </BaseCard>
      </div>

      <div v-else>
        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'name', label: 'Name' },
              { key: 'deposit', label: 'Deposit', class: 'num' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '', align: 'right' },
            ]"
            :data="containerTypes"
            :loading="containerTypesLoading"
            empty-title="No container types yet"
          >
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
      </div>
    </div>

    <ProductFormModal v-model:open="productModalOpen" :product="editingProduct" :saving="productSaving" @submit="saveProduct" />

    <ContainerTypeFormModal v-model:open="containerModalOpen" :container-type="editingContainer" :saving="containerSaving" @submit="saveContainer" />
  </div>
</template>
