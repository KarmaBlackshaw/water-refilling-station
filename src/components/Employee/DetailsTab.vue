<script setup lang="ts">
import { ROLE_OPTIONS, type EmployeeForm } from '@/constants/employee';
import type { TabErrors } from '@/helpers/validation';

defineOptions({
  name: 'EmployeeDetailsTab',
});

const { errors } = defineProps<{ errors?: TabErrors }>();

const model = defineModel<EmployeeForm>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <BaseInput v-model="model.full_name" label="Full name" required :error="errors?.full_name" />

    <BaseInput v-model="model.phone" label="Phone" type="tel" :error="errors?.phone" />

    <BaseDatePicker v-model="model.hire_date" label="Hire date" />

    <BaseSelect v-model="model.role" label="Role" :options="ROLE_OPTIONS" />

    <BaseInput v-model="model.monthly_salary" type="currency" label="Monthly salary" required :error="errors?.monthly_salary" />

    <BaseInput
      v-if="model.role === 'rider'"
      v-model="model.daily_quota_jugs"
      label="Daily quota (jugs)"
      type="number"
      required
      :error="errors?.daily_quota_jugs"
    />

    <BaseWeekdayToggle
      v-model="model.rest_days"
      :cols="4"
      label="Rest days"
      description="Days this employee does not work. Leave all unchecked for no rest days."
    />
  </div>
</template>
