<script setup lang="ts">
import type { FilterDefinition, FilterValues } from '@/types';

const model = defineModel<FilterValues>({ required: true });

defineProps<{
  definitions: FilterDefinition[];
}>();

const emit = defineEmits<{
  apply: [];
}>();
</script>

<template>
  <div class="px-5">
    <FilterBar v-model="model" :definitions="definitions" @apply="emit('apply')">
      <template #actions><slot name="actions" /></template>
    </FilterBar>
  </div>
</template>
