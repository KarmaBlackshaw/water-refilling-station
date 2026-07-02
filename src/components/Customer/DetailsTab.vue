<script setup lang="ts">
import { CUSTOMER_TYPE_OPTIONS, type CustomerForm } from '@/constants/customer';
import type { TabErrors } from '@/helpers/validation';

defineOptions({ name: 'CustomerDetailsTab' });

const { errors } = defineProps<{ errors?: TabErrors }>();

const model = defineModel<CustomerForm>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <BaseInput v-model="model.name" label="Name" required :error="errors?.name" />
    <BaseInput v-model="model.phone" label="Phone" type="tel" :error="errors?.phone" />
    <BaseSelect v-model="model.type" label="Type" :options="CUSTOMER_TYPE_OPTIONS" />
    <BaseTextarea v-model="model.notes" label="Notes" :rows="2" />
  </div>
</template>
