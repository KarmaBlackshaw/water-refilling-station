<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number | null;
  options: Array<{ label: string; value: string | number }>;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const uid = `select-${Math.random().toString(36).slice(2, 9)}`;
const selectId = computed(() => props.id ?? uid);
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" :for="selectId" class="text-xs font-medium text-oslo">
      {{ label }}
      <span v-if="required" class="text-blaze-red" aria-hidden="true"> *</span>
    </label>

    <select
      :id="selectId"
      :value="modelValue ?? ''"
      :disabled="disabled"
      :required="required"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${selectId}-error` : undefined"
      :class="[
        'w-full rounded-md border border-sparkling-silver bg-full-white px-3 py-2 text-sm text-casual-navy focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-blaze-red' : '',
      ]"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option value="" disabled>{{ placeholder ?? 'Select...' }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>

    <p v-if="error" :id="`${selectId}-error`" class="text-xs text-blaze-red" role="alert">
      {{ error }}
    </p>
  </div>
</template>
