<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <input
        :id="controlId"
        :type="type ?? 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasError"
        :aria-describedby="describedBy"
        :class="[
          'h-10 w-full rounded-md border bg-full-white px-3 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-blaze-red' : 'border-sparkling-silver',
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </template>
  </BaseFormField>
</template>
