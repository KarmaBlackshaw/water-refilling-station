<script setup lang="ts">
defineProps<{ size?: number }>();
</script>
<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z" />
    <line x1="16" y1="8" x2="8" y2="8" />
    <line x1="16" y1="12" x2="8" y2="12" />
    <line x1="10" y1="16" x2="8" y2="16" />
  </svg>
</template>
