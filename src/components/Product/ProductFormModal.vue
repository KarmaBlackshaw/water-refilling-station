<script setup lang="ts">
import type { Product } from '@/types/database';

const open = defineModel<boolean>('open', { required: true });

const { product, saving } = defineProps<{
  product: Product | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { name: string; active: boolean }];
}>();

const form = reactive({ name: '', active: true });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (product) {
      form.name = product.name;
      form.active = product.active;
    } else {
      form.name = '';
      form.active = true;
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', { name: form.name, active: form.active });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="product ? 'Edit product' : 'Add product'">
    <form id="product-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Name" :required="true" />
      <BaseCheckbox v-model="form.active" label="Active" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="product-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
