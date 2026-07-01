<script setup lang="ts">
import { ROLE_OPTIONS, type EmployeeForm } from '@/constants/employee';

defineOptions({ name: 'EmployeeDetailsTab' });

const model = defineModel<EmployeeForm>({ required: true });
const restDays = defineModel<Set<number>>('restDays', { required: true });
</script>

<template>
  <div class="space-y-4">
    <BaseInput v-model="model.full_name" label="Full name" required />
    <BaseInput v-model="model.phone" label="Phone" type="tel" />
    <BaseDatePicker v-model="model.hire_date" label="Hire date" />
    <BaseSelect v-model="model.role" label="Role" :options="ROLE_OPTIONS" />
    <BaseInput v-model="model.monthly_salary_display" type="currency" label="Monthly salary" />
    <BaseInput
      v-if="model.role === 'rider'"
      v-model="model.daily_quota_jugs"
      label="Daily quota (jugs)"
      type="number"
      helper-text="Leave blank to use the tenant default"
    />

    <fieldset class="m-0 border-0 p-0">
      <legend class="mb-1 text-xs font-medium text-oslo">Rest days</legend>
      <p class="mb-2 text-xs text-oslo">Days this employee does not work. Leave all unchecked for no rest days.</p>
      <BaseWeekdayToggle v-model="restDays" :cols="4" />
    </fieldset>
  </div>
</template>
