<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  label?: string;
  disabled?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const uid = `checkbox-${Math.random().toString(36).slice(2, 9)}`;
const checkboxId = computed(() => `${uid}`);
</script>

<template>
  <label :for="checkboxId" class="inline-flex items-center gap-2 cursor-pointer select-none" :class="disabled ? 'opacity-50 cursor-not-allowed' : ''">
    <input
      :id="checkboxId"
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="size-4 rounded border border-sparkling-silver bg-full-white text-turquoise-stone accent-turquoise-stone focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:cursor-not-allowed"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span v-if="label" class="text-sm text-casual-navy">{{ label }}</span>
  </label>
</template>
