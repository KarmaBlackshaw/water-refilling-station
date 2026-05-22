<script setup lang="ts">
import type { Vehicle, MaintenanceTask } from '@/types/database';

const auth = useAuthStore();

// Data
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

// Modal state
const modalOpen = ref(false);
const editingVehicle = ref<Vehicle | null>(null);
const saving = ref(false);
const deleteTarget = ref<Vehicle | null>(null);

// Form
const form = reactive({
  type: '',
  brand_model: '',
  plate_number: '',
  year: '' as string | number,
  notes: '',
});

const vehicleTypeOptions = [
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Tricycle', value: 'tricycle' },
  { label: 'Truck', value: 'truck' },
  { label: 'Van', value: 'van' },
  { label: 'Other', value: 'other' },
];

const year = currentYear();

// PM badge computation
const todayISO = today();
const weekLater = addDays(todayISO, 7);

function getVehiclePMBadges(vehicle: Vehicle) {
  const tasks = allTasks.value.filter((t) => t.vehicle_id === vehicle.id && t.active && !t.deleted_at);
  const overdueCount = tasks.filter((t) => t.next_due_at && t.next_due_at < todayISO).length;
  const dueSoonCount = tasks.filter((t) => t.next_due_at && t.next_due_at >= todayISO && t.next_due_at <= weekLater).length;

  return { overdueCount, dueSoonCount };
}

function labelForType(type: string): string {
  return vehicleTypeOptions.find((o) => o.value === type)?.label ?? type;
}

function openAdd() {
  editingVehicle.value = null;
  form.type = '';
  form.brand_model = '';
  form.plate_number = '';
  form.year = '';
  form.notes = '';
  modalOpen.value = true;
}

function openEdit(v: Vehicle) {
  editingVehicle.value = v;
  form.type = v.type;
  form.brand_model = v.brand_model ?? '';
  form.plate_number = v.plate_number ?? '';
  form.year = v.year ?? '';
  form.notes = v.notes ?? '';
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  const payload = {
    type: form.type,
    brand_model: form.brand_model,
    plate_number: form.plate_number,
    year: form.year !== '' ? Number(form.year) : null,
    notes: form.notes || null,
  };

  if (editingVehicle.value) {
    await updateVehicle(editingVehicle.value.id, payload);
  } else {
    await createVehicle(payload);
  }

  modalOpen.value = false;
  await load();
  saving.value = false;
}

async function confirmDelete() {
  if (!deleteTarget.value) {
    return;
  }

  await deleteVehicle(deleteTarget.value.id);
  deleteTarget.value = null;
  await load();
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Vehicles</h1>
          <p class="text-sm text-oslo">Manage fleet vehicles and assignments</p>
        </div>
        <BaseButton @click="openAdd">Add Vehicle</BaseButton>
      </div>

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
          <div class="flex justify-end gap-2">
            <BaseButton variant="independence" @click="openEdit(row)">Edit</BaseButton>
            <BaseButton variant="independence" class="text-blaze-red" @click="deleteTarget = row">Delete</BaseButton>
          </div>
        </template>
        <template #empty>
          <BaseEmptyState title="No vehicles registered">
            <template #actions>
              <BaseButton @click="openAdd">Add first vehicle</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </div>

    <!-- Add / Edit modal -->
    <BaseModal :open="modalOpen" :title="editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'" @close="modalOpen = false">
      <form id="vehicle-form" class="space-y-4" @submit.prevent="save">
        <BaseSelect v-model="form.type" label="Type" :options="vehicleTypeOptions" placeholder="Select type..." :required="true" />
        <BaseInput v-model="form.brand_model" label="Brand / Model" placeholder="e.g. Honda Wave 125" :required="true" />
        <BaseInput v-model="form.plate_number" label="Plate Number" placeholder="e.g. ABC 1234" :required="true" />
        <BaseInput v-model="form.year" label="Year (optional)" type="number" :min="1990" :max="year" placeholder="e.g. 2022" />
        <BaseTextarea v-model="form.notes" label="Notes (optional)" :rows="3" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="vehicle-form" :loading="saving">
          {{ editingVehicle ? 'Save changes' : 'Add Vehicle' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirm -->
    <BaseConfirm
      :open="deleteTarget !== null"
      title="Delete vehicle?"
      :message="`Delete '${deleteTarget?.brand_model}'? This cannot be undone.`"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
