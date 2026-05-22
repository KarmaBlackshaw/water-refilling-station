<script setup lang="ts">
import type { Customer } from '@/types/database';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

type AddressLite = {
  id: string;
  label: string;
  address_line: string;
  is_default: boolean;
  deleted_at: string | null;
};

type CustomerWithArea = Customer & {
  area: { id: string; name: string } | null;
  addresses: AddressLite[] | null;
};

const { data: customersRes, loading, run: load } = useAsync(() => listCustomers(tenantId.value, branchId.value), { immediate: true });

const customers = computed(() => customersRes.value?.data ?? []);

const search = ref('');
const modalOpen = ref(false);
const editingCustomer = ref<Customer>();

function defaultAddress(row: CustomerWithArea): AddressLite | null {
  const live = (row.addresses ?? []).filter((a) => !a.deleted_at);

  return live.find((a) => a.is_default) ?? live[0] ?? null;
}

const filtered = computed(() => {
  const q = search.value.toLowerCase();

  if (!q) {
    return customers.value;
  }

  return customers.value.filter((c) => {
    if (c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)) {
      return true;
    }

    return (c.addresses ?? []).some((a) => !a.deleted_at && a.address_line.toLowerCase().includes(q));
  });
});

function openAdd() {
  editingCustomer.value = undefined;
  modalOpen.value = true;
}

function openEdit(c: Customer) {
  editingCustomer.value = c;
  modalOpen.value = true;
}

const { loading: saving, run: save } = useAsync(
  async (payload: {
    name: string;
    phone: string | null;
    type: 'residential' | 'commercial';
    notes: string | null;
    address: { label: string; address_line: string } | null;
  }) => {
    const { address, ...customerPayload } = payload;

    if (editingCustomer.value) {
      await updateCustomer(editingCustomer.value.id, customerPayload);
    } else {
      const { data: created } = await createCustomer({ tenant_id: tenantId.value, branch_id: branchId.value, ...customerPayload });

      if (created && address) {
        await createAddress({
          tenant_id: tenantId.value,
          branch_id: branchId.value,
          customer_id: created.id,
          label: address.label,
          address_line: address.address_line,
          is_default: true,
        });
      }
    }

    modalOpen.value = false;
    await load();
  },
);

function rowMenu(row: Customer) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete customer?',
          message: `Delete '${row.name}'?`,
          onConfirm: async () => {
            if (!auth.authUser) {
              return;
            }

            await softDeleteCustomer(row.id, auth.authUser.id);
            await load();
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
            { key: 'address', label: 'Default address' },
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

          <template #cell-address="{ row }">
            <span v-if="defaultAddress(row)" class="text-sm text-casual-navy">{{ defaultAddress(row)?.address_line }}</span>
            <span v-else class="text-sm text-oslo">—</span>
          </template>

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
  </div>
</template>
