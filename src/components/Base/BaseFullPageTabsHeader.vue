<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
}>();
</script>

<template>
  <div v-if="title || subtitle">
    <h1 v-if="title" class="text-2xl font-bold text-casual-navy">{{ title }}</h1>
    <p v-if="subtitle" class="text-sm text-oslo">{{ subtitle }}</p>
  </div>
</template>
