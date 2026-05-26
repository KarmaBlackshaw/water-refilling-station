<script setup lang="ts">
const model = defineModel<boolean>({ required: true });

defineProps<{
  label?: string;
  disabled?: boolean;
}>();

const uid = `checkbox-${Math.random().toString(36).slice(2, 9)}`;
const checkboxId = computed(() => `${uid}`);
</script>

<template>
  <label :for="checkboxId" class="inline-flex items-center gap-2 cursor-pointer select-none" :class="disabled ? 'opacity-50 cursor-not-allowed' : ''">
    <input
      :id="checkboxId"
      v-model="model"
      type="checkbox"
      :disabled="disabled"
      class="size-4 rounded border border-sparkling-silver bg-full-white text-tampa accent-tampa focus:outline-none focus:ring-2 focus:ring-tampa disabled:cursor-not-allowed"
    />
    <span v-if="label" class="text-sm text-casual-navy">{{ label }}</span>
  </label>
</template>
