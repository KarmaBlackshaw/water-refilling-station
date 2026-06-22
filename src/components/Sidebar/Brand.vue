<script setup lang="ts">
interface Props {
  initials?: string;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  initials: 'WRS',
  title: 'WRS Admin',
});

defineOptions({ name: 'SidebarBrand' });
</script>

<template>
  <div class="border-b border-sparkling-silver px-4 py-4">
    <div class="flex items-center gap-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-tampa to-cerulean">
        <span class="text-[10px] font-black text-white tracking-tight">{{ initials }}</span>
      </div>
      <div class="flex flex-col leading-none">
        <span class="text-sm font-bold text-casual-navy tracking-tight">{{ title }}</span>
      </div>
    </div>
  </div>
</template>
