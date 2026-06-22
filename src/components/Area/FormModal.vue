<script setup lang="ts">
import type { Area } from '@/types/database';
import type { Option } from '@/types';

defineOptions({ name: 'AreaFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { area, riderOptions, saving } = defineProps<{
  area?: Area;
  riderOptions: Option<string>[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { name: string; notes: string | null; primary_rider_id: string | null }];
}>();

const form = reactive({ name: '', notes: '', primary_rider_id: '' });

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.name = area?.name ?? '';
    form.notes = area?.notes ?? '';
    form.primary_rider_id = area?.primary_rider_id ?? '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    name: form.name,
    notes: form.notes || null,
    primary_rider_id: form.primary_rider_id || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="area ? 'Edit area' : 'Add area'">
    <form id="area-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Area name" required />
      <BaseSelect v-model="form.primary_rider_id" label="Primary rider" :options="riderOptions" placeholder="Select rider..." />
      <BaseTextarea v-model="form.notes" label="Notes" :rows="2" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="area-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
