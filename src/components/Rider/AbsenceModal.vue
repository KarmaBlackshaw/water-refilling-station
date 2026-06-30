<script setup lang="ts">
import { today } from '@/helpers/date';

defineOptions({ name: 'RiderAbsenceModal' });

/** Rider-employee fields this modal needs. */
type RiderEmployee = {
  id: string;
  full_name: string;
};

const open = defineModel<boolean>('open', { required: true });

const { rider, saving } = defineProps<{
  rider?: RiderEmployee;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { starts_on: string; ends_on: string | null }];
}>();

const form = reactive({
  starts_on: '',
  ends_on: '',
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.starts_on = today();
    form.ends_on = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    starts_on: form.starts_on,
    ends_on: form.ends_on || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="`Mark absent — ${rider?.full_name ?? ''}`">
    <form id="absence-form" class="space-y-4" @submit.prevent="submit">
      <p class="text-xs text-oslo">Mark this rider absent for these days (counts against attendance).</p>
      <BaseDatePicker v-model="form.starts_on" label="Starts on" required />
      <BaseDatePicker v-model="form.ends_on" label="Ends on" helper-text="Leave blank to mark absent for a single day." clearable />
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="absence-form" :loading="saving">Mark absent</BaseButton>
    </template>
  </BaseModal>
</template>
