<script setup lang="ts">
const model = defineModel<string | number>({ required: true });

defineProps<{
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  rows?: number;
}>();
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <textarea
        :id="controlId"
        v-model="model"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows ?? 3"
        :aria-invalid="hasError"
        :aria-describedby="describedBy"
        :class="[
          'w-full resize-y rounded-md border bg-full-white px-3 py-2 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-blaze-red' : 'border-sparkling-silver',
        ]"
      />
    </template>
  </BaseFormField>
</template>
