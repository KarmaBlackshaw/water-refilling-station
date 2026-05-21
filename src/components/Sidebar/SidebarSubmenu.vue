<script setup lang="ts">
import type { SidebarNavChild } from '@/constants/sidebarNav';
import { useNavActive } from '@/composables/useNavActive';

interface Props {
  items: SidebarNavChild[];
}

defineProps<Props>();

const { isChildExact } = useNavActive();
</script>

<template>
  <div class="ml-7 mt-1 border-l border-sparkling-silver pl-3 space-y-0.5">
    <RouterLink
      v-for="child in items"
      :key="child.to"
      :to="child.to"
      class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors"
      :class="isChildExact(child.to) ? 'text-casual-navy font-medium' : 'text-independence hover:bg-bright-chrome hover:text-casual-navy'"
    >
      <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="child.dotClass" />
      <span>{{ child.label }}</span>
    </RouterLink>
  </div>
</template>
