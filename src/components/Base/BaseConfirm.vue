<script setup lang="ts">
defineProps<{
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'blaze-red' | 'turquoise-stone';
  loading?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <BaseModal :open="open" :title="title ?? 'Are you sure?'" size="sm" :closable="true" @close="$emit('cancel')">
    <p v-if="message" class="text-sm text-independence">{{ message }}</p>

    <template #footer>
      <BaseButton variant="independence" size="sm" :disabled="loading" @click="$emit('cancel')">
        {{ cancelLabel ?? 'Cancel' }}
      </BaseButton>
      <BaseButton :variant="variant ?? 'blaze-red'" size="sm" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel ?? 'Confirm' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
