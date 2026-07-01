<script setup lang="ts">
import { WEEKDAYS } from '@/constants/rider';

defineOptions({ name: 'BaseWeekdayToggle' });

const selected = defineModel<Set<number>>({ required: true });

const { cols = 2 } = defineProps<{ cols?: 2 | 3 | 4 }>();
</script>

<template>
  <BaseToggleGroup v-model="selected" :options="WEEKDAYS" :cols="cols" multiple />
</template>
