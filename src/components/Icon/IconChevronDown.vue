<script setup lang="ts">
defineProps<{ size?: number }>();
</script>
<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
</template>
