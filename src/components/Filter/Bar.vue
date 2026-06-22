<script setup lang="ts">
import { type FilterDefinition, type FilterFieldDateRange, type FilterPillValue, type FilterValues, isFilterFieldDateRange } from '@/types';

defineOptions({ name: 'FilterBar' });

const model = defineModel<FilterValues>({ required: true });

defineProps<{
  definitions: FilterDefinition[];
}>();

const emit = defineEmits<{
  apply: [];
}>();

const hasAnyValue = computed(() => Object.values(model.value).some((v) => v !== '' && v != null));

function pillId(def: FilterDefinition): string {
  return isFilterFieldDateRange(def) ? `${def.keyFrom}~${def.keyTo}` : def.key;
}

function pillValue(def: FilterDefinition): FilterPillValue {
  if (isFilterFieldDateRange(def)) {
    return [model.value[def.keyFrom] ?? '', model.value[def.keyTo] ?? ''];
  }

  return model.value[def.key] ?? '';
}

function commitRange(def: FilterFieldDateRange, value: FilterPillValue) {
  const tuple = Array.isArray(value) ? value : ['', ''];

  model.value = {
    ...model.value,
    [def.keyFrom]: tuple[0] ?? '',
    [def.keyTo]: tuple[1] ?? '',
  };
  emit('apply');
}

function commitScalar(key: string, value: FilterPillValue) {
  const next = Array.isArray(value) ? (value[0] ?? '') : value;

  model.value = { ...model.value, [key]: next };
  emit('apply');
}

function onUpdate(def: FilterDefinition, value: FilterPillValue) {
  if (isFilterFieldDateRange(def)) {
    commitRange(def, value);
    return;
  }

  commitScalar(def.key, value);
}

function clearAll() {
  const next: FilterValues = {};

  for (const key of Object.keys(model.value)) {
    next[key] = '';
  }
  model.value = next;
  emit('apply');
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
    <FilterPill
      v-for="def in definitions"
      :key="pillId(def)"
      :definition="def"
      :model-value="pillValue(def)"
      @update:model-value="onUpdate(def, $event)"
      @apply="emit('apply')"
    />
    <slot name="actions" />
    <button v-if="hasAnyValue" type="button" class="text-xs font-semibold text-tampa hover:underline" @click="clearAll">Clear filters</button>
  </div>
</template>
