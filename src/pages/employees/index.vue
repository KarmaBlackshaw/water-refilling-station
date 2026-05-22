<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney, parseMoney } from '@/helpers/money';

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

const form = reactive({
  full_name: '',
  phone: '',
  hire_date: '',
  role: 'rider' as UserRole,
  monthly_salary_display: '',
  daily_quota_jugs: '',
});

const roleOptions = [
  { label: 'Rider', value: 'rider' },
  { label: 'Admin', value: 'admin' },
];

function openAdd() {
  editingEmployee.value = null;
  form.full_name = '';
  form.phone = '';
  form.hire_date = '';
  form.role = 'rider';
  form.monthly_salary_display = formatMoney(0);
  form.daily_quota_jugs = '';
  modalOpen.value = true;
}

function openEdit(e: Employee) {
  editingEmployee.value = e;
  form.full_name = e.full_name;
  form.phone = e.phone ?? '';
  form.hire_date = e.hire_date ?? '';
  form.role = e.role;
  form.monthly_salary_display = formatMoney(e.monthly_salary_centavos);
  form.daily_quota_jugs = e.daily_quota_jugs != null ? String(e.daily_quota_jugs) : '';
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  const salary = parseMoney(form.monthly_salary_display);
  const quota = form.daily_quota_jugs ? parseInt(form.daily_quota_jugs, 10) : null;
  const payload = {
    full_name: form.full_name,
    phone: form.phone || undefined,
    hire_date: form.hire_date || undefined,
    role: form.role,
    monthly_salary_centavos: salary,
    daily_quota_jugs: quota,
  };

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

    <BaseModal :open="modalOpen" :title="editingEmployee ? 'Edit employee' : 'Add employee'" @close="modalOpen = false">
      <form id="employee-form" class="space-y-4" @submit.prevent="save">
        <BaseInput v-model="form.full_name" label="Full name" :required="true" />
        <BaseInput v-model="form.phone" label="Phone" type="tel" />
        <BaseDatePicker v-model="form.hire_date" label="Hire date" />
        <BaseSelect v-model="form.role" label="Role" :options="roleOptions" />
        <BaseInput v-model="form.monthly_salary_display" label="Monthly salary" placeholder="₱0.00" />
        <BaseInput v-model="form.daily_quota_jugs" label="Daily quota (jugs) — riders only" type="number" helper-text="Leave blank to use the tenant default" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="employee-form" :loading="saving">Save</BaseButton>
      </template>
    </BaseModal>

    <BaseConfirm
      :open="deleteConfirm !== null"
      title="Delete employee?"
      :message="`Delete '${deleteConfirm?.full_name}'?`"
      @confirm="confirmDelete"
      @cancel="deleteConfirm = null"
    />
  </div>
</template>
