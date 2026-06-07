<script setup lang="ts">
defineProps<{
  title: string;
  subtitle?: string;
  count?: number;
}>();

const search = defineModel<string>('search', { required: true });
</script>

<template>
  <div class="flex items-center justify-between gap-4 px-5 py-4">
    <div>
      <div class="flex items-center gap-2">
        <h1 class="text-lg font-bold text-casual-navy">{{ title }}</h1>

        <span
          v-if="count !== undefined"
          class="rounded-full border border-sparkling-silver bg-bright-chrome px-2 py-0.5 text-xs font-medium text-independence"
          >{{ count }}</span
        >
      </div>
      <p v-if="subtitle" class="text-xs text-oslo">{{ subtitle }}</p>
    </div>
    <div class="flex items-center gap-2">
      <BaseSearch v-model="search" />
      <slot name="actions" />
    </div>
  </div>
</template>
