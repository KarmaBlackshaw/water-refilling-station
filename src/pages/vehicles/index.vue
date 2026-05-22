<script setup lang="ts">
import type { Vehicle, MaintenanceTask } from '@/types/database';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const { confirm } = useConfirm();

type VehicleWithTasks = { vehicles: Vehicle[]; allTasks: MaintenanceTask[] };

const {
  data: vehicleData,
  loading,
  run: load,
} = useAsync<VehicleWithTasks>(
  async () => {
    const rows = await listVehicles();
    const tasks = rows.length > 0 ? await listVehicleMaintenanceTasks(rows.map((v) => v.id)) : [];

    return { vehicles: rows, allTasks: tasks };
  },
  {
    immediate: true,
    defaultValue: { vehicles: [], allTasks: [] },
    disableResetValue: true,
  },
);

const vehicles = computed(() => vehicleData.value?.vehicles ?? []);
const allTasks = computed(() => vehicleData.value?.allTasks ?? []);

const modalOpen = ref(false);
const editingVehicle = ref<Vehicle>();

const vehicleTypeLabels: Record<string, string> = {
  motorcycle: 'Motorcycle',
  tricycle: 'Tricycle',
  truck: 'Truck',
  van: 'Van',
  other: 'Other',
};

const todayISO = today();
const weekLater = addDays(todayISO, 7);

function getVehiclePMBadges(vehicle: Vehicle) {
  const tasks = allTasks.value.filter((t) => t.vehicle_id === vehicle.id && t.active && !t.deleted_at);
  const overdueCount = tasks.filter((t) => t.next_due_at && t.next_due_at < todayISO).length;
  const dueSoonCount = tasks.filter((t) => t.next_due_at && t.next_due_at >= todayISO && t.next_due_at <= weekLater).length;

  return { overdueCount, dueSoonCount };
}

function labelForType(type: string): string {
  return vehicleTypeLabels[type] ?? type;
}

function openAdd() {
  editingVehicle.value = undefined;
  modalOpen.value = true;
}

function openEdit(v: Vehicle) {
  editingVehicle.value = v;
  modalOpen.value = true;
}

const { loading: saving, run: save } = useAsync(
  async (payload: { type: string; brand_model: string; plate_number: string; year: number | null; notes: string | null }) => {
    if (editingVehicle.value) {
      await updateVehicle(editingVehicle.value.id, payload);
    } else {
      await createVehicle(payload);
    }

    modalOpen.value = false;
    await load();
  },
);

function rowMenu(row: Vehicle) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete vehicle?',
          message: `Delete '${row.brand_model}'? This cannot be undone.`,
          onConfirm: async () => {
            await deleteVehicle(row.id);
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
          <h1 class="text-2xl font-bold text-casual-navy">Vehicles</h1>
          <p class="text-sm text-oslo">Manage fleet vehicles and assignments</p>
        </div>
        <BaseButton @click="openAdd">Add Vehicle</BaseButton>
      </div>

      <BaseCard padding="none">
        <BaseTable
          :columns="[
            { key: 'brand_model', label: 'Brand / Model', class: 'font-medium text-casual-navy' },
            { key: 'type', label: 'Type', class: 'text-independence' },
            { key: 'plate_number', label: 'Plate Number', class: 'num text-casual-navy' },
            { key: 'year', label: 'Year', class: 'num text-independence' },
            { key: 'pm_status', label: 'PM Status' },
            { key: 'actions', label: 'Actions', align: 'right' },
          ]"
          :data="vehicles"
          :loading="loading"
        >
          <template #cell-type="{ row }">{{ labelForType(row.type) }}</template>
          <template #cell-year="{ row }">{{ row.year ?? '—' }}</template>
          <template #cell-pm_status="{ row }">
            <div class="flex flex-wrap gap-1">
              <template v-if="getVehiclePMBadges(row).overdueCount > 0 || getVehiclePMBadges(row).dueSoonCount > 0">
                <BaseBadge v-if="getVehiclePMBadges(row).overdueCount > 0" variant="danger"> {{ getVehiclePMBadges(row).overdueCount }} overdue </BaseBadge>
                <BaseBadge v-if="getVehiclePMBadges(row).dueSoonCount > 0" variant="warning">
                  {{ getVehiclePMBadges(row).dueSoonCount }} due this week
                </BaseBadge>
              </template>
              <BaseBadge v-else variant="success">OK</BaseBadge>
            </div>
          </template>
          <template #cell-actions="{ row }">
            <BaseTableActions :menu="rowMenu(row)" />
          </template>
          <template #empty>
            <BaseEmptyState title="No vehicles registered">
              <template #actions>
                <BaseButton @click="openAdd">Add first vehicle</BaseButton>
              </template>
            </BaseEmptyState>
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <VehicleFormModal v-model:open="modalOpen" :vehicle="editingVehicle" :saving="saving" @submit="save" />
  </div>
</template>
