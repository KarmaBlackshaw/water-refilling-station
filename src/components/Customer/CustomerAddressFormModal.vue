<script setup lang="ts">
import type { CustomerAddress } from '@/types/database';

type AddressFields = {
  street: string;
  barangay: string;
  city: string;
  lat: number | null;
  lng: number | null;
};

const open = defineModel<boolean>('open', { required: true });

const { address, isFirstAddress, saving } = defineProps<{
  address?: CustomerAddress;
  isFirstAddress?: boolean;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    event: {
      payload: {
        label: string;
        street: string;
        barangay: string;
        city: string;
        landmark: string | null;
        lat: number | null;
        lng: number | null;
        is_default: boolean;
        needs_pin_review: boolean;
      };
      photoFile: File | undefined;
      removePhoto: boolean;
    },
  ];
}>();

const toast = useToast();

const form = reactive<{
  label: string;
  fields: AddressFields;
  landmark: string;
  is_default: boolean;
  needs_pin_review: boolean;
}>({
  label: '',
  fields: { street: '', barangay: '', city: '', lat: null, lng: null },
  landmark: '',
  is_default: false,
  needs_pin_review: true,
});

const photoFile = ref<File>();
const removePhoto = ref(false);

const existingPhotoUrl = computedAsync(() => (address?.photo_path ? getAddressPhotoUrl(address.photo_path) : undefined));

watch(
  () => open.value,
  (isOpen) => {
    photoFile.value = undefined;
    removePhoto.value = false;

    if (!isOpen) {
      return;
    }

    if (address) {
      form.label = address.label;
      form.fields = {
        street: address.street ?? '',
        barangay: address.barangay ?? '',
        city: address.city ?? '',
        lat: address.lat,
        lng: address.lng,
      };
      form.landmark = address.landmark ?? '';
      form.is_default = address.is_default;
      form.needs_pin_review = address.needs_pin_review ?? true;
    } else {
      form.label = '';
      form.fields = { street: '', barangay: '', city: '', lat: null, lng: null };
      form.landmark = '';
      form.is_default = !!isFirstAddress;
      form.needs_pin_review = true;
    }
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    payload: {
      label: form.label,
      street: form.fields.street,
      barangay: form.fields.barangay,
      city: form.fields.city,
      landmark: form.landmark || null,
      lat: form.fields.lat,
      lng: form.fields.lng,
      is_default: form.is_default,
      needs_pin_review: form.needs_pin_review,
    },
    photoFile: photoFile.value,
    removePhoto: removePhoto.value,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="address ? 'Edit address' : 'Add address'">
    <form id="addr-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.label" label="Label (e.g. Home, Office)" required />

      <AddressFieldCascade v-model="form.fields" />

      <BaseInput v-model="form.landmark" label="Landmark (optional)" />

      <BaseFileUpload
        v-model:file="photoFile"
        v-model:remove="removePhoto"
        label="House photo"
        accept="image/*"
        :max-size-mb="5"
        :existing-url="existingPhotoUrl"
        @error="toast.error"
      />

      <BaseCheckbox v-model="form.is_default" label="Set as default address" />
      <BaseCheckbox v-model="form.needs_pin_review" label="Needs rider to verify GPS pin" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="addr-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
