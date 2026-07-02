<script setup lang="ts">
defineOptions({ name: 'RiderRestDaysModal' });

/** Rider-employee fields this modal needs. */
type RiderEmployee = {
  id: string;
  full_name: string;
  rest_days: number[];
};

const open = defineModel<boolean>('open', { required: true });

const { rider, saving } = defineProps<{
  rider?: RiderEmployee;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [restDays: number[]];
}>();

const selected = ref<number[]>([]);

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    selected.value = rider?.rest_days ?? [];
  },
  { immediate: true },
);

function submit() {
  emit('submit', selected.value);
}
</script>

<template>
  <BaseModal v-model:open="open" :title="`Rest days — ${rider?.full_name ?? ''}`">
    <form id="rest-days-form" @submit.prevent="submit">
      <BaseWeekdayToggle v-model="selected" description="Select the days this rider does not deliver. Leave all unchecked if this rider works every day." />
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="rest-days-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
