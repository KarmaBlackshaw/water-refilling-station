<script setup lang="ts">
import SidebarBrand from '@/components/Sidebar/Brand.vue';
import SidebarNavItem from '@/components/Sidebar/NavItem.vue';
import SidebarSection from '@/components/Sidebar/Section.vue';
import { ADMIN_NAV } from '@/constants/adminNav';
import { useNavActive } from '@/composables/useNavActive';

defineOptions({ name: 'AdminSidebar' });

const { isActive } = useNavActive();
</script>

<template>
  <div class="flex h-full flex-col border-r border-sparkling-silver bg-full-white">
    <SidebarBrand title="Platform Admin" initials="SA" />

    <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <SidebarSection title="Platform">
        <SidebarNavItem v-for="item in ADMIN_NAV" :key="item.to" :item="item" :active="isActive(item.to)" />
      </SidebarSection>
    </nav>
  </div>
</template>
