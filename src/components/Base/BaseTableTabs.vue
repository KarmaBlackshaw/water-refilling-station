<script setup lang="ts">
const model = defineModel<string>({ required: true });

type Tab = {
  key: string;
  label: string;
};

defineProps<{
  tabs: ReadonlyArray<Tab>;
}>();
</script>

<template>
  <div class="px-5">
    <BaseTabs v-model="model" :tabs="tabs" />
  </div>
</template>
