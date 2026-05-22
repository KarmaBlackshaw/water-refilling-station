<script setup lang="ts">
const model = defineModel<string | number | null>({ required: true });

const {
  options,
  label,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  error,
  helperText,
  disabled = false,
  required = false,
  searchable = false,
  id,
} = defineProps<{
  options: Array<{ label: string; value: string | number }>;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  id?: string;
}>();

const { BUTTON_REF, POPPER_REF, show, hide, toggle, isVisible } = useFloat({
  placement: 'bottom-start',
});

const selectedLabel = computed(() => {
  const match = options.find((o) => o.value === model.value);

  return match?.label ?? '';
});

const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const filteredOptions = computed(() => {
  if (!searchable) {
    return options;
  }

  const q = searchQuery.value.trim().toLowerCase();

  if (!q) {
    return options;
  }

  return options.filter((o) => o.label.toLowerCase().includes(q));
});

const activeIndex = ref(-1);

watch(isVisible, async (open) => {
  if (!open) {
    activeIndex.value = -1;
    searchQuery.value = '';
    return;
  }

  const current = filteredOptions.value.findIndex((o) => o.value === model.value);

  activeIndex.value = current >= 0 ? current : 0;

  if (searchable) {
    await nextTick();
    searchInputRef.value?.focus();
  }
});

watch(searchQuery, () => {
  activeIndex.value = filteredOptions.value.length > 0 ? 0 : -1;
});

function selectAt(index: number) {
  const option = filteredOptions.value[index];

  if (!option) {
    return;
  }

  model.value = option.value;
  hide();
}

function moveActive(delta: number) {
  const list = filteredOptions.value;

  if (list.length === 0) {
    return;
  }

  if (!isVisible.value) {
    show();
    return;
  }

  const next = activeIndex.value + delta;

  if (next < 0) {
    activeIndex.value = list.length - 1;
  } else if (next >= list.length) {
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
      activeIndex.value = filteredOptions.value.length - 1;
      break;
    case 'Enter':
      event.preventDefault();
      if (!isVisible.value) {
        show();
      } else if (activeIndex.value >= 0) {
        selectAt(activeIndex.value);
      }

      break;
    case ' ':
      if (searchable && isVisible.value) {
        return;
      }

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

      <div :ref="POPPER_REF" class="rounded-md border border-sparkling-silver bg-full-white text-sm shadow-lg">
        <div v-if="searchable" class="border-b border-sparkling-silver p-1">
          <input
            :ref="(el) => (searchInputRef = el as HTMLInputElement | null)"
            v-model="searchQuery"
            type="search"
            :placeholder="searchPlaceholder"
            :aria-controls="`${controlId}-listbox`"
            class="w-full rounded px-2 py-1.5 text-sm text-casual-navy placeholder:text-oslo focus:outline-none focus:ring-2 focus:ring-turquoise-stone"
            @keydown="onKeydown"
          />
        </div>
        <ul :id="`${controlId}-listbox`" role="listbox" :aria-labelledby="controlId" class="m-0 max-h-60 list-none overflow-y-auto p-1">
          <li
            v-for="(option, index) in filteredOptions"
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
          <li v-if="filteredOptions.length === 0" class="px-3 py-2 text-oslo">
            {{ searchable && searchQuery ? 'No matches' : 'No options' }}
          </li>
        </ul>
      </div>
    </template>
  </BaseFormField>
</template>
