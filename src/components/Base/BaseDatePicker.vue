<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';

type DateValue = Date | string | null;

const props = defineProps<{
  modelValue: DateValue;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  format?: string;
  modelType?: string;
  enableTimePicker?: boolean;
  range?: boolean;
  clearable?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: DateValue];
}>();

const uid = `datepicker-${Math.random().toString(36).slice(2, 9)}`;
const inputId = computed(() => props.id ?? uid);
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="inputId" class="text-xs font-medium text-oslo">
      {{ label }}
      <span v-if="required" class="text-blaze-red" aria-hidden="true"> *</span>
    </label>

    <VueDatePicker
      :uid="inputId"
      :model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :min-date="minDate"
      :max-date="maxDate"
      :format="format"
      :model-type="modelType ?? 'yyyy-MM-dd'"
      :enable-time-picker="enableTimePicker ?? false"
      :range="range"
      :clearable="clearable ?? true"
      :auto-apply="!enableTimePicker"
      :class="['base-datepicker', error ? 'base-datepicker--error' : '']"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined"
      @update:model-value="$emit('update:modelValue', $event)"
    />

    <p v-if="error" :id="`${inputId}-error`" class="text-xs text-blaze-red" role="alert">
      {{ error }}
    </p>
    <p v-else-if="helperText" :id="`${inputId}-helper`" class="text-xs text-independence">
      {{ helperText }}
    </p>
  </div>
</template>

<style>
.base-datepicker {
  --dp-border-radius: 0.375rem;
  --dp-font-size: 0.875rem;
  --dp-input-padding: 0.5rem 0.75rem;
  --dp-border-color: var(--color-sparkling-silver, #d1d5db);
  --dp-border-color-hover: var(--color-turquoise-stone, #14b8a6);
  --dp-border-color-focus: var(--color-turquoise-stone, #14b8a6);
  --dp-text-color: var(--color-casual-navy, #1f2937);
  --dp-icon-color: var(--color-oslo, #6b7280);
  --dp-background-color: var(--color-full-white, #ffffff);
  --dp-primary-color: var(--color-turquoise-stone, #14b8a6);
}
.base-datepicker--error {
  --dp-border-color: var(--color-blaze-red, #ef4444);
  --dp-border-color-hover: var(--color-blaze-red, #ef4444);
  --dp-border-color-focus: var(--color-blaze-red, #ef4444);
}
</style>
