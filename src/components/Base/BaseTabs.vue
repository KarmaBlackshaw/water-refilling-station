<script setup lang="ts">
const model = defineModel<string>({ required: true });

type Tab = {
  key: string;
  label: string;
};

defineProps<{
  tabs: ReadonlyArray<Tab>;
}>();
</script>

<template>
  <div class="flex gap-2" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="model === tab.key"
      class="flex-1 px-4 py-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 border rounded focus-visible:ring-tampa -mb-px text-start cursor-pointer"
      :class="[model === tab.key ? 'text-tampa border-tampa font-bold' : 'text-gray-400 border-gray-200 hover:text-casual-navy font-normal']"
      @click="model = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
