<script setup lang="ts">
defineProps<{
  modelValue: string;
  tabs: Array<{ key: string; label: string }>;
}>();

defineEmits<{
  'update:modelValue': [key: string];
}>();
</script>

<template>
  <div class="flex border-b border-sparkling-silver" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :class="[
        'px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-stone',
        modelValue === tab.key ? 'text-turquoise-stone border-b-2 border-turquoise-stone -mb-px' : 'text-independence hover:text-casual-navy',
      ]"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
