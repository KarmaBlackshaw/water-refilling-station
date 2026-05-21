<script setup lang="ts">
import { computed } from 'vue';
import IconChevronRight from '@/components/Icon/IconChevronRight.vue';
import SidebarSubmenu from '@/components/Sidebar/SidebarSubmenu.vue';
import type { SidebarNavItem } from '@/constants/sidebarNav';

interface Props {
  item: SidebarNavItem;
  active: boolean;
  expanded?: boolean;
  badgeCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  expanded: false,
  badgeCount: 0,
});

const emit = defineEmits<{
  toggle: [];
}>();

const hasChildren = computed(() => Boolean(props.item.children?.length));
const baseClasses = 'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors';
const stateClasses = computed(() =>
  props.active ? 'bg-turquoise-stone text-white font-medium shadow-sm' : 'text-independence hover:bg-bright-chrome hover:text-casual-navy',
);
</script>

<template>
  <div>
    <button v-if="hasChildren" type="button" :class="[baseClasses, stateClasses]" @click="emit('toggle')">
      <component :is="item.icon" :size="16" class="shrink-0" />
      <span class="flex-1 text-left">{{ item.label }}</span>
      <IconChevronRight :size="12" class="shrink-0 transition-transform" :class="expanded ? 'rotate-90' : ''" />
    </button>

    <RouterLink v-else :to="item.to" :class="[baseClasses, stateClasses]">
      <component :is="item.icon" :size="16" class="shrink-0" />
      <span class="flex-1 text-left">{{ item.label }}</span>
      <span v-if="badgeCount > 0" class="flex h-4 min-w-4 items-center justify-center rounded-full bg-blaze-red px-1 text-[9px] font-bold text-white">
        {{ badgeCount }}
      </span>
    </RouterLink>

    <SidebarSubmenu v-if="hasChildren && expanded" :items="item.children!" />
  </div>
</template>
