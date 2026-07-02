<script setup lang="ts">
import type { ContainerType } from '@/types/database';
import { parseMoney } from '@/helpers/money';

defineOptions({ name: 'ProductContainerTypeFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { containerType, saving } = defineProps<{
  containerType?: ContainerType;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { name: string; deposit_centavos: number; active: boolean }];
}>();

const form = reactive({ name: '', deposit: '', active: true });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (containerType) {
      form.name = containerType.name;
      form.deposit = (containerType.deposit_centavos / 100).toFixed(2);
      form.active = containerType.active;
    } else {
      form.name = '';
      form.deposit = '';
      form.active = true;
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    name: form.name,
    deposit_centavos: parseMoney(form.deposit),
    active: form.active,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="containerType ? 'Edit container type' : 'Add container type'">
    <form id="container-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Name" required />
      <BaseInput v-model="form.deposit" label="Deposit amount" type="currency" placeholder="0.00" />
      <BaseCheckbox v-model="form.active" label="Active" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="container-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
