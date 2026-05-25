<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney } from '@/helpers/money';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

const {
  data,
  loading,
  run: load,
} = useAsync(() => getEmployees(tenantId.value, branchId.value), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const employees = computed(() => data.value ?? []);

const modalOpen = ref(false);
const editingEmployee = ref<Employee>();
const saveError = ref<string>();

function openAdd() {
  editingEmployee.value = undefined;
  saveError.value = undefined;
  modalOpen.value = true;
}

function openEdit(e: Employee) {
  editingEmployee.value = e;
  saveError.value = undefined;
  modalOpen.value = true;
}

const hasAccount = computed(() => !!editingEmployee.value?.user_id);

const { loading: saving, run: save } = useAsync(
  async (payload: {
    full_name: string;
    phone: string | undefined;
    hire_date: string | undefined;
    role: UserRole;
    monthly_salary_centavos: number;
    daily_quota_jugs: number | null;
    account?: { username: string; password: string };
  }) => {
    saveError.value = undefined;
    let userId: string | undefined;

    if (payload.account) {
      try {
        userId = await createUserAccount({
          username: payload.account.username,
          password: payload.account.password,
          tenantId: tenantId.value,
          branchId: branchId.value,
          fullName: payload.full_name,
          role: payload.role,
        });
      } catch (err) {
        saveError.value = err instanceof Error ? err.message : 'Failed to create account.';
        return;
      }
    }

    if (editingEmployee.value) {
      await updateEmployee(editingEmployee.value.id, {
        full_name: payload.full_name,
        phone: payload.phone,
        hire_date: payload.hire_date,
        monthly_salary_centavos: payload.monthly_salary_centavos,
        daily_quota_jugs: payload.daily_quota_jugs,
        ...(userId ? { user_id: userId } : {}),
      });
    } else {
      if (!userId) {
        saveError.value = 'Account creation is required for new employees.';
        return;
      }
      await createEmployee({
        tenant_id: tenantId.value,
        branch_id: branchId.value,
        user_id: userId,
        full_name: payload.full_name,
        phone: payload.phone,
        hire_date: payload.hire_date,
        role: payload.role,
        monthly_salary_centavos: payload.monthly_salary_centavos,
        daily_quota_jugs: payload.daily_quota_jugs,
      });
    }

    modalOpen.value = false;
    await load();
  },
);

function rowMenu(row: Employee) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete employee?',
          message: `Delete '${row.full_name}'?`,
          onConfirm: async () => {
            if (!auth.authUser) return;
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
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Employees</h1>
          <p class="text-sm text-oslo">Manage staff accounts and roles</p>
        </div>
        <BaseButton @click="openAdd">Add employee</BaseButton>
      </div>

      <BaseCard padding="none">
        <BaseTable
          :columns="[
            { key: 'full_name', label: 'Name' },
            { key: 'role', label: 'Role' },
            { key: 'monthly_salary', label: 'Monthly salary', class: 'num' },
            { key: 'status', label: 'Status' },
            { key: 'actions', label: '', align: 'right' },
          ]"
          :data="employees"
          :loading="loading"
        >
          <template #cell-full_name="{ row }">
            <RouterLink :to="`/employees/${row.id}`" class="font-medium text-turquoise-stone hover:underline">
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
                <BaseButton @click="openAdd">Add first employee</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <EmployeeFormModal
      v-model:open="modalOpen"
      :employee="editingEmployee"
      :saving="saving"
      :has-account="hasAccount"
      @submit="save"
    />
    <p v-if="saveError" class="mt-2 text-sm text-blaze-red">{{ saveError }}</p>
  </div>
</template>
