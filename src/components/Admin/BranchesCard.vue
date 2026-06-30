<script setup lang="ts">
import type { Branch } from '@/types/database';

defineOptions({ name: 'AdminBranchesCard' });

defineProps<{ branches: Branch[]; loading?: boolean }>();

defineEmits<{ add: [] }>();
</script>

<template>
  <BaseCard padding="none">
    <div class="flex items-center justify-between border-b border-sparkling-silver px-5 py-4">
      <h3 class="text-sm font-semibold text-casual-navy">Branches</h3>
      <BaseButton size="sm" @click="$emit('add')">Add branch</BaseButton>
    </div>

    <div v-if="loading" class="space-y-2 p-5">
      <BaseSkeleton class="h-6 w-full" />
      <BaseSkeleton class="h-6 w-2/3" />
    </div>

    <ul v-else-if="branches.length" class="divide-y divide-sparkling-silver">
      <li v-for="branch in branches" :key="branch.id" class="flex items-center justify-between px-5 py-3">
        <span class="text-sm font-medium text-casual-navy">{{ branch.name }}</span>
        <span class="text-xs text-oslo">{{ formatDateDisplay(branch.created_at) }}</span>
      </li>
    </ul>

    <BaseEmptyState v-else title="No branches yet" />
  </BaseCard>
</template>
