<script setup lang="ts">
const { padding } = defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
}>();

const paddingClasses = computed(() => {
  return {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding ?? 'md'];
});
</script>

<template>
  <div :class="[paddingClasses]" class="rounded-md bg-full-white shadow overflow-hidden">
    <div v-if="title || $slots.action" class="mb-3 flex items-center justify-between">
      <p v-if="title" class="text-sm font-semibold text-casual-navy">{{ title }}</p>

      <slot name="action" />
    </div>
    <slot />
  </div>
</template>
