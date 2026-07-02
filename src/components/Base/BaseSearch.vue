<script setup lang="ts">
const model = defineModel<string>({ required: true });

defineProps<{
  placeholder?: string;
  disabled?: boolean;
}>();
</script>

<template>
  <div class="relative">
    <IconSearch class="absolute left-2.5 top-1/2 -translate-y-1/2 text-oslo pointer-events-none" :size="14" />
    <input
      v-model="model"
      type="search"
      :placeholder="placeholder ?? 'Search here'"
      :disabled="disabled"
      class="h-10 w-52 rounded-md border border-sparkling-silver bg-full-white pl-8 pr-3 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-tampa disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>
</template>
