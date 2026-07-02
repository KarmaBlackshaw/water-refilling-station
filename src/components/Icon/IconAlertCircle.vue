<script setup lang="ts">
defineProps<{ size?: number }>();
</script>

<template>
  <svg :width="size || 20" :height="size || 20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke-width="2" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.5v5" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16.25h.01" />
  </svg>
</template>
