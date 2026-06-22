<script setup lang="ts">
interface Props {
  user: string;
  version: string;
}

defineProps<Props>();

defineOptions({ name: 'SidebarFooter' });
</script>

<template>
  <div class="border-t border-sparkling-silver px-3 py-3 flex items-center justify-between">
    <span class="text-oslo text-xs">{{ user }}</span>
    <span class="text-oslo text-[10px]">{{ version }}</span>
  </div>
</template>
