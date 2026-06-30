<script setup lang="ts">
import type { Option } from '@/types';
import type { UserRole } from '@/types/database';

defineOptions({ name: 'AdminUserFormModal' });

export type ProvisionUserPayload = {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  branchId: string;
};

const open = defineModel<boolean>('open', { required: true });

const { branchOptions, saving } = defineProps<{
  branchOptions: Option<string>[];
  saving?: boolean;
}>();

const emit = defineEmits<{ submit: [payload: ProvisionUserPayload] }>();

const ROLE_OPTIONS: Option<UserRole>[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Rider', value: 'rider' },
];

type FormState = {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
  branchId: string;
};

function blankForm(): FormState {
  return { username: '', fullName: '', password: '', role: 'admin', branchId: branchOptions[0]?.value ?? '' };
}

const form = reactive<FormState>(blankForm());

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      Object.assign(form, blankForm());
    }
  },
  { immediate: true },
);

function submit() {
  if (!form.branchId) {
    return;
  }

  emit('submit', {
    username: form.username.trim(),
    fullName: form.fullName.trim(),
    password: form.password,
    role: form.role,
    branchId: form.branchId,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="Add User">
    <form id="user-form" class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.username" label="Username" required placeholder="e.g. cashier1" />
        <BaseInput v-model="form.fullName" label="Full name" required placeholder="e.g. Maria Santos" />
      </div>

      <BaseInput v-model="form.password" label="Password" type="password" required placeholder="••••••••" />

      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="form.role" label="Role" :options="ROLE_OPTIONS" />
        <BaseSelect v-model="form.branchId" label="Branch" :options="branchOptions" placeholder="Select branch..." required />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="user-form" :loading="saving">Add user</BaseButton>
    </template>
  </BaseModal>
</template>
