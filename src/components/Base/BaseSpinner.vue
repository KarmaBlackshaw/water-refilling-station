<script setup lang="ts">
import type { Size } from '@/types';
import IconSpinner from '@/components/Icon/IconSpinner.vue';

const { size = 'md' } = defineProps<{
  size?: Extract<Size, 'sm' | 'md' | 'lg'>;
}>();

const sizeClass = computed(() => {
  return {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6',
  }[size];
});
</script>

<template>
  <IconSpinner :class="['animate-spin text-independence', sizeClass]" />
</template>
