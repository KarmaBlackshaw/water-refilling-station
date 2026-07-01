<script setup lang="ts">
import type { BadgeVariant, Size } from '@/types';

const { variant = 'default', size = 'md' } = defineProps<{
  variant?: BadgeVariant;
  size?: Extract<Size, 'sm' | 'md'>;
}>();

const variantClass = computed(() => {
  return {
    default: 'bg-bright-chrome text-independence',
    success: 'bg-emerald-subtle text-dark-green-turquoise',
    warning: 'bg-amber-subtle text-strong-amber',
    danger: 'bg-red-subtle text-blaze-red',
    info: 'bg-tampa/10 text-bondi-blue',
  }[variant];
});

const sizeClass = computed(() => {
  return {
    sm: 'px-2 py-0.5 text-xs rounded-sm',
    md: 'px-2.5 py-0.5 text-xs rounded',
  }[size];
});
</script>

<template>
  <span :class="['inline-flex items-center font-medium', variantClass, sizeClass]">
    <slot />
  </span>
</template>
