<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney, parseMoney } from '@/helpers/money';

const open = defineModel<boolean>('open', { required: true });

const { employee, saving } = defineProps<{
  employee: Employee | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      full_name: string;
      phone: string | undefined;
      hire_date: string | undefined;
      role: UserRole;
      monthly_salary_centavos: number;
      daily_quota_jugs: number | null;
    },
  ];
}>();

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

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (employee) {
      form.full_name = employee.full_name;
      form.phone = employee.phone ?? '';
      form.hire_date = employee.hire_date ?? '';
      form.role = employee.role;
      form.monthly_salary_display = formatMoney(employee.monthly_salary_centavos);
      form.daily_quota_jugs = employee.daily_quota_jugs != null ? String(employee.daily_quota_jugs) : '';
    } else {
      form.full_name = '';
      form.phone = '';
      form.hire_date = '';
      form.role = 'rider';
      form.monthly_salary_display = formatMoney(0);
      form.daily_quota_jugs = '';
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    full_name: form.full_name,
    phone: form.phone || undefined,
    hire_date: form.hire_date || undefined,
    role: form.role,
    monthly_salary_centavos: parseMoney(form.monthly_salary_display),
    daily_quota_jugs: form.daily_quota_jugs ? parseInt(form.daily_quota_jugs, 10) : null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="employee ? 'Edit employee' : 'Add employee'">
    <form id="employee-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.full_name" label="Full name" required />
      <BaseInput v-model="form.phone" label="Phone" type="tel" />
      <BaseDatePicker v-model="form.hire_date" label="Hire date" />
      <BaseSelect v-model="form.role" label="Role" :options="roleOptions" />
      <BaseInput v-model="form.monthly_salary_display" label="Monthly salary" placeholder="₱0.00" />
      <BaseInput v-model="form.daily_quota_jugs" label="Daily quota (jugs) — riders only" type="number" helper-text="Leave blank to use the tenant default" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="employee-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
