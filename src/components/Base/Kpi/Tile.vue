<script setup lang="ts">
const { tone = 'default' } = defineProps<{
  label: string;
  value: string | number;
  tone?: 'default' | 'warning' | 'danger';
}>();

const valueClass = computed(
  () =>
    ({
      default: 'text-casual-navy',
      warning: 'text-strong-amber',
      danger: 'text-blaze-red',
    })[tone],
);
</script>

<template>
  <div class="rounded-lg border border-american-diamond bg-bright-chrome px-3 py-2.5">
    <p class="text-xs text-independence">{{ label }}</p>
    <p class="num mt-0.5 text-2xl font-semibold" :class="valueClass">{{ value }}</p>
    <slot />
  </div>
</template>
