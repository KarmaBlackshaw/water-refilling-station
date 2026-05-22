<script setup lang="ts">
import { formatMoney, parseMoney } from '@/helpers/money';
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

// Tabs
const activeTab = ref<'products' | 'containers'>('products');

const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

// Products state
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
const editingProduct = ref<Product | null>(null);
const productForm = reactive({ name: '', active: true });
const productSaving = ref(false);
const deleteProductConfirm = ref<Product | null>(null);

// Container types state
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
const editingContainer = ref<ContainerType | null>(null);
const containerForm = reactive({ name: '', deposit_display: '₱0.00', active: true });
const containerSaving = ref(false);
const deleteContainerConfirm = ref<ContainerType | null>(null);

// Product CRUD
function openAddProduct() {
  editingProduct.value = null;
  productForm.name = '';
  productForm.active = true;
  productModalOpen.value = true;
}

function openEditProduct(p: Product) {
  editingProduct.value = p;
  productForm.name = p.name;
  productForm.active = p.active;
  productModalOpen.value = true;
}

async function saveProduct() {
  productSaving.value = true;
  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, { name: productForm.name, active: productForm.active });
  } else {
    await createProduct({ tenant_id: tenantId.value, branch_id: branchId.value, name: productForm.name });
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
  deleteProductConfirm.value = null;
  await loadProducts();
}

// Container CRUD
function openAddContainer() {
  editingContainer.value = null;
  containerForm.name = '';
  containerForm.deposit_display = formatMoney(0);
  containerForm.active = true;
  containerModalOpen.value = true;
}

function openEditContainer(c: ContainerType) {
  editingContainer.value = c;
  containerForm.name = c.name;
  containerForm.deposit_display = formatMoney(c.deposit_centavos);
  containerForm.active = c.active;
  containerModalOpen.value = true;
}

async function saveContainer() {
  containerSaving.value = true;
  const deposit = parseMoney(containerForm.deposit_display);

  if (editingContainer.value) {
    await updateContainerType(editingContainer.value.id, {
      name: containerForm.name,
      active: containerForm.active,
      deposit_centavos: deposit,
    });
  } else {
    await createContainerType({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      name: containerForm.name,
      deposit_centavos: deposit,
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
  deleteContainerConfirm.value = null;
  await loadContainerTypes();
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

      <!-- Products tab -->
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
              <BaseButton variant="independence" @click="openEditProduct(row)">Edit</BaseButton>
              <BaseButton variant="independence" class="text-blaze-red" @click="deleteProductConfirm = row">Delete</BaseButton>
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

      <!-- Container types tab -->
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
              <BaseButton variant="independence" @click="openEditContainer(row)">Edit</BaseButton>
              <BaseButton variant="independence" class="text-blaze-red" @click="deleteContainerConfirm = row">Delete</BaseButton>
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

    <!-- Product modal -->
    <BaseModal :open="productModalOpen" :title="editingProduct ? 'Edit product' : 'Add product'" @close="productModalOpen = false">
      <form id="product-form" class="space-y-4" @submit.prevent="saveProduct">
        <BaseInput v-model="productForm.name" label="Name" :required="true" />
        <BaseCheckbox v-model="productForm.active" label="Active" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="productModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="product-form" :loading="productSaving">Save</BaseButton>
      </template>
    </BaseModal>

    <!-- Container modal -->
    <BaseModal :open="containerModalOpen" :title="editingContainer ? 'Edit container type' : 'Add container type'" @close="containerModalOpen = false">
      <form id="container-form" class="space-y-4" @submit.prevent="saveContainer">
        <BaseInput v-model="containerForm.name" label="Name" :required="true" />
        <BaseInput v-model="containerForm.deposit_display" label="Deposit amount" placeholder="₱0.00" />
        <BaseCheckbox v-model="containerForm.active" label="Active" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="containerModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="container-form" :loading="containerSaving">Save</BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirms -->
    <BaseConfirm
      :open="deleteProductConfirm !== null"
      title="Delete product?"
      :message="`Delete '${deleteProductConfirm?.name}'? This cannot be undone.`"
      @confirm="confirmDeleteProduct"
      @cancel="deleteProductConfirm = null"
    />
    <BaseConfirm
      :open="deleteContainerConfirm !== null"
      title="Delete container type?"
      :message="`Delete '${deleteContainerConfirm?.name}'? This cannot be undone.`"
      @confirm="confirmDeleteContainer"
      @cancel="deleteContainerConfirm = null"
    />
  </div>
</template>
