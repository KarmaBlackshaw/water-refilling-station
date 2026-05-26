<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  tabs: Array<{ key: string; label: string }>;
}>();
</script>

<template>
  <div class="flex gap-2" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="model === tab.key"
      class="flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 border rounded focus-visible:ring-tampa -mb-px text-start cursor-pointer"
      :class="[model === tab.key ? 'text-tampa border-tampa' : 'text-gray-400 border-gray-200 hover:text-casual-navy']"
      @click="model = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
