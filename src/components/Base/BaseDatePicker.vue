<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';

type DateValue = Date | string | null;

const model = defineModel<DateValue>({ required: true });

defineProps<{
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
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <VueDatePicker
        v-model="model"
        teleport="body"
        :uid="controlId"
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
        :class="['base-datepicker', hasError ? 'base-datepicker--error' : '', disabled ? 'base-datepicker--disabled' : '']"
        :aria-invalid="hasError"
        :aria-describedby="describedBy"
      />
    </template>
  </BaseFormField>
</template>

<style>
.base-datepicker {
  --dp-border-radius: 0.375rem;
  --dp-font-size: 0.875rem;
  --dp-input-padding: 0 0.75rem;
  --dp-border-color: var(--color-sparkling-silver, #d1d5db);
  --dp-border-color-hover: var(--color-turquoise-stone, #14b8a6);
  --dp-border-color-focus: var(--color-turquoise-stone, #14b8a6);
  --dp-text-color: var(--color-casual-navy, #1f2937);
  --dp-icon-color: var(--color-oslo, #6b7280);
  --dp-background-color: var(--color-full-white, #ffffff);
  --dp-primary-color: var(--color-turquoise-stone, #14b8a6);
}
.base-datepicker .dp__input {
  height: 2.5rem;
  box-sizing: border-box;
  line-height: 1.25rem;
}
.base-datepicker--error {
  --dp-border-color: var(--color-blaze-red, #ef4444);
  --dp-border-color-hover: var(--color-blaze-red, #ef4444);
  --dp-border-color-focus: var(--color-blaze-red, #ef4444);
}
.base-datepicker--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
