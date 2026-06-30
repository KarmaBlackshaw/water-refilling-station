<script setup lang="ts">
defineOptions({ name: 'AdminClientStats' });

defineProps<{
  total: number;
  active: number;
  suspended: number;
  expiringSoon: number;
  loading?: boolean;
}>();
</script>

<template>
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <BaseKpiCard label="Total clients" :value="total" :loading="loading">
      <template #icon><IconBuilding :size="18" /></template>
    </BaseKpiCard>

    <BaseKpiCard label="Active" :value="active" :loading="loading">
      <template #icon><IconCheck :size="18" /></template>
    </BaseKpiCard>

    <BaseKpiCard label="Suspended" icon-tone="gray" :value="suspended" :loading="loading">
      <template #icon><IconClose :size="18" /></template>
    </BaseKpiCard>

    <BaseKpiCard label="Expiring ≤30 days" icon-tone="gray" :value="expiringSoon" :loading="loading">
      <template #icon><IconBell :size="18" /></template>
    </BaseKpiCard>
  </div>
</template>
