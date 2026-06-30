<script setup lang="ts">
import { WEEKDAYS } from '@/constants/rider';

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

function toggle(weekday: number, checked: boolean) {
  const next = new Set(selected.value);

  if (checked) {
    next.add(weekday);
  } else {
    next.delete(weekday);
  }

  selected.value = next;
}

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
        <div class="mt-2 grid grid-cols-2 gap-2">
          <BaseCheckbox
            v-for="day in WEEKDAYS"
            :key="day.value"
            :model-value="selected.has(day.value)"
            :label="day.label"
            @update:model-value="toggle(day.value, $event)"
          />
        </div>
      </fieldset>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="rest-days-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
