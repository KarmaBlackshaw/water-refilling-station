<script setup lang="ts">
defineOptions({ name: 'BaseSkeleton' });

const { rounded = 'md' } = defineProps<{
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}>();

const roundedClass: Record<NonNullable<typeof rounded>, string> = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};
</script>

<template>
  <div class="skeleton" :class="roundedClass[rounded]" aria-hidden="true" />
</template>
