<script setup lang="ts">
import type { Customer } from '@/types/database';

const open = defineModel<boolean>('open', { required: true });

const { customer, saving } = defineProps<{
  customer: Customer | null;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      name: string;
      phone: string | null;
      type: 'residential' | 'commercial';
      notes: string | null;
    },
  ];
}>();

const form = reactive({
  name: '',
  phone: '',
  type: 'residential' as 'residential' | 'commercial',
  notes: '',
});

const typeOptions = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
];

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (customer) {
      form.name = customer.name;
      form.phone = customer.phone ?? '';
      form.type = customer.type;
      form.notes = customer.notes ?? '';
    } else {
      form.name = '';
      form.phone = '';
      form.type = 'residential';
      form.notes = '';
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    name: form.name,
    phone: form.phone || null,
    type: form.type,
    notes: form.notes || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="customer ? 'Edit customer' : 'Add customer'">
    <form id="customer-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Name" required />
      <BaseInput v-model="form.phone" label="Phone" type="tel" />
      <BaseSelect v-model="form.type" label="Type" :options="typeOptions" />
      <BaseTextarea v-model="form.notes" label="Notes" :rows="2" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="customer-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
