<script setup lang="ts">
import type { Customer } from '@/types/database';

const open = defineModel<boolean>('open', { required: true });

const { customer, saving } = defineProps<{
  customer?: Customer;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      name: string;
      phone: string | null;
      type: 'residential' | 'commercial';
      notes: string | null;
      address: { label: string; address_line: string } | null;
    },
  ];
}>();

const form = reactive({
  name: '',
  phone: '',
  type: 'residential' as 'residential' | 'commercial',
  notes: '',
  address_label: '',
  address_line: '',
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
      form.address_label = '';
      form.address_line = '';
    }
  },
  { immediate: true },
);

function submit() {
  const addressLine = form.address_line.trim();
  const addressLabel = form.address_label.trim();

  emit('submit', {
    name: form.name,
    phone: form.phone || null,
    type: form.type,
    notes: form.notes || null,
    address: !customer && addressLine ? { label: addressLabel || 'Home', address_line: addressLine } : null,
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

      <div v-if="!customer" class="space-y-3 rounded-md border border-sparkling-silver p-3">
        <p class="text-sm font-medium text-casual-navy">Default address (optional)</p>
        <p class="text-xs text-independence">Add more addresses later from the customer profile.</p>
        <BaseInput v-model="form.address_label" label="Label" placeholder="Home" />
        <BaseTextarea v-model="form.address_line" label="Address" :rows="2" />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="customer-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
