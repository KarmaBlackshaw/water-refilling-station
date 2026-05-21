<script setup lang="ts">
const props = defineProps<{
  title: string;
  body: string;
  highlight?: string;
  to?: string;
}>();

const router = useRouter();

const bodyParts = computed(() => {
  if (!props.highlight) {
    return [{ text: props.body, highlight: false }];
  }

  const parts: { text: string; highlight: boolean }[] = [];
  const placeholder = `[${props.highlight}]`;
  const idx = props.body.indexOf(placeholder);

  if (idx === -1) {
    return [{ text: props.body, highlight: false }];
  }

  if (idx > 0) {
    parts.push({ text: props.body.slice(0, idx), highlight: false });
  }

  parts.push({ text: props.highlight, highlight: true });

  const rest = props.body.slice(idx + placeholder.length);

  if (rest) {
    parts.push({ text: rest, highlight: false });
  }

  return parts;
});

function go() {
  if (props.to) {
    router.push(props.to);
  }
}
</script>

<template>
  <div class="flex items-center gap-3 rounded-2xl border border-sparkling-silver bg-full-white p-4 shadow-card">
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-casual-navy text-white">
      <IconBell :size="18" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-casual-navy">{{ title }}</p>
      <p class="mt-0.5 text-xs text-oslo">
        <template v-for="(part, idx) in bodyParts" :key="idx">
          <span v-if="part.highlight" class="mx-0.5 rounded-md bg-turquoise-stone/10 px-1.5 py-0.5 font-medium text-turquoise-stone">{{ part.text }}</span>
          <span v-else>{{ part.text }}</span>
        </template>
      </p>
    </div>
    <BaseButton v-if="to" variant="turquoise-stone" size="sm" @click="go">View Detail</BaseButton>
  </div>
</template>
