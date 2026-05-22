<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  rows?: number;
}>();

defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <textarea
        :id="controlId"
        :value="modelValue"
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
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />
    </template>
  </BaseFormField>
</template>
