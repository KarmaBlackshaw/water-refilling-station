<script setup lang="ts">
import type { Employee } from '@/types/database';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import { formatMoney } from '@/helpers/money';
import { ROUTES } from '@/constants/routes';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const router = useRouter();
const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

const { q: search } = useRouteQueryStrings({ q: '' });

const {
  data: employeesRes,
  loading,
  run: load,
} = useAsync(() => getEmployees(tenantId.value, branchId.value, { search: search.value || undefined }), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
  watch: [search],
});

const filteredEmployees = computed(() => employeesRes.value ?? []);

const employeeColumns: TableColumn<Employee>[] = [
  { key: 'full_name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'monthly_salary', label: 'Monthly salary', class: 'num' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
];

function rowMenu(row: Employee) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => router.push(ROUTES.EMPLOYEE_EDIT(row.id)) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete employee?',
          message: `Delete '${row.full_name}'?`,
          onConfirm: async () => {
            if (!auth.authUser) {
              return;
            }

            await softDeleteEmployee(row.id, auth.authUser.id);
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
      <BaseTableHeader v-model:search="search" title="Employees" subtitle="Manage staff accounts and roles" :count="filteredEmployees.length">
        <template #actions>
          <BaseButton @click="router.push(ROUTES.EMPLOYEE_NEW)">Add employee</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTable :columns="employeeColumns" :data="filteredEmployees" :loading="loading">
        <template #cell-full_name="{ row }">
          <RouterLink :to="ROUTES.EMPLOYEE_DETAIL(row.id)" class="font-medium text-tampa hover:underline">
            {{ row.full_name }}
          </RouterLink>
        </template>
        <template #cell-role="{ row }">
          <BaseBadge :variant="row.role === 'admin' ? 'info' : 'default'">{{ row.role }}</BaseBadge>
        </template>
        <template #cell-monthly_salary="{ row }">{{ formatMoney(row.monthly_salary_centavos) }}</template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.active ? 'success' : 'default'">{{ row.active ? 'Active' : 'Inactive' }}</BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="rowMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No employees yet">
            <template #actions>
              <BaseButton @click="router.push(ROUTES.EMPLOYEE_NEW)">Add first employee</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </BaseCard>
  </div>
</template>
