<script lang="ts">
import type { ZodType } from 'zod';
import type { TabErrors } from '@/helpers/validation';

export interface FullPageTab {
  label: string;
  value: string;
  title?: string;
  subtitle?: string;
  /** Optional zod schema validated against `data()`. Errors gate navigation + Save. */
  schema?: ZodType;
  /** Getter for the value passed to `schema`. */
  data?: () => unknown;
}
</script>

<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core';
import IconClose from '@/components/Icon/IconClose.vue';
import IconCheck from '@/components/Icon/IconCheck.vue';
import IconAlertCircle from '@/components/Icon/IconAlertCircle.vue';
import IconChevronRight from '@/components/Icon/IconChevronRight.vue';

const { tabs, loading, disableSave, saveButtonText, cancelButtonText, validate } = defineProps<{
  tabs: FullPageTab[];
  loading?: boolean;
  disableSave?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  /** Injected validator (e.g. `zodErrors`) — keeps this component schema-library agnostic. */
  validate?: (schema: ZodType, value: unknown) => TabErrors;
}>();

const activeTab = defineModel<FullPageTab>('tab', { required: true });

/** Tabs the user has attempted to advance past or submit. Errors surface only on attempt — never while typing. */
const attempted = ref(new Set<string>());

const emit = defineEmits<{
  close: [];
  save: [];
}>();

const currentIndex = computed(() => tabs.findIndex((t) => t.value === activeTab.value.value));

const isLastTab = computed(() => currentIndex.value === tabs.length - 1);

/** field-errors per tab value; eagerly recomputed so indicators stay live. */
const errorsByValue = computed<Record<string, TabErrors>>(() => {
  const map: Record<string, TabErrors> = {};

  for (const tab of tabs) {
    map[tab.value] = tab.schema && validate ? validate(tab.schema, tab.data?.()) : {};
  }

  return map;
});

function isValid(tab: FullPageTab) {
  return Object.keys(errorsByValue.value[tab.value] ?? {}).length === 0;
}

/** Errors surfaced to the UI — a tab stays clean until the user attempts to advance past or submit it. */
const visibleErrors = computed<Record<string, TabErrors>>(() => {
  const map: Record<string, TabErrors> = {};

  for (const tab of tabs) {
    map[tab.value] = attempted.value.has(tab.value) ? (errorsByValue.value[tab.value] ?? {}) : {};
  }

  return map;
});

function showError(tab: FullPageTab) {
  return Object.keys(visibleErrors.value[tab.value] ?? {}).length > 0;
}

const canGoBack = computed(() => currentIndex.value > 0);

function isActive(tab: FullPageTab) {
  return tab.value === activeTab.value.value;
}

function isCompleted(tab: FullPageTab) {
  return isValid(tab) && currentIndex.value > tabs.findIndex((t) => t.value === tab.value);
}

function navigateTo(target: FullPageTab) {
  if (loading) {
    return;
  }

  const targetIndex = tabs.findIndex((t) => t.value === target.value);

  /** Moving forward: the current tab and every tab passed through must be valid.
   *  On the first invalid one, reveal its errors and stop there instead of advancing. */
  if (targetIndex > currentIndex.value) {
    for (let i = currentIndex.value; i < targetIndex; i++) {
      const tab = tabs[i]!;

      if (!isValid(tab)) {
        attempted.value.add(tab.value);
        activeTab.value = tab;
        return;
      }
    }
  }

  activeTab.value = target;
}

/** Submit gate: reveal all errors, jump to the first invalid tab, and block save until every tab is valid. */
function attemptSave() {
  if (loading || disableSave) {
    return;
  }

  const firstInvalid = tabs.find((tab) => !isValid(tab));

  if (firstInvalid) {
    for (const tab of tabs) {
      attempted.value.add(tab.value);
    }

    activeTab.value = firstInvalid;

    return;
  }

  emit('save');
}

function goNext() {
  const next = tabs[currentIndex.value + 1];

  if (next) {
    navigateTo(next);
  }
}

function goBack() {
  const prev = tabs[currentIndex.value - 1];

  if (prev) {
    navigateTo(prev);
  }
}

function close() {
  if (!loading) {
    emit('close');
  }
}

onKeyStroke('Escape', close);

onKeyStroke('Enter', (e) => {
  if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
    return;
  }

  e.preventDefault();

  if (loading) {
    return;
  }

  if (isLastTab.value) {
    attemptSave();
  } else {
    goNext();
  }
});
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex flex-col bg-full-white">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex h-13 flex-none items-center gap-x-6 border-b border-sparkling-silver bg-full-white px-4">
        <!-- Close + esc chip -->
        <div class="flex flex-none items-center gap-x-2">
          <button
            type="button"
            :disabled="loading"
            class="flex size-7 items-center justify-center rounded-md text-independence transition-colors hover:bg-hover hover:text-tampa"
            :class="{ 'cursor-not-allowed opacity-50': loading }"
            aria-label="Close"
            @click="close"
          >
            <IconClose class="size-4" />
          </button>
          <div class="flex h-5 items-center rounded-md border border-sparkling-silver bg-bright-chrome px-1 text-xs font-medium text-independence">esc</div>
        </div>

        <!-- Progress tabs -->
        <div class="flex h-full flex-1 items-stretch overflow-x-auto overflow-y-hidden">
          <div class="flex flex-nowrap items-stretch">
            <div class="h-full w-px flex-none bg-sparkling-silver" />
            <template v-for="tab in tabs" :key="tab.value">
              <button
                type="button"
                class="flex h-full w-50 flex-none cursor-pointer items-center gap-x-2.5 px-4 text-sm font-medium transition-colors"
                :class="isActive(tab) ? 'text-casual-navy' : 'text-oslo hover:text-independence'"
                @click="navigateTo(tab)"
              >
                <IconAlertCircle v-if="showError(tab)" class="size-4 text-blaze-red" />
                <IconCheck v-else-if="isCompleted(tab)" class="size-4 text-dark-green-turquoise" />
                <span v-else class="size-3.5 flex-none rounded-full border-2" :class="isActive(tab) ? 'border-tampa' : 'border-tender-light-blue'" />
                <span class="truncate text-left">{{ tab.label }}</span>
              </button>
              <div class="h-full w-px flex-none bg-sparkling-silver" />
            </template>
          </div>
        </div>

        <!-- Step back / forward -->
        <div class="flex flex-none items-center gap-x-1">
          <BaseButton variant="full-white" size="sm" :disabled="!canGoBack || loading" aria-label="Previous step" @click="goBack">
            <IconChevronRight class="size-4 rotate-180" />
          </BaseButton>
          <BaseButton variant="full-white" size="sm" :disabled="isLastTab || loading" aria-label="Next step" @click="goNext">
            <IconChevronRight class="size-4" />
          </BaseButton>
        </div>

        <!-- Cancel + Save / Continue -->
        <div class="flex flex-none items-center gap-x-1">
          <BaseButton variant="full-white" size="sm" :disabled="loading" @click="close">{{ cancelButtonText || 'Cancel' }}</BaseButton>
          <BaseButton v-if="isLastTab" size="sm" :loading="loading" :disabled="loading || disableSave" @click="attemptSave">
            {{ saveButtonText || 'Save' }}
          </BaseButton>
          <BaseButton v-else size="sm" :disabled="loading" @click="goNext">Continue</BaseButton>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <slot name="content" :active-tab="activeTab" :errors="visibleErrors" />
      </div>
    </div>
  </Teleport>
</template>
