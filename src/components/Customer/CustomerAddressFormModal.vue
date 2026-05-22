<script setup lang="ts">
import type { CustomerAddress } from '@/types/database';

const open = defineModel<boolean>('open', { required: true });

const { address, isFirstAddress, saving } = defineProps<{
  address: CustomerAddress | null;
  isFirstAddress?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { label: string; address_line: string; is_default: boolean }];
}>();

const form = reactive({ label: '', address_line: '', is_default: false });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (address) {
      form.label = address.label;
      form.address_line = address.address_line;
      form.is_default = address.is_default;
    } else {
      form.label = '';
      form.address_line = '';
      form.is_default = !!isFirstAddress;
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', { label: form.label, address_line: form.address_line, is_default: form.is_default });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="address ? 'Edit address' : 'Add address'">
    <form id="addr-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.label" label="Label (e.g. Home, Office)" required />
      <BaseTextarea v-model="form.address_line" label="Address" required :rows="2" />
      <BaseCheckbox v-model="form.is_default" label="Set as default address" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="addr-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
