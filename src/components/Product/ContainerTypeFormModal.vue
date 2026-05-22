<script setup lang="ts">
import type { ContainerType } from '@/types/database';
import { formatMoney, parseMoney } from '@/helpers/money';

const open = defineModel<boolean>('open', { required: true });

const { containerType, saving } = defineProps<{
  containerType?: ContainerType;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { name: string; deposit_centavos: number; active: boolean }];
}>();

const form = reactive({ name: '', deposit_display: '₱0.00', active: true });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (containerType) {
      form.name = containerType.name;
      form.deposit_display = formatMoney(containerType.deposit_centavos);
      form.active = containerType.active;
    } else {
      form.name = '';
      form.deposit_display = formatMoney(0);
      form.active = true;
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    name: form.name,
    deposit_centavos: parseMoney(form.deposit_display),
    active: form.active,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="containerType ? 'Edit container type' : 'Add container type'">
    <form id="container-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Name" required />
      <BaseInput v-model="form.deposit_display" label="Deposit amount" placeholder="₱0.00" />
      <BaseCheckbox v-model="form.active" label="Active" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="container-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
