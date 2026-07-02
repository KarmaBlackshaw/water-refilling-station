<script setup lang="ts">
defineOptions({ name: 'CustomerPriceOverrideFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { saving } = defineProps<{ saving?: boolean }>();

const emit = defineEmits<{
  submit: [
    payload: {
      product_id: string;
      container_type_id: string;
      refill_price_centavos: number;
      new_container_price_centavos: number;
    },
  ];
}>();

const form = reactive({
  product_id: '',
  container_type_id: '',
  refill_price: '',
  new_container_price: '',
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.product_id = '';
    form.container_type_id = '';
    form.refill_price = '';
    form.new_container_price = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    product_id: form.product_id,
    container_type_id: form.container_type_id,
    refill_price_centavos: Math.round(parseFloat(form.refill_price) * 100),
    new_container_price_centavos: Math.round(parseFloat(form.new_container_price) * 100),
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="Add price override">
    <form id="override-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.product_id" label="Product ID" required />
      <BaseInput v-model="form.container_type_id" label="Container type ID" required />
      <BaseInput v-model="form.refill_price" label="Refill price" type="currency" required />
      <BaseInput v-model="form.new_container_price" label="New container price" type="currency" required />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="override-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
