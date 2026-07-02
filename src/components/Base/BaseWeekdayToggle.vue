<script setup lang="ts">
import { WEEKDAYS } from '@/constants/rider';

defineOptions({ name: 'BaseWeekdayToggle' });

const selected = defineModel<number[]>({ required: true });

const { cols = 2, label, description } = defineProps<{ cols?: 2 | 3 | 4; label?: string; description?: string }>();

/** BaseToggleGroup binds a Set for multi-select; rest days are stored as a sorted number[]. */
const set = computed({
  get: () => new Set(selected.value),
  set: (next) => (selected.value = [...next].sort((a, b) => a - b)),
});
</script>

<template>
  <BaseToggleGroup v-model="set" :options="WEEKDAYS" :cols="cols" :label="label" :description="description" multiple />
</template>
