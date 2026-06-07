<script setup lang="ts">
import type { Area } from '@/types/database';
import type { Option } from '@/types';

const open = defineModel<boolean>('open', { required: true });

const { area, riderOptions, saving } = defineProps<{
  area?: Area;
  riderOptions: Option<string>[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { covering_rider_id: string; starts_on: string; ends_on: string | null }];
}>();

const form = reactive({ covering_rider_id: '', starts_on: '', ends_on: '' });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.covering_rider_id = '';
    form.starts_on = today();
    form.ends_on = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    covering_rider_id: form.covering_rider_id,
    starts_on: form.starts_on,
    ends_on: form.ends_on || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="`Add coverage — ${area?.name ?? ''}`">
    <form id="coverage-form" class="space-y-4" @submit.prevent="submit">
      <BaseSelect v-model="form.covering_rider_id" label="Covering rider" :options="riderOptions" required />
      <BaseDatePicker v-model="form.starts_on" label="Starts on" required />
      <BaseDatePicker v-model="form.ends_on" label="Ends on (leave blank for open-ended)" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="coverage-form" :loading="saving">Add coverage</BaseButton>
    </template>
  </BaseModal>
</template>
