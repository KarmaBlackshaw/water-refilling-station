<script setup lang="ts">
import type { User, UserRole } from '@/types/database';

defineOptions({ name: 'AdminUsersCard' });

defineProps<{ users: User[]; loading?: boolean }>();

defineEmits<{ add: [] }>();

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  cashier: 'Cashier',
  rider: 'Rider',
};
</script>

<template>
  <BaseCard padding="none">
    <div class="flex items-center justify-between border-b border-sparkling-silver px-5 py-4">
      <h3 class="text-sm font-semibold text-casual-navy">Users</h3>
      <BaseButton size="sm" @click="$emit('add')">Add user</BaseButton>
    </div>

    <div v-if="loading" class="space-y-2 p-5">
      <BaseSkeleton class="h-6 w-full" />
      <BaseSkeleton class="h-6 w-2/3" />
    </div>

    <ul v-else-if="users.length" class="divide-y divide-sparkling-silver">
      <li v-for="user in users" :key="user.id" class="flex items-center justify-between gap-3 px-5 py-3">
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-casual-navy">{{ user.full_name }}</p>
          <p class="text-xs text-oslo">{{ ROLE_LABEL[user.role] }}</p>
        </div>
        <BaseBadge :variant="user.active ? 'success' : 'default'" size="sm">
          {{ user.active ? 'Active' : 'Inactive' }}
        </BaseBadge>
      </li>
    </ul>

    <BaseEmptyState v-else title="No users yet" />
  </BaseCard>
</template>
