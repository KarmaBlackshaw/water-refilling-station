<script setup lang="ts">
const model = defineModel<string | number>({ required: true });

defineProps<{
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}>();
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <input
        :id="controlId"
        v-model="model"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="hasError"
        :aria-describedby="describedBy"
        :class="[
          'h-10 w-full rounded-md border bg-full-white px-3 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-blaze-red' : 'border-sparkling-silver',
        ]"
      />
    </template>
  </BaseFormField>
</template>
