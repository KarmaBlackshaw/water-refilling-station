<script setup lang="ts">
import type { MaintenanceTask, MaintenanceScope, ScheduleKind } from '@/types/database';
import type { Option } from '@/types';

const open = defineModel<boolean>('open', { required: true });

const { task, scope, vehicleOptions, saving } = defineProps<{
  task?: MaintenanceTask;
  scope: MaintenanceScope;
  vehicleOptions: Option<string>[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      vehicle_id: string | null;
      task_type: string;
      schedule_kind: ScheduleKind;
      interval_days: number | null;
      interval_usage: number | null;
      last_done_at: string | null;
      next_due_at: string | null;
    },
  ];
}>();

const scheduleOptions = [
  { label: 'Time-based', value: 'time' },
  { label: 'Usage-based', value: 'usage' },
];

type FormState = {
  vehicle_id: string;
  task_type: string;
  schedule_kind: ScheduleKind;
  interval_days: string;
  interval_usage: string;
  last_done_at: string;
  next_due_at: string;
};

const form = reactive<FormState>({
  vehicle_id: '',
  task_type: '',
  schedule_kind: 'time',
  interval_days: '',
  interval_usage: '',
  last_done_at: '',
  next_due_at: '',
});

const title = computed(() => (task ? 'Edit Task' : 'Add Task'));

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (task) {
      form.vehicle_id = task.vehicle_id ?? '';
      form.task_type = task.task_type;
      form.schedule_kind = task.schedule_kind;
      form.interval_days = task.interval_days != null ? String(task.interval_days) : '';
      form.interval_usage = task.interval_usage != null ? String(task.interval_usage) : '';
      form.last_done_at = task.last_done_at ?? '';
      form.next_due_at = task.next_due_at ?? '';
    } else {
      form.vehicle_id = '';
      form.task_type = '';
      form.schedule_kind = 'time';
      form.interval_days = '';
      form.interval_usage = '';
      form.last_done_at = '';
      form.next_due_at = '';
    }
  },
  { immediate: true },
);

watch([() => form.last_done_at, () => form.interval_days, () => form.schedule_kind], () => {
  if (form.schedule_kind === 'time' && form.last_done_at && form.interval_days) {
    const days = parseInt(form.interval_days, 10);

    if (!isNaN(days) && days > 0) {
      form.next_due_at = addDays(form.last_done_at, days);
    }
  }
});

function submit() {
  emit('submit', {
    vehicle_id: scope === 'vehicle' && form.vehicle_id ? form.vehicle_id : null,
    task_type: form.task_type,
    schedule_kind: form.schedule_kind,
    interval_days: form.schedule_kind === 'time' && form.interval_days ? parseInt(form.interval_days, 10) : null,
    interval_usage: form.schedule_kind === 'usage' && form.interval_usage ? parseInt(form.interval_usage, 10) : null,
    last_done_at: form.last_done_at || null,
    next_due_at: form.next_due_at || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="title">
    <form id="task-form" class="space-y-4" @submit.prevent="submit">
      <BaseSelect v-if="scope === 'vehicle'" v-model="form.vehicle_id" label="Vehicle" :options="vehicleOptions" />

      <BaseInput v-model="form.task_type" label="Task type" placeholder="e.g. Filter Swap, Oil Change" required />

      <BaseSelect v-model="form.schedule_kind" label="Schedule" :options="scheduleOptions" />

      <BaseInput v-if="form.schedule_kind === 'time'" v-model="form.interval_days" label="Interval (days)" type="number" placeholder="e.g. 30" />

      <BaseInput v-if="form.schedule_kind === 'usage'" v-model="form.interval_usage" label="Interval (usage count)" type="number" placeholder="e.g. 500" />

      <BaseDatePicker v-model="form.last_done_at" label="Last done at" />

      <BaseDatePicker
        v-model="form.next_due_at"
        label="Next due at"
        :helper-text="form.schedule_kind === 'time' ? 'Auto-filled when last done + interval are set' : 'Set manually for usage-based tasks'"
      />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="task-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
