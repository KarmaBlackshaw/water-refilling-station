<script setup lang="ts" generic="T extends string | number">
import type { Option } from '@/types';

defineOptions({ name: 'BaseToggleGroup' });

/** Single-select binds `T`; multi-select binds `Set<T>` (pass `multiple`). */
const model = defineModel<T | Set<T>>({ required: true });

const {
  options,
  cols = 2,
  multiple = false,
} = defineProps<{
  options: Option<T>[];
  cols?: 2 | 3 | 4;
  multiple?: boolean;
}>();

const gridClass = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

function isSelected(value: T) {
  const current = model.value;

  return current instanceof Set ? current.has(value) : current === value;
}

function toggle(value: T) {
  if (!multiple) {
    model.value = value;
    return;
  }

  const current = model.value;
  const next = new Set(current instanceof Set ? current : []);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  model.value = next;
}
</script>

<template>
  <div class="grid gap-2" :class="gridClass[cols]" role="group">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :disabled="option.disabled"
      :aria-pressed="isSelected(option.value)"
      class="cursor-pointer rounded border px-4 py-3 text-start text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tampa disabled:cursor-not-allowed disabled:opacity-50"
      :class="isSelected(option.value) ? 'border-tampa font-bold text-tampa' : 'border-gray-200 font-normal text-gray-400 hover:text-casual-navy'"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
