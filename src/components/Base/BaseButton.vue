<script setup lang="ts">
import type { Color, Size } from '@/types';
import IconSpinner from '@/components/Icon/IconSpinner.vue';

const {
  variant = 'tampa',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
} = defineProps<{
  variant?: Color;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

const variantClass = computed(() => {
  const map: Partial<Record<Color, string>> = {
    'tampa': 'bg-tampa text-white font-semibold hover:opacity-90',
    'full-white': 'bg-full-white text-casual-navy border border-sparkling-silver hover:bg-bright-chrome',
    independence: 'text-independence hover:bg-hover',
    'blaze-red': 'bg-blaze-red text-white hover:opacity-90',
  };

  return map[variant];
});

const sizeClass = computed(() => {
  return {
    sm: 'h-7 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-sm',
    xl: 'h-14 px-6 text-base',
  }[size];
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tampa',
      variantClass,
      sizeClass,
      disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ]"
  >
    <IconSpinner v-if="loading" class="animate-spin size-4" />
    <slot />
  </button>
</template>
