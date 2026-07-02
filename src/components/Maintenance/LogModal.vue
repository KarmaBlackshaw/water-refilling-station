<script setup lang="ts">
import type { MaintenanceTask } from '@/types/database';
import { parseMoney } from '@/helpers/money';

defineOptions({ name: 'MaintenanceLogModal' });

const open = defineModel<boolean>('open', { required: true });

const { task, saving } = defineProps<{
  task?: MaintenanceTask;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: { performed_at: string; cost_centavos: number | null; notes: string | null }];
}>();

const form = reactive({
  performed_at: today(),
  cost: '',
  notes: '',
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.performed_at = today();
    form.cost = '';
    form.notes = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    performed_at: form.performed_at,
    cost_centavos: form.cost ? parseMoney(form.cost) : null,
    notes: form.notes || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="Log Maintenance">
    <form id="log-form" class="space-y-4" @submit.prevent="submit">
      <p class="text-sm text-independence">
        Task: <span class="font-medium text-casual-navy">{{ task?.task_type }}</span>
      </p>

      <BaseDatePicker v-model="form.performed_at" label="Performed at" required />

      <BaseInput v-model="form.cost" label="Cost" type="currency" placeholder="0.00" />

      <BaseTextarea v-model="form.notes" label="Notes" placeholder="Optional notes…" :rows="3" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="log-form" :loading="saving">Save log</BaseButton>
    </template>
  </BaseModal>
</template>
