<script setup lang="ts">
import { CUSTOMER_TYPE_OPTIONS, type CustomerForm } from '@/constants/customer';

defineOptions({ name: 'CustomerDetailsTab' });

const model = defineModel<CustomerForm>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <BaseInput v-model="model.name" label="Name" required />
    <BaseInput v-model="model.phone" label="Phone" type="tel" />
    <BaseSelect v-model="model.type" label="Type" :options="CUSTOMER_TYPE_OPTIONS" />
    <BaseTextarea v-model="model.notes" label="Notes" :rows="2" />
  </div>
</template>
