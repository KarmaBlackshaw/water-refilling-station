<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney, parseMoney } from '@/helpers/money';
import { WEEKDAYS } from '@/constants/rider';

defineOptions({ name: 'EmployeeFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { employee, saving, hasAccount } = defineProps<{
  employee?: Employee;
  saving?: boolean;
  hasAccount?: boolean;
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
      rest_days: number[];
      account?: { username: string; password: string };
    },
  ];
}>();

type FormState = {
  full_name: string;
  phone: string;
  hire_date: string;
  role: UserRole;
  monthly_salary_display: string;
  daily_quota_jugs: string;
  username: string;
  password: string;
};

const form = reactive<FormState>({
  full_name: '',
  phone: '',
  hire_date: '',
  role: 'rider',
  monthly_salary_display: '',
  daily_quota_jugs: '',
  username: '',
  password: '',
});

/** Tracks selected rest-day weekdays (0=Sun..6=Sat). Serialised to sorted number[] on submit. */
const restDays = ref<Set<number>>(new Set([0]));

const roleOptions = [
  { label: 'Rider', value: 'rider' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

const showAccountFields = computed(() => !hasAccount);

const usernameError = computed(() => {
  if (!form.username) {
    return null;
  }

  return /^[a-zA-Z0-9_.]{3,30}$/.test(form.username) ? null : 'Username must be 3–30 characters: letters, numbers, underscore, dot only.';
});

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
      restDays.value = new Set(employee.rest_days ?? []);
    } else {
      form.full_name = '';
      form.phone = '';
      form.hire_date = '';
      form.role = 'rider';
      form.monthly_salary_display = formatMoney(0);
      form.daily_quota_jugs = '';
      restDays.value = new Set([0]);
    }

    form.username = '';
    form.password = '';
  },
  { immediate: true },
);

function toggleRestDay(day: number, checked: boolean) {
  const next = new Set(restDays.value);

  if (checked) {
    next.add(day);
  } else {
    next.delete(day);
  }

  restDays.value = next;
}

function submit() {
  emit('submit', {
    full_name: form.full_name,
    phone: form.phone || undefined,
    hire_date: form.hire_date || undefined,
    role: form.role,
    monthly_salary_centavos: parseMoney(form.monthly_salary_display),
    daily_quota_jugs: form.daily_quota_jugs ? parseInt(form.daily_quota_jugs, 10) : null,
    rest_days: [...restDays.value].sort((a, b) => a - b),
    account: showAccountFields.value ? { username: form.username, password: form.password } : undefined,
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

      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-1 text-xs font-medium text-oslo">Rest days</legend>
        <p class="mb-2 text-xs text-oslo">Days this employee does not work. Leave all unchecked for no rest days.</p>
        <div class="grid grid-cols-4 gap-2">
          <BaseCheckbox
            v-for="day in WEEKDAYS"
            :key="day.value"
            :model-value="restDays.has(day.value)"
            :label="day.label"
            @update:model-value="toggleRestDay(day.value, $event)"
          />
        </div>
      </fieldset>

      <template v-if="showAccountFields">
        <div class="border-t pt-4">
          <p class="mb-3 text-sm font-medium text-casual-navy">App account</p>
          <p class="mb-3 text-xs text-oslo">Sets up login credentials for this employee.</p>
          <div class="space-y-3">
            <BaseInput
              v-model="form.username"
              label="Username"
              required
              :error="usernameError ?? undefined"
              helper-text="Short, simple — e.g. juan or dela_cruz"
            />
            <BaseInput v-model="form.password" label="Password" type="password" required minlength="8" />
          </div>
        </div>
      </template>
      <template v-else-if="employee">
        <div class="flex items-center gap-2 border-t pt-4">
          <p class="text-sm font-medium text-casual-navy">App account</p>
          <BaseBadge variant="success">Account exists</BaseBadge>
        </div>
      </template>
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="employee-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
