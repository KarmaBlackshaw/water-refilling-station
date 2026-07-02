<script setup lang="ts">
import type { EmployeeAccountForm } from '@/constants/employee';
import type { TabErrors } from '@/helpers/validation';

defineOptions({ name: 'EmployeeAccountTab' });

const { errors } = defineProps<{ errors?: TabErrors }>();

const model = defineModel<EmployeeAccountForm>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-oslo">Sets up login credentials for this employee.</p>
    <BaseInput v-model="model.username" label="Username" required :error="errors?.username" helper-text="Short, simple — e.g. juan or dela_cruz" />
    <BaseInput v-model="model.password" label="Password" type="password" required minlength="8" :error="errors?.password" />
  </div>
</template>
