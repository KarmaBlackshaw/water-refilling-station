<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  tabs: Array<{ key: string; label: string }>;
}>();
</script>

<template>
  <div class="flex border-b border-sparkling-silver" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="model === tab.key"
      :class="[
        'px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-stone',
        model === tab.key ? 'text-turquoise-stone border-b-2 border-turquoise-stone -mb-px' : 'text-independence hover:text-casual-navy',
      ]"
      @click="model = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
