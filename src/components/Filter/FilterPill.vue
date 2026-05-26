<script setup lang="ts">
import { type FilterDefinition, type FilterPillValue, isFilterFieldDateRange, isFilterFieldSelect, isFilterFieldDate } from '@/types';

const model = defineModel<FilterPillValue>({ required: true });

const { definition } = defineProps<{
  definition: FilterDefinition;
}>();

const emit = defineEmits<{
  apply: [];
}>();

const { BUTTON_REF, POPPER_REF, show, hide, isVisible } = useFloat({ placement: 'bottom-start' });
const popperEl = useTemplateRef<HTMLElement>(POPPER_REF);

const emptyValue = computed<FilterPillValue>(() => (isFilterFieldDateRange(definition) ? ['', ''] : ''));

const draft = ref<FilterPillValue>(model.value);

const hasValue = computed(() => {
  if (Array.isArray(model.value)) {
    return model.value.some((v) => v !== '' && v != null);
  }

  return model.value !== '' && model.value != null;
});

const displayValue = computed(() => {
  if (!hasValue.value) {
    return '';
  }

  if (isFilterFieldDateRange(definition) && Array.isArray(model.value)) {
    const [from, to] = model.value;
    const left = from ? formatDateDisplay(from) : '…';
    const right = to ? formatDateDisplay(to) : '…';

    return `${left} ~ ${right}`;
  }

  if (Array.isArray(model.value)) {
    return '';
  }

  if (isFilterFieldSelect(definition)) {
    const match = definition.options.find((o) => o.value === model.value);

    return match?.label ?? model.value;
  }

  if (isFilterFieldDate(definition)) {
    return formatDateDisplay(model.value);
  }

  return model.value;
});

function openPopover() {
  if (definition.disabled) {
    return;
  }

  draft.value = Array.isArray(model.value) ? [...model.value] : model.value;
  show();
}

function commit() {
  const next = draft.value;

  if (Array.isArray(next) && Array.isArray(model.value)) {
    if (next[0] === model.value[0] && next[1] === model.value[1]) {
      hide();
      return;
    }
  } else if (next === model.value) {
    hide();
    return;
  }

  model.value = next;
  emit('apply');
  hide();
}

function clear(event: Event) {
  event.stopPropagation();
  if (!hasValue.value) {
    return;
  }

  model.value = emptyValue.value;
  draft.value = emptyValue.value;
  emit('apply');
}

onClickOutside(popperEl, () => {
  if (!isVisible.value) {
    return;
  }

  commit();
});
</script>

<template>
  <div class="relative inline-block select-none">
    <button
      :ref="BUTTON_REF"
      type="button"
      :disabled="definition.disabled"
      class="flex min-h-[28px] items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-casual-navy transition-colors hover:bg-bright-chrome disabled:cursor-not-allowed disabled:opacity-50"
      :class="[isVisible ? 'bg-bright-chrome' : '', hasValue ? '!border-solid border-sparkling-silver' : 'border-sparkling-silver']"
      @click="openPopover"
    >
      <span
        class="flex size-4 items-center justify-center rounded-full border border-sparkling-silver text-oslo"
        :class="hasValue ? 'cursor-pointer hover:text-blaze-red' : ''"
        @click="hasValue ? clear($event) : undefined"
      >
        <IconX v-if="hasValue" :size="10" />
        <IconPlus v-else :size="10" />
      </span>
      <span>{{ definition.label }}</span>
      <span v-if="hasValue" class="text-tampa">
        {{ displayValue }}
      </span>
    </button>

    <div :ref="POPPER_REF" class="hidden z-40 w-[300px] space-y-3 rounded-md border border-sparkling-silver bg-full-white p-3 shadow-md">
      <p class="text-xs font-medium text-casual-navy">Filter by {{ definition.label }}</p>

      <BaseSelect v-if="isFilterFieldSelect(definition)" v-model="draft" :options="definition.options" :placeholder="definition.placeholder" searchable />
      <BaseDatePicker
        v-else-if="isFilterFieldDate(definition)"
        v-model="draft"
        :placeholder="definition.placeholder"
        :min-date="definition.minDate"
        :max-date="definition.maxDate"
      />
      <BaseDatePicker
        v-else-if="isFilterFieldDateRange(definition)"
        v-model="draft"
        range
        :placeholder="definition.placeholder"
        :min-date="definition.minDate"
        :max-date="definition.maxDate"
      />
      <BaseInput v-else v-model="draft" :placeholder="definition.placeholder" />

      <BaseButton size="sm" class="w-full" @click="commit">Apply</BaseButton>
    </div>
  </div>
</template>
