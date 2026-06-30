<script setup lang="ts">
import type { CustomerWithRider } from '@/services/customers';
import type { AttendanceStatus } from '@/types/database';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import { buildScheduleByRider, buildAttendanceByRider, riderStatus } from '@/helpers/riderCoverage';
import { defaultBarangay } from '@/helpers/address';
import { dayjs, today as getToday } from '@/helpers/date';
import { WEEKDAYS } from '@/constants/rider';
import { listRiderEmployees, listAttendanceForDate, updateEmployee, upsertAttendance, getAttendance } from '@/services/employees';
import { listCustomers } from '@/services/customers';
import { assignRider } from '@/services/riders';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconCalendar from '@/components/Icon/IconCalendar.vue';

type RiderEmployee = {
  id: string;
  user_id: string | null;
  full_name: string;
  rest_days: number[];
  daily_quota_jugs: number | null;
};

type AttendanceRow = {
  employee_id: string;
  attendance_date: string;
  status: AttendanceStatus;
};

type BarangayCount = {
  barangay: string;
  count: number;
};

type StatusInfo = { label: string; variant: 'success' | 'warning' | 'danger' };

type RiderViewRow = {
  emp: RiderEmployee;
  status: StatusInfo;
  restDayLabels: string[];
  primaryCount: number;
  backupCount: number;
  barangayCounts: BarangayCount[];
};

/** Shape the AssignCustomersModal expects. `id` = user_id so `assignRider` sets `customers.rider_id` correctly. */
type RiderOption = { id: string; full_name: string; rest_days: number[] };

const columns: TableColumn<RiderViewRow>[] = [
  { key: 'rider', label: 'Rider' },
  { key: 'rest_days', label: 'Rest days' },
  { key: 'customers', label: 'Customers' },
  { key: 'barangays', label: 'Areas covered' },
  { key: 'actions', label: '', align: 'right' },
];

function rowMenu(row: RiderViewRow) {
  return [
    { label: 'Rest days', icon: IconEdit, onClick: () => openRestDays(row.emp) },
    { label: 'Mark absent', icon: IconCalendar, onClick: () => openAbsence(row.emp) },
  ];
}

const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

const todayStr = getToday();

const {
  data: pageData,
  loading,
  run: load,
} = useAsync(
  () =>
    Promise.all([
      listRiderEmployees(tenantId.value, branchId.value),
      listCustomers(tenantId.value, branchId.value),
      listAttendanceForDate(tenantId.value, branchId.value, todayStr),
    ]),
  { immediate: true, disableResetValue: true },
);

const riderEmployees = computed((): RiderEmployee[] => pageData.value?.[0].data ?? []);
const customers = computed((): CustomerWithRider[] => pageData.value?.[1].data ?? []);
const attendanceRows = computed((): AttendanceRow[] => pageData.value?.[2].data ?? []);

const scheduleByRider = computed(() => buildScheduleByRider(riderEmployees.value));
const attendanceByRider = computed(() => buildAttendanceByRider(riderEmployees.value, attendanceRows.value));

/** Rider-employees with a linked user account, mapped to `{ id = user_id }` for customer assignment. */
const riderOptions = computed((): RiderOption[] =>
  riderEmployees.value
    .filter((e): e is RiderEmployee & { user_id: string } => e.user_id != null)
    .map((e) => ({ id: e.user_id, full_name: e.full_name, rest_days: e.rest_days })),
);

function toStatusInfo(uid: string | null): StatusInfo {
  const schedule = uid ? scheduleByRider.value.get(uid) : undefined;
  const attendance = uid ? attendanceByRider.value.get(uid) : undefined;
  const s = riderStatus(schedule, attendance, todayStr);

  if (s === 'absent') {
    return { label: 'Absent', variant: 'danger' };
  }

  if (s === 'rest') {
    return { label: 'Rest day', variant: 'warning' };
  }

  return { label: 'Working', variant: 'success' };
}

const riderViewRows = computed((): RiderViewRow[] =>
  riderEmployees.value.map((emp) => {
    const uid = emp.user_id;
    const primaryCustomers = uid ? customers.value.filter((c) => c.rider_id === uid) : [];
    const backupCustomers = uid ? customers.value.filter((c) => c.backup_rider_id === uid) : [];

    const barangayMap = new Map<string, number>();

    for (const c of primaryCustomers) {
      const b = defaultBarangay(c.addresses);

      barangayMap.set(b, (barangayMap.get(b) ?? 0) + 1);
    }

    const barangayCounts: BarangayCount[] = [...barangayMap.entries()].sort((a, b) => b[1] - a[1]).map(([barangay, count]) => ({ barangay, count }));

    return {
      emp,
      status: toStatusInfo(uid),
      restDayLabels: WEEKDAYS.filter((d) => emp.rest_days.includes(d.value)).map((d) => d.label),
      primaryCount: primaryCustomers.length,
      backupCount: backupCustomers.length,
      barangayCounts,
    };
  }),
);

const search = ref('');

const filteredRiderRows = computed(() => {
  const q = search.value.trim().toLowerCase();

  if (!q) {
    return riderViewRows.value;
  }

  return riderViewRows.value.filter((row) => row.emp.full_name.toLowerCase().includes(q));
});

const unassignedCustomers = computed(() => {
  const q = search.value.trim().toLowerCase();
  const base = customers.value.filter((c) => !c.rider_id);

  if (!q) {
    return base;
  }

  return base.filter((c) => c.name.toLowerCase().includes(q));
});

/** Rest days modal */
const restDaysModalOpen = ref(false);
const editingRestDaysEmp = ref<RiderEmployee>();

function openRestDays(emp: RiderEmployee) {
  editingRestDaysEmp.value = emp;
  restDaysModalOpen.value = true;
}

const { loading: restDaysSaving, run: saveRestDays } = useAsync(async (restDays: number[]) => {
  if (!editingRestDaysEmp.value) {
    return;
  }

  await updateEmployee(editingRestDaysEmp.value.id, { rest_days: restDays });
  restDaysModalOpen.value = false;
  await load();
});

/** Mark-absent modal */
const absenceModalOpen = ref(false);
const editingAbsenceEmp = ref<RiderEmployee>();

function openAbsence(emp: RiderEmployee) {
  editingAbsenceEmp.value = emp;
  absenceModalOpen.value = true;
}

const { confirm } = useConfirm();

const { loading: absenceSaving, run: saveAbsence } = useAsync(async (payload: { starts_on: string; ends_on: string | null }) => {
  if (!editingAbsenceEmp.value) {
    return;
  }

  const emp = editingAbsenceEmp.value;
  const end = payload.ends_on ?? payload.starts_on;

  /** Build date list, skipping scheduled rest days (marking them absent is meaningless) */
  const workDates: string[] = [];
  let cursor = dayjs(payload.starts_on);
  const endDay = dayjs(end);

  while (!cursor.isAfter(endDay)) {
    if (!emp.rest_days.includes(cursor.day())) {
      workDates.push(cursor.format('YYYY-MM-DD'));
    }

    cursor = cursor.add(1, 'day');
  }

  if (workDates.length === 0) {
    absenceModalOpen.value = false;
    return;
  }

  const doUpsert = async () => {
    await Promise.all(
      workDates.map((date) =>
        upsertAttendance({
          tenant_id: tenantId.value,
          branch_id: branchId.value,
          employee_id: emp.id,
          attendance_date: date,
          status: 'absent',
        }),
      ),
    );

    absenceModalOpen.value = false;
    await load();
  };

  /** Check for existing 'present' rows in the range — warn before overwriting */
  const existing = await Promise.all(workDates.map((d) => getAttendance(emp.id, d)));
  const presentDays = existing.filter((r) => r.data?.status === 'present');

  if (presentDays.length === 0) {
    await doUpsert();
  } else {
    confirm({
      title: 'Override present days?',
      message: `This overrides ${presentDays.length} present day${presentDays.length === 1 ? '' : 's'} and reduces pay.`,
      onConfirm: doUpsert,
    });
  }
});

/** Assign customers modal */
const assignModalOpen = ref(false);
const assignPresetIds = ref<string[]>();

function openAssign(presetIds?: string[]) {
  assignPresetIds.value = presetIds;
  assignModalOpen.value = true;
}

const { loading: assignSaving, run: saveAssign } = useAsync(
  async (payload: { customerIds: string[]; riderId: string | null; backupRiderId: string | null }) => {
    await assignRider(payload.customerIds, payload.riderId, payload.backupRiderId);
    assignModalOpen.value = false;
    await load();
  },
);
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Riders" subtitle="Riders and the areas they cover" :count="filteredRiderRows.length">
        <template #actions>
          <BaseButton :disabled="riderEmployees.length === 0" @click="openAssign()">Assign customers</BaseButton>
        </template>
      </BaseTableHeader>

      <!-- Rider table -->
      <BaseTable :columns="columns" :data="filteredRiderRows" :loading="loading" :row-key="(row) => row.emp.id">
        <template #cell-rider="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-casual-navy">{{ row.emp.full_name }}</span>
            <BaseBadge :variant="row.status.variant" size="sm">{{ row.status.label }}</BaseBadge>
            <BaseBadge v-if="!row.emp.user_id" variant="warning" size="sm">No account</BaseBadge>
          </div>
        </template>

        <template #cell-rest_days="{ row }">
          <span v-if="row.restDayLabels.length" class="text-independence">{{ row.restDayLabels.join(', ') }}</span>
          <span v-else class="italic text-oslo">None</span>
        </template>

        <template #cell-customers="{ row }">
          <div v-if="row.emp.user_id" class="flex flex-col gap-0.5 text-xs text-independence">
            <span
              ><span class="font-semibold text-casual-navy">{{ row.primaryCount }}</span> primary</span
            >
            <span v-if="row.backupCount > 0"
              >Backup for <span class="font-semibold text-casual-navy">{{ row.backupCount }}</span></span
            >
          </div>
          <span v-else class="text-xs italic text-oslo">—</span>
        </template>

        <template #cell-barangays="{ row }">
          <div v-if="row.barangayCounts.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="bc in row.barangayCounts"
              :key="bc.barangay"
              :class="[
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs',
                bc.barangay === 'No barangay'
                  ? 'border-dashed border-sparkling-silver text-oslo'
                  : 'border-sparkling-silver bg-bright-chrome text-independence',
              ]"
            >
              {{ bc.barangay }}
              <span :class="bc.barangay === 'No barangay' ? 'text-oslo' : 'font-semibold text-casual-navy'">· {{ bc.count }}</span>
            </span>
          </div>
          <span v-else class="text-xs italic text-oslo">—</span>
        </template>

        <template #cell-actions="{ row }">
          <BaseTableActions :menu="rowMenu(row)" />
        </template>

        <template #empty>
          <BaseEmptyState
            title="No riders found"
            :description="search ? 'No riders match your search.' : 'Add riders under Employees first, then return here to assign customers.'"
          />
        </template>
      </BaseTable>

      <!-- Unassigned customers section -->
      <div v-if="!loading && unassignedCustomers.length > 0" class="border-t border-sparkling-silver px-5 pb-5 pt-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-casual-navy">
              Unassigned
              <span class="ml-1 rounded-full border border-sparkling-silver bg-bright-chrome px-2 py-0.5 text-xs font-medium text-independence">
                {{ unassignedCustomers.length }}
              </span>
            </p>
            <p class="text-xs text-oslo">Customers with no primary rider assigned</p>
          </div>
          <BaseButton size="sm" variant="independence" @click="openAssign(unassignedCustomers.map((c) => c.id))">Assign</BaseButton>
        </div>

        <ul class="mt-3 flex flex-col gap-1">
          <li v-for="c in unassignedCustomers.slice(0, 10)" :key="c.id" class="text-sm text-independence">
            {{ c.name }}
            <span v-if="defaultBarangay(c.addresses) !== 'No barangay'" class="text-xs text-oslo"> — {{ defaultBarangay(c.addresses) }} </span>
          </li>
          <li v-if="unassignedCustomers.length > 10" class="text-xs text-oslo">and {{ unassignedCustomers.length - 10 }} more…</li>
        </ul>
      </div>
    </BaseCard>

    <!-- Modals -->
    <RiderRestDaysModal v-model:open="restDaysModalOpen" :rider="editingRestDaysEmp" :saving="restDaysSaving" @submit="saveRestDays" />

    <RiderAbsenceModal v-model:open="absenceModalOpen" :rider="editingAbsenceEmp" :saving="absenceSaving" @submit="saveAbsence" />

    <RiderAssignCustomersModal
      v-model:open="assignModalOpen"
      :customers="customers"
      :riders="riderOptions"
      :preset-customer-ids="assignPresetIds"
      :saving="assignSaving"
      @submit="saveAssign"
    />
  </div>
</template>
