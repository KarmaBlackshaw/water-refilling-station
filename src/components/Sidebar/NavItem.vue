<script setup lang="ts">
import { computed } from 'vue';
import type { SidebarNavItem } from '@/constants/sidebarNav';

interface Props {
  item: SidebarNavItem;
  active: boolean;
  badgeCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  badgeCount: 0,
});

const stateClasses = computed(() =>
  props.active ? 'bg-tampa text-white font-medium shadow-sm' : 'text-independence hover:bg-bright-chrome hover:text-casual-navy',
);

defineOptions({ name: 'SidebarNavItem' });
</script>

<template>
  <RouterLink :to="item.to" class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors" :class="[stateClasses]">
    <component :is="item.icon" :size="16" class="shrink-0" />
    <span class="flex-1 text-left">{{ item.label }}</span>
    <span v-if="badgeCount > 0" class="flex h-4 min-w-4 items-center justify-center rounded-full bg-blaze-red px-1 text-[9px] font-bold text-white">
      {{ badgeCount }}
    </span>
  </RouterLink>
</template>
