<script setup lang="ts">
defineProps<{
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'blaze-red' | 'tampa';
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function onUpdateOpen(v: boolean) {
  if (!v) {
    emit('cancel');
  }
}
</script>

<template>
  <BaseModal :open="open" :title="title ?? 'Are you sure?'" closable @update:open="onUpdateOpen">
    <p v-if="message" class="text-sm text-independence">{{ message }}</p>

    <template #footer>
      <BaseButton variant="independence" :disabled="loading" @click="$emit('cancel')">
        {{ cancelLabel ?? 'Cancel' }}
      </BaseButton>
      <BaseButton :variant="variant ?? 'blaze-red'" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel ?? 'Confirm' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
