<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { Customer } from '@/types/database';
import type { CustomerWithRider } from '@/services/customers';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';
import { formatAddress } from '@/helpers/address';
import { ROUTES } from '@/constants/routes';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

type AddressLite = NonNullable<CustomerWithRider['addresses']>[number];

const { q: search } = useRouteQueryStrings({ q: '' });

const {
  data: customersRes,
  loading,
  run: load,
} = useAsync(() => listCustomers(tenantId.value, branchId.value, { search: search.value || undefined }), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
  watch: [search],
});

const rows = computed(() => customersRes.value?.data ?? []);

function defaultAddress(row: CustomerWithRider): AddressLite | undefined {
  const live = (row.addresses ?? []).filter((a) => !a.deleted_at);

  return live.find((a) => a.is_default) ?? live[0];
}

function defaultAddressLabel(row: CustomerWithRider): string | undefined {
  const addr = defaultAddress(row);

  return addr ? formatAddress(addr) : undefined;
}

function openAdd() {
  router.push(ROUTES.CUSTOMER_NEW);
}

function openEdit(c: Customer) {
  router.push(ROUTES.CUSTOMER_EDIT(c.id));
}

function openDetail(c: CustomerWithRider) {
  router.push(ROUTES.CUSTOMER_DETAIL(c.id));
}

const columns: TableColumn<CustomerWithRider>[] = [
  { key: 'name', label: 'Name', class: 'font-medium text-casual-navy' },
  { key: 'phone', label: 'Phone' },
  { key: 'type', label: 'Type' },
  { key: 'rider', label: 'Rider' },
  { key: 'backup_rider', label: 'Backup rider' },
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
      <BaseTableHeader v-model:search="search" title="Customers" subtitle="Manage customer accounts and delivery addresses" :count="rows.length">
        <template #actions>
          <BaseButton @click="openAdd">Add customer</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTable :columns="columns" :data="rows" :loading="loading" row-key="id" @row-click="openDetail">
        <template #cell-phone="{ row }">{{ row.phone ?? '—' }}</template>

        <template #cell-type="{ row }">
          <BaseBadge variant="default" class="capitalize">{{ row.type }}</BaseBadge>
        </template>

        <template #cell-rider="{ row }">{{ row.rider?.full_name ?? '—' }}</template>

        <template #cell-backup_rider="{ row }">{{ row.backup_rider?.full_name ?? '—' }}</template>

        <template #cell-address="{ row }">
          <span v-if="defaultAddressLabel(row)" class="text-sm text-casual-navy">{{ defaultAddressLabel(row) }}</span>
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
