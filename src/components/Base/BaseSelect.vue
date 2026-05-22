<script setup lang="ts">
const model = defineModel<string | number | null>({ required: true });

const {
  options,
  label,
  placeholder = 'Select...',
  error,
  helperText,
  disabled = false,
  required = false,
  id,
} = defineProps<{
  options: Array<{ label: string; value: string | number }>;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}>();

const { BUTTON_REF, POPPER_REF, show, hide, toggle, isVisible } = useFloat({
  placement: 'bottom-start',
});

const selectedLabel = computed(() => {
  const match = options.find((o) => o.value === model.value);

  return match?.label ?? '';
});

const activeIndex = ref(-1);

watch(isVisible, (open) => {
  if (!open) {
    activeIndex.value = -1;
    return;
  }

  const current = options.findIndex((o) => o.value === model.value);

  activeIndex.value = current >= 0 ? current : 0;
});

function selectAt(index: number) {
  const option = options[index];

  if (!option) {
    return;
  }

  model.value = option.value;
  hide();
}

function moveActive(delta: number) {
  if (options.length === 0) {
    return;
  }

  if (!isVisible.value) {
    show();
    return;
  }

  const next = activeIndex.value + delta;

  if (next < 0) {
    activeIndex.value = options.length - 1;
  } else if (next >= options.length) {
    activeIndex.value = 0;
  } else {
    activeIndex.value = next;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (disabled) {
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      moveActive(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      moveActive(-1);
      break;
    case 'Home':
      if (!isVisible.value) {
        return;
      }

      event.preventDefault();
      activeIndex.value = 0;
      break;
    case 'End':
      if (!isVisible.value) {
        return;
      }

      event.preventDefault();
      activeIndex.value = options.length - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (!isVisible.value) {
        show();
      } else if (activeIndex.value >= 0) {
        selectAt(activeIndex.value);
      }

      break;
    case 'Escape':
      if (isVisible.value) {
        event.preventDefault();
        hide();
      }

      break;
    case 'Tab':
      if (isVisible.value) {
        hide();
      }

      break;
    default:
      break;
  }
}

function onTriggerClick() {
  if (disabled) {
    return;
  }

  toggle();
}
</script>

<template>
  <BaseFormField :id="id" :label="label" :error="error" :helper-text="helperText" :required="required">
    <template #default="{ controlId, describedBy, hasError }">
      <button
        :id="controlId"
        :ref="BUTTON_REF"
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        :aria-expanded="isVisible"
        :aria-controls="`${controlId}-listbox`"
        :aria-activedescendant="isVisible && activeIndex >= 0 ? `${controlId}-option-${activeIndex}` : undefined"
        :aria-invalid="hasError"
        :aria-describedby="describedBy"
        :aria-required="required || undefined"
        :disabled="disabled"
        :class="[
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-full-white px-3 text-left text-sm text-casual-navy focus:outline-none focus:ring-2 focus:ring-turquoise-stone disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-blaze-red' : 'border-sparkling-silver',
        ]"
        @click="onTriggerClick"
        @keydown="onKeydown"
      >
        <span :class="['truncate', selectedLabel ? '' : 'text-oslo']">
          {{ selectedLabel || placeholder }}
        </span>
        <svg
          class="h-4 w-4 shrink-0 text-oslo transition-transform"
          :class="isVisible ? 'rotate-180' : ''"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </button>

      <ul
        :id="`${controlId}-listbox`"
        :ref="POPPER_REF"
        role="listbox"
        :aria-labelledby="controlId"
        class="m-0 max-h-60 list-none overflow-y-auto rounded-md border border-sparkling-silver bg-full-white p-1 text-sm shadow-lg"
      >
        <li
          v-for="(option, index) in options"
          :id="`${controlId}-option-${index}`"
          :key="option.value"
          role="option"
          :aria-selected="option.value === model"
          :class="[
            'cursor-pointer rounded px-3 py-2 text-casual-navy',
            index === activeIndex ? 'bg-turquoise-stone/10' : '',
            option.value === model ? 'font-medium' : '',
          ]"
          @mouseenter="activeIndex = index"
          @click="selectAt(index)"
        >
          {{ option.label }}
        </li>
        <li v-if="options.length === 0" class="px-3 py-2 text-oslo">No options</li>
      </ul>
    </template>
  </BaseFormField>
</template>
