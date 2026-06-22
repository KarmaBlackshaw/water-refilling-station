<script setup lang="ts">
import type { AddressFields } from '@/constants/customer';

defineOptions({ name: 'CustomerAddressTab' });

const label = defineModel<string>('label', { required: true });
const fields = defineModel<AddressFields>('fields', { required: true });
const landmark = defineModel<string>('landmark', { required: true });
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm font-medium text-casual-navy">Default address (optional)</p>
    <p class="text-xs text-independence">Add more addresses later from the customer profile.</p>
    <BaseInput v-model="label" label="Address label (e.g. Home)" placeholder="Home" />
    <CustomerAddressFieldCascade v-model="fields" />
    <BaseInput v-model="landmark" label="Landmark (optional)" />
  </div>
</template>
