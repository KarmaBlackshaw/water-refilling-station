<script setup lang="ts">
const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
}>();

defineEmits<{
  'update:page': [page: number];
}>();

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));
const from = computed(() => Math.min((props.page - 1) * props.pageSize + 1, props.total));
const to = computed(() => Math.min(props.page * props.pageSize, props.total));
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm text-independence">
      Showing <span class="font-medium text-casual-navy">{{ from }}–{{ to }}</span> of
      <span class="font-medium text-casual-navy">{{ total }}</span>
    </p>

    <div class="flex items-center gap-2">
      <BaseButton variant="independence" :disabled="page <= 1" @click="$emit('update:page', page - 1)"> Previous </BaseButton>
      <BaseButton variant="independence" :disabled="page >= totalPages" @click="$emit('update:page', page + 1)"> Next </BaseButton>
    </div>
  </div>
</template>
