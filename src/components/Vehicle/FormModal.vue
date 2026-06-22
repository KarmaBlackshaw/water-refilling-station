<script setup lang="ts">
import type { Vehicle } from '@/types/database';

defineOptions({ name: 'VehicleFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { vehicle, saving } = defineProps<{
  vehicle?: Vehicle;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      type: string;
      brand_model: string;
      plate_number: string;
      year: number | null;
      notes: string | null;
    },
  ];
}>();

type FormState = {
  type: string;
  brand_model: string;
  plate_number: string;
  year: string | number;
  notes: string;
};

const form = reactive<FormState>({
  type: '',
  brand_model: '',
  plate_number: '',
  year: '',
  notes: '',
});

const vehicleTypeOptions = [
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Tricycle', value: 'tricycle' },
  { label: 'Truck', value: 'truck' },
  { label: 'Van', value: 'van' },
  { label: 'Other', value: 'other' },
];

const year = currentYear();

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (vehicle) {
      form.type = vehicle.type;
      form.brand_model = vehicle.brand_model ?? '';
      form.plate_number = vehicle.plate_number ?? '';
      form.year = vehicle.year ?? '';
      form.notes = vehicle.notes ?? '';
    } else {
      form.type = '';
      form.brand_model = '';
      form.plate_number = '';
      form.year = '';
      form.notes = '';
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    type: form.type,
    brand_model: form.brand_model,
    plate_number: form.plate_number,
    year: form.year !== '' ? Number(form.year) : null,
    notes: form.notes || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="vehicle ? 'Edit Vehicle' : 'Add Vehicle'">
    <form id="vehicle-form" class="space-y-4" @submit.prevent="submit">
      <BaseSelect v-model="form.type" label="Type" :options="vehicleTypeOptions" placeholder="Select type..." required />
      <BaseInput v-model="form.brand_model" label="Brand / Model" placeholder="e.g. Honda Wave 125" required />
      <BaseInput v-model="form.plate_number" label="Plate Number" placeholder="e.g. ABC 1234" required />
      <BaseInput v-model="form.year" label="Year (optional)" type="number" :min="1990" :max="year" placeholder="e.g. 2022" />
      <BaseTextarea v-model="form.notes" label="Notes (optional)" :rows="3" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="vehicle-form" :loading="saving">
        {{ vehicle ? 'Save changes' : 'Add Vehicle' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
