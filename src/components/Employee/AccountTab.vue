<script setup lang="ts">
import { USERNAME_PATTERN, type EmployeeAccountForm } from '@/constants/employee';

defineOptions({ name: 'EmployeeAccountTab' });

const model = defineModel<EmployeeAccountForm>({ required: true });

const usernameError = computed(() => {
  if (!model.value.username) {
    return null;
  }

  return USERNAME_PATTERN.test(model.value.username) ? null : 'Username must be 3–30 characters: letters, numbers, underscore, dot only.';
});
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-oslo">Sets up login credentials for this employee.</p>
    <BaseInput v-model="model.username" label="Username" required :error="usernameError ?? undefined" helper-text="Short, simple — e.g. juan or dela_cruz" />
    <BaseInput v-model="model.password" label="Password" type="password" required minlength="8" />
  </div>
</template>
