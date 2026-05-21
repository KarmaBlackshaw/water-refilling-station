<script setup lang="ts">
import type { MaintenanceTask, MaintenanceScope, ScheduleKind, Vehicle } from '@/types/database';

const tabs = [
  { key: 'water_plant', label: 'Water Plant' },
  { key: 'vehicle', label: 'Vehicles' },
];
const activeTab = ref<'water_plant' | 'vehicle'>('water_plant');

const {
  data: tasks,
  loading,
  run: load,
} = useAsync<(MaintenanceTask & { vehicles?: { brand_model: string | null; plate_number: string | null } | null })[]>(() => listTasks(activeTab.value), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
  watch: activeTab,
});

const todayIso = today();
const weekEnd = addDays(todayIso, 7);

const overdueCount = computed(() => (tasks.value ?? []).filter((t) => t.next_due_at && t.next_due_at < todayIso).length);
const dueThisWeekCount = computed(() => (tasks.value ?? []).filter((t) => t.next_due_at && t.next_due_at >= todayIso && t.next_due_at <= weekEnd).length);

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

function taskStatus(task: MaintenanceTask): { label: string; variant: BadgeVariant } {
  if (!task.next_due_at) {
    return { label: 'N/A', variant: 'default' };
  }

  if (task.next_due_at < todayIso) {
    return { label: 'Overdue', variant: 'danger' };
  }

  if (task.next_due_at <= weekEnd) {
    return { label: 'Due soon', variant: 'warning' };
  }

  return { label: 'OK', variant: 'success' };
}

const taskColumns = computed(() => [
  { key: 'task_type', label: 'Task', class: 'font-medium text-casual-navy' },
  ...(activeTab.value === 'vehicle' ? [{ key: 'vehicle', label: 'Vehicle', class: 'text-sm text-independence' }] : []),
  { key: 'schedule', label: 'Schedule', class: 'text-sm text-independence' },
  { key: 'last_done_at', label: 'Last done', class: 'num text-sm' },
  { key: 'next_due_at', label: 'Next due', class: 'num text-sm' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' as const },
]);

function scheduleLabel(task: MaintenanceTask): string {
  if (task.schedule_kind === 'time' && task.interval_days) {
    return `Every ${task.interval_days}d`;
  }

  if (task.schedule_kind === 'usage' && task.interval_usage) {
    return `Every ${task.interval_usage} uses`;
  }

  return task.schedule_kind === 'time' ? 'Time-based' : 'Usage-based';
}

const vehicles = ref<Vehicle[]>([]);
const vehicleOptions = computed(() => [
  { label: '— None —', value: '' },
  ...vehicles.value.map((v) => ({
    label: `${v.brand_model ?? ''} (${v.plate_number ?? ''})`,
    value: v.id,
  })),
]);

async function ensureVehicles() {
  if (vehicles.value.length === 0) {
    vehicles.value = await listVehicles();
  }
}

const taskModalOpen = ref(false);
const editingTask = ref<MaintenanceTask | null>(null);
const saving = ref(false);

const scheduleOptions = [
  { label: 'Time-based', value: 'time' },
  { label: 'Usage-based', value: 'usage' },
];

const taskForm = reactive({
  vehicle_id: '',
  task_type: '',
  schedule_kind: 'time' as ScheduleKind,
  interval_days: '',
  interval_usage: '',
  last_done_at: '',
  next_due_at: '',
});

const taskModalTitle = computed(() => (editingTask.value ? 'Edit Task' : 'Add Task'));

function resetTaskForm() {
  taskForm.vehicle_id = '';
  taskForm.task_type = '';
  taskForm.schedule_kind = 'time';
  taskForm.interval_days = '';
  taskForm.interval_usage = '';
  taskForm.last_done_at = '';
  taskForm.next_due_at = '';
}

async function openAddTask() {
  editingTask.value = null;
  resetTaskForm();
  if (activeTab.value === 'vehicle') {
    await ensureVehicles();
  }

  taskModalOpen.value = true;
}

async function openEditTask(task: MaintenanceTask) {
  editingTask.value = task;
  taskForm.vehicle_id = task.vehicle_id ?? '';
  taskForm.task_type = task.task_type;
  taskForm.schedule_kind = task.schedule_kind;
  taskForm.interval_days = task.interval_days != null ? String(task.interval_days) : '';
  taskForm.interval_usage = task.interval_usage != null ? String(task.interval_usage) : '';
  taskForm.last_done_at = task.last_done_at ?? '';
  taskForm.next_due_at = task.next_due_at ?? '';
  if (activeTab.value === 'vehicle') {
    await ensureVehicles();
  }

  taskModalOpen.value = true;
}

// Auto-compute next_due_at when last_done_at or interval_days change
watch([() => taskForm.last_done_at, () => taskForm.interval_days, () => taskForm.schedule_kind], () => {
  if (taskForm.schedule_kind === 'time' && taskForm.last_done_at && taskForm.interval_days) {
    const days = parseInt(taskForm.interval_days, 10);

    if (!isNaN(days) && days > 0) {
      taskForm.next_due_at = addDays(taskForm.last_done_at, days);
    }
  }
});

async function saveTask() {
  saving.value = true;
  const payload = {
    scope: activeTab.value as MaintenanceScope,
    vehicle_id: activeTab.value === 'vehicle' && taskForm.vehicle_id ? taskForm.vehicle_id : null,
    task_type: taskForm.task_type,
    schedule_kind: taskForm.schedule_kind,
    interval_days: taskForm.schedule_kind === 'time' && taskForm.interval_days ? parseInt(taskForm.interval_days, 10) : null,
    interval_usage: taskForm.schedule_kind === 'usage' && taskForm.interval_usage ? parseInt(taskForm.interval_usage, 10) : null,
    last_done_at: taskForm.last_done_at || null,
    next_due_at: taskForm.next_due_at || null,
  };

  if (editingTask.value) {
    await updateTask(editingTask.value.id, payload);
  } else {
    await createTask({ ...payload, scope: activeTab.value });
  }

  taskModalOpen.value = false;
  await load();
  saving.value = false;
}

const deactivateConfirm = ref<MaintenanceTask | null>(null);

async function confirmDeactivate() {
  if (!deactivateConfirm.value) {
    return;
  }

  await updateTask(deactivateConfirm.value.id, { active: false });
  deactivateConfirm.value = null;
  await load();
}

const logModalOpen = ref(false);
const loggingTask = ref<MaintenanceTask | null>(null);
const loggingSaving = ref(false);

const logForm = reactive({
  performed_at: todayIso,
  cost_display: '',
  notes: '',
});

function openLogModal(task: MaintenanceTask) {
  loggingTask.value = task;
  logForm.performed_at = todayIso;
  logForm.cost_display = '';
  logForm.notes = '';
  logModalOpen.value = true;
}

async function saveLog() {
  if (!loggingTask.value) {
    return;
  }

  loggingSaving.value = true;
  const cost = logForm.cost_display ? Math.round(parseFloat(logForm.cost_display.replace(/[₱,\s]/g, '')) * 100) : null;

  await createLog({
    task_id: loggingTask.value.id,
    performed_at: logForm.performed_at,
    cost_centavos: isNaN(cost as number) ? null : cost,
    notes: logForm.notes || null,
  });
  logModalOpen.value = false;
  await load();
  loggingSaving.value = false;
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Maintenance</h1>
          <p class="text-sm text-oslo">Track maintenance schedules for plant and vehicles</p>
        </div>
        <BaseButton size="sm" @click="openAddTask">Add Task</BaseButton>
      </div>

      <!-- Tabs -->
      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <!-- Due stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-sparkling-silver bg-red-subtle px-4 py-3">
          <p class="text-xs text-independence">Overdue</p>
          <p class="num text-2xl font-semibold text-blaze-red">{{ overdueCount }}</p>
        </div>
        <div class="rounded-lg border border-sparkling-silver bg-amber-subtle px-4 py-3">
          <p class="text-xs text-independence">Due this week</p>
          <p class="num text-2xl font-semibold text-strong-amber">{{ dueThisWeekCount }}</p>
        </div>
      </div>

      <BaseCard padding="none">
        <BaseTable :columns="taskColumns" :data="tasks" :loading="loading">
          <template #cell-vehicle="{ row }">
            <span v-if="row.vehicles">
              {{ row.vehicles.brand_model }}
              <span v-if="row.vehicles.plate_number" class="text-oslo">({{ row.vehicles.plate_number }})</span>
            </span>
            <span v-else class="text-oslo">—</span>
          </template>
          <template #cell-schedule="{ row }">{{ scheduleLabel(row) }}</template>
          <template #cell-last_done_at="{ row }">{{ row.last_done_at ?? '—' }}</template>
          <template #cell-next_due_at="{ row }">{{ row.next_due_at ?? '—' }}</template>
          <template #cell-status="{ row }">
            <BaseBadge :variant="taskStatus(row).variant">{{ taskStatus(row).label }}</BaseBadge>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex justify-end gap-1">
              <BaseButton variant="independence" size="sm" @click="openLogModal(row)">Log</BaseButton>
              <BaseButton variant="independence" size="sm" @click="openEditTask(row)">Edit</BaseButton>
              <BaseButton variant="independence" size="sm" class="text-independence" @click="deactivateConfirm = row">Deactivate</BaseButton>
            </div>
          </template>
          <template #empty>
            <BaseEmptyState title="No maintenance tasks">
              <template #actions>
                <BaseButton size="sm" @click="openAddTask">Add first task</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <!-- Add/Edit Task modal -->
    <BaseModal :open="taskModalOpen" :title="taskModalTitle" @close="taskModalOpen = false">
      <form id="task-form" class="space-y-4" @submit.prevent="saveTask">
        <!-- Vehicle select (vehicles tab only) -->
        <BaseSelect v-if="activeTab === 'vehicle'" v-model="taskForm.vehicle_id" label="Vehicle" :options="vehicleOptions" />

        <BaseInput v-model="taskForm.task_type" label="Task type" placeholder="e.g. Filter Swap, Oil Change" :required="true" />

        <BaseSelect v-model="taskForm.schedule_kind" label="Schedule" :options="scheduleOptions" />

        <BaseInput v-if="taskForm.schedule_kind === 'time'" v-model="taskForm.interval_days" label="Interval (days)" type="number" placeholder="e.g. 30" />

        <BaseInput
          v-if="taskForm.schedule_kind === 'usage'"
          v-model="taskForm.interval_usage"
          label="Interval (usage count)"
          type="number"
          placeholder="e.g. 500"
        />

        <BaseDatePicker v-model="taskForm.last_done_at" label="Last done at" />

        <BaseDatePicker
          v-model="taskForm.next_due_at"
          label="Next due at"
          :helper-text="taskForm.schedule_kind === 'time' ? 'Auto-filled when last done + interval are set' : 'Set manually for usage-based tasks'"
        />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="taskModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="task-form" :loading="saving">Save</BaseButton>
      </template>
    </BaseModal>

    <!-- Log Maintenance modal -->
    <BaseModal :open="logModalOpen" title="Log Maintenance" @close="logModalOpen = false">
      <form id="log-form" class="space-y-4" @submit.prevent="saveLog">
        <p class="text-sm text-independence">
          Task: <span class="font-medium text-casual-navy">{{ loggingTask?.task_type }}</span>
        </p>

        <BaseDatePicker v-model="logForm.performed_at" label="Performed at" :required="true" />

        <BaseInput v-model="logForm.cost_display" label="Cost" placeholder="₱0.00" />

        <BaseTextarea v-model="logForm.notes" label="Notes" placeholder="Optional notes…" :rows="3" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="logModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="log-form" :loading="loggingSaving">Save log</BaseButton>
      </template>
    </BaseModal>

    <!-- Deactivate confirm -->
    <BaseConfirm
      :open="deactivateConfirm !== null"
      title="Deactivate task?"
      :message="`Deactivate '${deactivateConfirm?.task_type}'? The task will be hidden but its history preserved.`"
      @confirm="confirmDeactivate"
      @cancel="deactivateConfirm = null"
    />
  </div>
</template>
