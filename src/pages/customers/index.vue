<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { Customer } from '@/types/database';
import type { CustomerWithArea } from '@/services/customers';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';
import { formatAddress } from '@/helpers/address';
import { ROUTES } from '@/constants/routes';

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

type AddressLite = NonNullable<CustomerWithArea['addresses']>[number];

const { data: customersRes, loading, run: load } = useAsync(() => listCustomers(tenantId.value, branchId.value), { immediate: true });

const customers = computed(() => customersRes.value?.data ?? []);

const search = ref('');

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

    return (c.addresses ?? []).some((a) => !a.deleted_at && formatAddress(a).toLowerCase().includes(q));
  });
});

function openAdd() {
  router.push(ROUTES.CUSTOMER_NEW);
}

function openEdit(c: Customer) {
  router.push(ROUTES.CUSTOMER_EDIT(c.id));
}

function openDetail(c: CustomerWithArea) {
  router.push(ROUTES.CUSTOMER_DETAIL(c.id));
}

const columns: TableColumn<CustomerWithArea>[] = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Type' },
  { key: 'area', label: 'Area' },
  { key: 'address', label: 'Default address' },
  { key: 'actions', label: '', align: 'right' },
];

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
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Customers" subtitle="Manage customer accounts and delivery addresses" :count="filtered.length">
        <template #actions>
          <BaseButton @click="openAdd">Add customer</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTable :columns="columns" :data="filtered" :loading="loading" @row-click="openDetail">
        <template #cell-name="{ row }">
          <RouterLink :to="ROUTES.CUSTOMER_DETAIL(row.id)" class="font-medium text-tampa hover:underline">
            {{ row.name }}
          </RouterLink>
        </template>

        <template #cell-phone="{ row }">{{ row.phone ?? '—' }}</template>

        <template #cell-type="{ row }">
          <BaseBadge variant="default" class="capitalize">{{ row.type }}</BaseBadge>
        </template>

        <template #cell-area="{ row }">{{ row.area?.name ?? '—' }}</template>

        <template #cell-address="{ row }">
          <span v-if="defaultAddress(row)" class="text-sm text-casual-navy">{{ formatAddress(defaultAddress(row)!) }}</span>
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
</template>
