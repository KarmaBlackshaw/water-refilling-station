<script setup lang="ts">
import IconInbox from '@/components/Icon/IconInbox.vue';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-12 text-center">
    <IconInbox class="size-12 text-oslo" />

    <div class="flex flex-col gap-1">
      <h3 class="text-sm font-semibold text-casual-navy">{{ title }}</h3>
      <p v-if="description" class="text-sm text-independence">{{ description }}</p>
    </div>

    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>
