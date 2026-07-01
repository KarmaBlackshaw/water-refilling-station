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

const selected = ref<Set<number>>(new Set());

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    selected.value = new Set(rider?.rest_days ?? []);
  },
  { immediate: true },
);

function submit() {
  emit(
    'submit',
    [...selected.value].sort((a, b) => a - b),
  );
}
</script>

<template>
  <BaseModal v-model:open="open" :title="`Rest days — ${rider?.full_name ?? ''}`">
    <form id="rest-days-form" @submit.prevent="submit">
      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-1 text-xs text-oslo">Select the days this rider does not deliver. Leave all unchecked if this rider works every day.</legend>
        <BaseWeekdayToggle v-model="selected" class="mt-2" />
      </fieldset>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="rest-days-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
