<script setup lang="ts">
import type { Customer } from '@/types/database';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

type CustomerWithArea = Customer & { area: { id: string; name: string } | null };

const {
  data: customersData,
  loading,
  run: load,
} = useAsync<CustomerWithArea[]>(() => listCustomers(tenantId.value, branchId.value).then((r) => r.data ?? []), {
  immediate: true,
  defaultValue: [],
});

const customers = computed(() => customersData.value ?? []);

const search = ref('');
const modalOpen = ref(false);
const editingCustomer = ref<Customer | null>(null);
const deleteConfirm = ref<Customer | null>(null);
const saving = ref(false);

const filtered = computed(() => {
  const q = search.value.toLowerCase();

  if (!q) {
    return customers.value;
  }

  return customers.value.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q));
});

function openAdd() {
  editingCustomer.value = null;
  modalOpen.value = true;
}

function openEdit(c: Customer) {
  editingCustomer.value = c;
  modalOpen.value = true;
}

async function save(payload: { name: string; phone: string | null; type: 'residential' | 'commercial'; notes: string | null }) {
  saving.value = true;

  if (editingCustomer.value) {
    await updateCustomer(editingCustomer.value.id, payload);
  } else {
    await createCustomer({ tenant_id: tenantId.value, branch_id: branchId.value, ...payload });
  }

  modalOpen.value = false;
  await load();
  saving.value = false;
}

async function confirmDelete() {
  if (!deleteConfirm.value || !auth.authUser) {
    return;
  }

  await softDeleteCustomer(deleteConfirm.value.id, auth.authUser.id);
  deleteConfirm.value = null;
  await load();
}

function rowMenu(row: Customer) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(row) },
    { label: 'Delete', icon: IconTrash, danger: true, onClick: () => (deleteConfirm.value = row) },
  ];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Customers</h1>
          <p class="text-sm text-oslo">Manage customer accounts and delivery addresses</p>
        </div>
        <BaseButton @click="openAdd">Add customer</BaseButton>
      </div>

      <BaseInput v-model="search" placeholder="Search by name or phone..." />

      <BaseCard padding="none">
        <BaseTable
          :columns="[
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'type', label: 'Type' },
            { key: 'area', label: 'Area' },
            { key: 'actions', label: '', align: 'right' },
          ]"
          :data="filtered"
          :loading="loading"
        >
          <template #cell-name="{ row }">
            <RouterLink :to="`/customers/${row.id}`" class="font-medium text-turquoise-stone hover:underline">
              {{ row.name }}
            </RouterLink>
          </template>

          <template #cell-phone="{ row }">{{ row.phone ?? '—' }}</template>

          <template #cell-type="{ row }">
            <BaseBadge variant="default">{{ row.type }}</BaseBadge>
          </template>

          <template #cell-area="{ row }">{{ row.area?.name ?? '—' }}</template>

          <template #cell-actions="{ row }">
            <BaseTableActions :menu="rowMenu(row)" />
          </template>

          <template #empty>
            <BaseEmptyState :title="search ? 'No customers found' : 'No customers yet'">
              <template #actions>
                <BaseButton v-if="!search" @click="openAdd">Add first customer</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <CustomerFormModal v-model:open="modalOpen" :customer="editingCustomer" :saving="saving" @submit="save" />

    <BaseConfirm
      :open="deleteConfirm !== null"
      title="Delete customer?"
      :message="`Delete '${deleteConfirm?.name}'?`"
      @confirm="confirmDelete"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
