<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney } from '@/helpers/money';

const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

const {
  data: employees,
  loading,
  run: load,
} = useAsync<Employee[]>(() => listEmployees(tenantId.value, branchId.value), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const modalOpen = ref(false);
const editingEmployee = ref<Employee | null>(null);
const deleteConfirm = ref<Employee | null>(null);
const saving = ref(false);

function openAdd() {
  editingEmployee.value = null;
  modalOpen.value = true;
}

function openEdit(e: Employee) {
  editingEmployee.value = e;
  modalOpen.value = true;
}

async function save(payload: {
  full_name: string;
  phone: string | undefined;
  hire_date: string | undefined;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs: number | null;
}) {
  saving.value = true;

  if (editingEmployee.value) {
    await updateEmployee(editingEmployee.value.id, payload);
  } else {
    await createEmployee({ tenant_id: tenantId.value, branch_id: branchId.value, ...payload });
  }

  modalOpen.value = false;
  await load();
  saving.value = false;
}

async function confirmDelete() {
  if (!deleteConfirm.value || !auth.authUser) {
    return;
  }

  await softDeleteEmployee(deleteConfirm.value.id, auth.authUser.id);
  deleteConfirm.value = null;
  await load();
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
            <BaseButton variant="independence" @click="openEdit(row)">Edit</BaseButton>
            <BaseButton variant="independence" class="text-blaze-red" @click="deleteConfirm = row">Delete</BaseButton>
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

    <EmployeeFormModal v-model:open="modalOpen" :employee="editingEmployee" :saving="saving" @submit="save" />

    <BaseConfirm
      :open="deleteConfirm !== null"
      title="Delete employee?"
      :message="`Delete '${deleteConfirm?.full_name}'?`"
      @confirm="confirmDelete"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
