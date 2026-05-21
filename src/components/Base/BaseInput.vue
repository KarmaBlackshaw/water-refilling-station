<script setup lang="ts">
const props = defineProps<{
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

const uid = `input-${Math.random().toString(36).slice(2, 9)}`;
const inputId = computed(() => props.id ?? uid);
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="inputId" class="text-xs font-medium text-oslo">
      {{ label }}
      <span v-if="required" class="text-blaze-red" aria-hidden="true"> *</span>
    </label>

    <input
      :id="inputId"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined"
      :class="[
        'w-full rounded-md border border-sparkling-silver bg-full-white px-3 py-2 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-blaze-red' : '',
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <p v-if="error" :id="`${inputId}-error`" class="text-xs text-blaze-red" role="alert">
      {{ error }}
    </p>
    <p v-else-if="helperText" :id="`${inputId}-helper`" class="text-xs text-independence">
      {{ helperText }}
    </p>
  </div>
</template>
