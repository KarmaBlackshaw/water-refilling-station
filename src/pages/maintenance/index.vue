<script setup lang="ts">
import type { MaintenanceTask, MaintenanceScope, ScheduleKind, Vehicle } from '@/types/database';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const { confirm } = useConfirm();

const tabs = [
  { key: 'water_plant', label: 'Water Plant' },
  { key: 'vehicle', label: 'Vehicles' },
];
const activeTab = ref<MaintenanceScope>('water_plant');

const {
  data: tasks,
  loading,
  run: load,
} = useAsync(() => listTasks(activeTab.value), {
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
const editingTask = ref<MaintenanceTask>();
const saving = ref(false);

async function openAddTask() {
  editingTask.value = undefined;
  if (activeTab.value === 'vehicle') {
    await ensureVehicles();
  }

  taskModalOpen.value = true;
}

async function openEditTask(task: MaintenanceTask) {
  editingTask.value = task;
  if (activeTab.value === 'vehicle') {
    await ensureVehicles();
  }

  taskModalOpen.value = true;
}

async function saveTask(formPayload: {
  vehicle_id: string | null;
  task_type: string;
  schedule_kind: ScheduleKind;
  interval_days: number | null;
  interval_usage: number | null;
  last_done_at: string | null;
  next_due_at: string | null;
}) {
  saving.value = true;
  const payload = {
    scope: activeTab.value,
    ...formPayload,
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

const logModalOpen = ref(false);
const loggingTask = ref<MaintenanceTask>();
const loggingSaving = ref(false);

function openLogModal(task: MaintenanceTask) {
  loggingTask.value = task;
  logModalOpen.value = true;
}

async function saveLog(payload: { performed_at: string; cost_centavos: number | null; notes: string | null }) {
  if (!loggingTask.value) {
    return;
  }

  loggingSaving.value = true;
  await createLog({
    task_id: loggingTask.value.id,
    performed_at: payload.performed_at,
    cost_centavos: payload.cost_centavos,
    notes: payload.notes,
  });
  logModalOpen.value = false;
  await load();
  loggingSaving.value = false;
}

function taskMenu(task: MaintenanceTask) {
  return [
    { label: 'Log', onClick: () => openLogModal(task) },
    { label: 'Edit', icon: IconEdit, onClick: () => openEditTask(task) },
    {
      label: 'Deactivate',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Deactivate task?',
          message: `Deactivate '${task.task_type}'? The task will be hidden but its history preserved.`,
          onConfirm: async () => {
            await updateTask(task.id, { active: false });
            await load();
          },
        }),
    },
  ];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Maintenance</h1>
          <p class="text-sm text-oslo">Track maintenance schedules for plant and vehicles</p>
        </div>
        <BaseButton @click="openAddTask">Add Task</BaseButton>
      </div>

      <BaseTabs v-model="activeTab" :tabs="tabs" />

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
            <BaseTableActions :menu="taskMenu(row)" />
          </template>
          <template #empty>
            <BaseEmptyState title="No maintenance tasks">
              <template #actions>
                <BaseButton @click="openAddTask">Add first task</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <MaintenanceTaskFormModal
      v-model:open="taskModalOpen"
      :task="editingTask"
      :scope="activeTab"
      :vehicle-options="vehicleOptions"
      :saving="saving"
      @submit="saveTask"
    />

    <MaintenanceLogModal v-model:open="logModalOpen" :task="loggingTask" :saving="loggingSaving" @submit="saveLog" />
  </div>
</template>
