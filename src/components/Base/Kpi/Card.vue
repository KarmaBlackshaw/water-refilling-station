<script setup lang="ts">
const props = defineProps<{
  iconTone?: 'gray' | 'turquoise';
  label: string;
  value: string | number;
  sub?: string;
  to?: string;
  expandable?: boolean;
  loading?: boolean;
}>();

const router = useRouter();

const iconBgClass = computed(() => {
  const tone = props.iconTone ?? 'turquoise';

  return tone === 'gray' ? 'bg-american-diamond text-independence' : 'bg-tampa/10 text-tampa';
});

function handleClick() {
  if (props.to) {
    router.push(props.to);
  }
}
</script>

<template>
  <BaseCard padding="md" :class="props.to ? 'cursor-pointer transition-opacity hover:opacity-80' : ''" @click="handleClick">
    <div class="mb-3 flex items-center justify-between">
      <div :class="iconBgClass" class="flex h-9 w-9 items-center justify-center rounded-lg">
        <slot name="icon" />
      </div>
      <IconMaximize v-if="expandable" :size="14" class="text-oslo opacity-60" />
      <IconArrowUpRight v-else-if="props.to" :size="14" class="opacity-40" />
    </div>
    <p class="text-xs font-medium text-oslo">{{ label }}</p>
    <BaseSkeleton v-if="loading" class="mt-1 h-9 w-20" />
    <p v-else class="num mt-1 text-3xl font-bold text-casual-navy">{{ value }}</p>
    <p v-if="sub" class="mt-1 text-xs text-oslo">{{ sub }}</p>
  </BaseCard>
</template>
