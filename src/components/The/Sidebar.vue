<script setup lang="ts">
import { computed } from 'vue';
import SidebarBrand from '@/components/Sidebar/SidebarBrand.vue';
import SidebarFooter from '@/components/Sidebar/SidebarFooter.vue';
import SidebarNavItem from '@/components/Sidebar/SidebarNavItem.vue';
import SidebarSection from '@/components/Sidebar/SidebarSection.vue';
import { SIDEBAR_GENERAL_NAV, SIDEBAR_MAIN_NAV } from '@/constants/sidebarNav';
import { useNavActive } from '@/composables/useNavActive';

const APP_VERSION = 'v0.1.0';

const { isActive } = useNavActive();

const authStore = useAuthStore();
const fullName = computed(() => authStore.profile?.full_name ?? authStore.authUser?.email?.split('@')[0] ?? 'Admin');

const { maintenanceAlertCount } = useDashboardCounters();

const badgeCounts = computed<Record<string, number>>(() => ({
  maintenanceAlertCount: maintenanceAlertCount.value,
}));
</script>

<template>
  <div class="flex h-full flex-col border-r border-sparkling-silver bg-full-white">
    <SidebarBrand />

    <nav class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      <SidebarSection title="Menu">
        <SidebarNavItem
          v-for="item in SIDEBAR_MAIN_NAV"
          :key="item.to"
          :item="item"
          :active="isActive(item.to)"
          :badge-count="item.badgeKey ? badgeCounts[item.badgeKey] : 0"
        />
      </SidebarSection>

      <SidebarSection title="General">
        <SidebarNavItem v-for="item in SIDEBAR_GENERAL_NAV" :key="item.to" :item="item" :active="isActive(item.to)" />
      </SidebarSection>
    </nav>

    <SidebarFooter :user="fullName" :version="APP_VERSION" />
  </div>
</template>
