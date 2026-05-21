<script setup lang="ts">
const props = defineProps<{
  variant?: 'hero' | 'default' | 'warning' | 'danger';
  iconTone?: 'gray' | 'turquoise';
  label: string;
  value: string | number;
  sub?: string;
  to?: string;
  expandable?: boolean;
}>();

const router = useRouter();

const cardClass = computed(() => {
  const v = props.variant ?? 'default';

  return {
    hero: 'rounded-2xl bg-linear-to-br from-turquoise-stone to-cerulean border-0 shadow-md cursor-default',
    default: 'rounded-2xl border border-sparkling-silver bg-full-white shadow-sm',
    warning: 'rounded-2xl border border-sparkling-silver bg-full-white shadow-sm',
    danger: 'rounded-2xl border border-sparkling-silver bg-full-white shadow-sm',
  }[v];
});

const valueClass = computed(() => {
  const v = props.variant ?? 'default';

  return {
    hero: 'text-white',
    default: 'text-casual-navy',
    warning: 'text-strong-amber',
    danger: 'text-blaze-red',
  }[v];
});

const iconBgClass = computed(() => {
  if (props.variant === 'hero') {
    return 'bg-white/20 text-white';
  }

  const tone = props.iconTone ?? 'turquoise';

  return tone === 'gray' ? 'bg-american-diamond text-independence' : 'bg-turquoise-stone/10 text-turquoise-stone';
});

const labelClass = computed(() => (props.variant === 'hero' ? 'text-white/70' : 'text-oslo'));

const subClass = computed(() => (props.variant === 'hero' ? 'text-white/60' : 'text-oslo'));

const cornerIconClass = computed(() => (props.variant === 'hero' ? 'text-white/60' : 'text-oslo'));

function handleClick() {
  if (props.to) {
    router.push(props.to);
  }
}
</script>

<template>
  <div :class="[cardClass, props.to ? 'cursor-pointer transition-opacity hover:opacity-80' : '']" class="p-4" @click="handleClick">
    <div class="mb-3 flex items-center justify-between">
      <div :class="iconBgClass" class="flex h-9 w-9 items-center justify-center rounded-lg">
        <slot name="icon" />
      </div>
      <IconMaximize v-if="expandable" :size="14" :class="cornerIconClass" class="opacity-60" />
      <IconArrowUpRight v-else-if="props.to" :size="14" class="opacity-40" />
    </div>
    <p :class="labelClass" class="text-xs font-medium">{{ label }}</p>
    <p :class="valueClass" class="num mt-1 text-3xl font-bold">{{ value }}</p>
    <p v-if="sub" :class="subClass" class="mt-1 text-xs">{{ sub }}</p>
  </div>
</template>
