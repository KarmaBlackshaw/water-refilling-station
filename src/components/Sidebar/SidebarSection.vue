<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<template>
  <div>
    <p class="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-oslo">{{ title }}</p>
    <div class="space-y-0.5">
      <slot />
    </div>
  </div>
</template>
