<script setup lang="ts">
import type { Placement } from '@floating-ui/dom';

defineOptions({ name: 'AppTopbar' });

const {
  name,
  email,
  menuPlacement = 'bottom-end',
} = defineProps<{
  name: string;
  email: string;
  menuPlacement?: Placement;
}>();
</script>

<template>
  <header class="flex h-[69px] shrink-0 items-center gap-3 border-b border-sparkling-silver bg-full-white px-4">
    <!-- Search bar -->
    <div class="flex h-8 max-w-[260px] flex-1 items-center gap-2 rounded-lg border border-sparkling-silver bg-bright-chrome px-3">
      <IconSearch :size="14" class="shrink-0 text-oslo" />
      <span class="flex-1 text-xs text-oslo">Search...</span>
      <kbd class="rounded bg-sparkling-silver px-1 py-0.5 text-[9px] text-oslo">⌘F</kbd>
    </div>

    <div class="flex-1" />

    <!-- Icon buttons -->
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-sparkling-silver bg-bright-chrome text-independence hover:bg-hover transition-colors"
    >
      <IconMail :size="14" />
    </button>
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-lg border border-sparkling-silver bg-bright-chrome text-independence hover:bg-hover transition-colors"
    >
      <IconBell :size="14" />
    </button>

    <!-- Divider -->
    <div class="h-5 w-px bg-sparkling-silver" />

    <!-- Avatar + user menu -->
    <UserMenu :name="name" :email="email" :placement="menuPlacement" />
  </header>
</template>
