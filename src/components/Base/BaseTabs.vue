<script setup lang="ts">
const model = defineModel<string>({ required: true });

type Tab = {
  key: string;
  label: string;
};

const { variant = 'boxed' } = defineProps<{
  tabs: ReadonlyArray<Tab>;
  variant?: 'boxed' | 'underline';
}>();
</script>

<template>
  <div v-if="variant === 'underline'" class="flex gap-1 overflow-x-auto border-b border-sparkling-silver" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      role="tab"
      :aria-selected="model === tab.key"
      class="-mb-px flex-none cursor-pointer rounded-t-md border-b-2 px-4 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tampa"
      :class="model === tab.key ? 'border-tampa font-semibold text-tampa' : 'border-transparent font-medium text-oslo hover:bg-hover hover:text-casual-navy'"
      @click="model = tab.key"
    >
      {{ tab.label }}
    </button>
  </div>

  <div v-else class="flex gap-2" role="tablist">
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
