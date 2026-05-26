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
      address: {
        label: string;
        street: string;
        barangay: string;
        city: string;
        landmark: string | null;
        lat: number | null;
        lng: number | null;
      } | null;
    },
  ];
}>();

const form = reactive({
  name: '',
  phone: '',
  type: 'residential' as 'residential' | 'commercial',
  notes: '',
});

const addressFields = reactive({
  street: '',
  barangay: '',
  city: '',
  lat: null as number | null,
  lng: null as number | null,
});

const addressLabel = ref('');
const addressLandmark = ref('');

const typeOptions = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
];

function resetAddress() {
  addressFields.street = '';
  addressFields.barangay = '';
  addressFields.city = '';
  addressFields.lat = null;
  addressFields.lng = null;
  addressLabel.value = '';
  addressLandmark.value = '';
}

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

    resetAddress();
  },
  { immediate: true },
);

function submit() {
  const hasAddress = addressFields.street || addressFields.barangay || addressFields.city;

  emit('submit', {
    name: form.name,
    phone: form.phone || null,
    type: form.type,
    notes: form.notes || null,
    address:
      !customer && hasAddress
        ? {
            label: addressLabel.value || 'Home',
            street: addressFields.street,
            barangay: addressFields.barangay,
            city: addressFields.city,
            landmark: addressLandmark.value || null,
            lat: addressFields.lat,
            lng: addressFields.lng,
          }
        : null,
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
        <BaseInput v-model="addressLabel" label="Address label (e.g. Home)" placeholder="Home" />
        <AddressFieldCascade v-model="addressFields" />
        <BaseInput v-model="addressLandmark" label="Landmark (optional)" />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="customer-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
