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

const activeTab = ref<'products' | 'containers'>('products');

const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

const {
  data: products,
  loading: productsLoading,
  run: loadProducts,
} = useAsync<Product[]>(() => listProducts(tenantId.value, branchId.value).then((r) => r.data ?? []), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});
const productModalOpen = ref(false);
const editingProduct = ref<Product>();
const productSaving = ref(false);
const deleteProductConfirm = ref<Product>();

const {
  data: containerTypes,
  loading: containerTypesLoading,
  run: loadContainerTypes,
} = useAsync<ContainerType[]>(() => listContainerTypes(tenantId.value, branchId.value).then((r) => r.data ?? []), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});
const containerModalOpen = ref(false);
const editingContainer = ref<ContainerType>();
const containerSaving = ref(false);
const deleteContainerConfirm = ref<ContainerType>();

function openAddProduct() {
  editingProduct.value = undefined;
  productModalOpen.value = true;
}

function openEditProduct(p: Product) {
  editingProduct.value = p;
  productModalOpen.value = true;
}

async function saveProduct(payload: { name: string; active: boolean }) {
  productSaving.value = true;
  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, payload);
  } else {
    await createProduct({ tenant_id: tenantId.value, branch_id: branchId.value, name: payload.name });
  }

  productModalOpen.value = false;
  await loadProducts();
  productSaving.value = false;
}

async function confirmDeleteProduct() {
  if (!deleteProductConfirm.value || !auth.authUser) {
    return;
  }

  await softDeleteProduct(deleteProductConfirm.value.id, auth.authUser.id);
  deleteProductConfirm.value = undefined;
  await loadProducts();
}

function openAddContainer() {
  editingContainer.value = undefined;
  containerModalOpen.value = true;
}

function openEditContainer(c: ContainerType) {
  editingContainer.value = c;
  containerModalOpen.value = true;
}

async function saveContainer(payload: { name: string; deposit_centavos: number; active: boolean }) {
  containerSaving.value = true;

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
  containerSaving.value = false;
}

async function confirmDeleteContainer() {
  if (!deleteContainerConfirm.value || !auth.authUser) {
    return;
  }

  await softDeleteContainerType(deleteContainerConfirm.value.id, auth.authUser.id);
  deleteContainerConfirm.value = undefined;
  await loadContainerTypes();
}

function productMenu(row: Product) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditProduct(row) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => (deleteProductConfirm.value = row) },
  ];
}

function containerMenu(row: ContainerType) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEditContainer(row) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => (deleteContainerConfirm.value = row) },
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

    <BaseConfirm
      :open="!!deleteProductConfirm"
      title="Delete product?"
      :message="`Delete '${deleteProductConfirm?.name}'? This cannot be undone.`"
      @confirm="confirmDeleteProduct"
      @cancel="deleteProductConfirm = undefined"
    />
    <BaseConfirm
      :open="!!deleteContainerConfirm"
      title="Delete container type?"
      :message="`Delete '${deleteContainerConfirm?.name}'? This cannot be undone.`"
      @confirm="confirmDeleteContainer"
      @cancel="deleteContainerConfirm = undefined"
    />
  </div>
</template>
