<script setup lang="ts">
import type { Customer } from '@/types/database';

const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

type CustomerWithArea = Customer & { area: { id: string; name: string } | null };

const {
  data: customersData,
  loading,
  run: load,
} = useAsync<CustomerWithArea[]>(
  () => listCustomers(tenantId.value, branchId.value).then((r) => (r.data ?? []) as CustomerWithArea[]),
  {
    immediate: true,
    defaultValue: [],
  },
);

const customers = computed(() => customersData.value ?? []);

const search = ref('');
const modalOpen = ref(false);
const editingCustomer = ref<Customer | null>(null);
const deleteConfirm = ref<Customer | null>(null);
const saving = ref(false);

const form = reactive({
  name: '',
  phone: '',
  type: 'residential' as 'residential' | 'commercial',
  notes: '',
});

const typeOptions = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
];

const filtered = computed(() => {
  const q = search.value.toLowerCase();

  if (!q) {
    return customers.value;
  }

  return customers.value.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q));
});

function openAdd() {
  editingCustomer.value = null;
  form.name = '';
  form.phone = '';
  form.type = 'residential';
  form.notes = '';
  modalOpen.value = true;
}

function openEdit(c: Customer) {
  editingCustomer.value = c;
  form.name = c.name;
  form.phone = c.phone ?? '';
  form.type = c.type;
  form.notes = c.notes ?? '';
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  const payload = {
    name: form.name,
    phone: form.phone || null,
    type: form.type,
    notes: form.notes || null,
  };

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
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Customers</h1>
          <p class="text-sm text-oslo">Manage customer accounts and delivery addresses</p>
        </div>
        <BaseButton size="sm" @click="openAdd">Add customer</BaseButton>
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
            <BaseButton variant="independence" size="sm" @click="openEdit(row)">Edit</BaseButton>
            <BaseButton variant="independence" size="sm" class="text-blaze-red" @click="deleteConfirm = row">Delete</BaseButton>
          </template>
          <template #empty>
            <BaseEmptyState :title="search ? 'No customers found' : 'No customers yet'">
              <template #actions>
                <BaseButton v-if="!search" size="sm" @click="openAdd">Add first customer</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" :title="editingCustomer ? 'Edit customer' : 'Add customer'" @close="modalOpen = false">
      <form id="customer-form" class="space-y-4" @submit.prevent="save">
        <BaseInput v-model="form.name" label="Name" :required="true" />
        <BaseInput v-model="form.phone" label="Phone" type="tel" />
        <BaseSelect v-model="form.type" label="Type" :options="typeOptions" />
        <BaseTextarea v-model="form.notes" label="Notes" :rows="2" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="customer-form" :loading="saving">Save</BaseButton>
      </template>
    </BaseModal>

    <BaseConfirm
      :open="deleteConfirm !== null"
      title="Delete customer?"
      :message="`Delete '${deleteConfirm?.name}'?`"
      @confirm="confirmDelete"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
