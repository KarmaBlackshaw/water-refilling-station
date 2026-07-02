<script setup lang="ts">
import { formatMoney } from '@/helpers/money';
import { computeIncome, getPeriodDates } from '@/services/payroll';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { SalaryRecord } from '@/types/database';

const route = useRoute();
const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

const {
  data,
  loading,
  run: load,
} = useAsync(
  async () => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

    if (!id) {
      throw new Error('Employee ID is required');
    }

    const [empRes, attRes, salRes] = await Promise.all([getEmployee(id), listAttendanceForMonth(id, currentYear(), currentMonth()), listSalaryRecords(id)]);

    return {
      employee: empRes.data,
      attendance: attRes.data ?? [],
      salaryRecords: salRes.data ?? [],
    };
  },
  {
    immediate: true,
    disableResetValue: true,
  },
);

const employee = computed(() => data.value?.employee ?? null);
const attendance = computed(() => data.value?.attendance ?? []);
const salaryRecords = computed(() => data.value?.salaryRecords ?? []);

const todayIso = today();

const todayAttendance = computed(() => attendance.value.find((a) => a.attendance_date === todayIso));

async function toggleTodayAttendance() {
  if (!employee.value) {
    return;
  }

  const current = todayAttendance.value?.status;
  const next = current === 'present' ? 'absent' : 'present';

  await upsertAttendance({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    employee_id: employee.value.id,
    attendance_date: todayIso,
    status: next,
  });
  await load();
}

function getIncomeBreakdown(period: 'today' | 'this_week' | 'this_month') {
  if (!employee.value) {
    return null;
  }

  const { start, end } = getPeriodDates(period);

  return computeIncome(employee.value, start, end, attendance.value, {});
}

const todayIncome = computed(() => getIncomeBreakdown('today'));
const weekIncome = computed(() => getIncomeBreakdown('this_week'));
const monthIncome = computed(() => getIncomeBreakdown('this_month'));

const incomePeriods = computed(() => [
  { key: 'today' as const, label: 'Today', income: todayIncome.value },
  { key: 'this_week' as const, label: 'This week', income: weekIncome.value },
  { key: 'this_month' as const, label: 'This month', income: monthIncome.value },
]);

const salaryModalOpen = ref(false);
const salaryInitial = ref<{
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
}>();
const salarySaving = ref(false);

function openCreateSalary(period: 'today' | 'this_week' | 'this_month') {
  const breakdown = getIncomeBreakdown(period);
  const { start, end } = getPeriodDates(period);

  salaryInitial.value = {
    period_start: start,
    period_end: end,
    base_pay_centavos: breakdown?.basePayCentavos ?? 0,
    commission_centavos: breakdown?.commissionCentavos ?? 0,
    gross_centavos: breakdown?.grossCentavos ?? 0,
  };
  salaryModalOpen.value = true;
}

async function saveSalaryRecord(payload: {
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
  notes: string | undefined;
}) {
  if (!employee.value) {
    return;
  }

  salarySaving.value = true;
  await createSalaryRecord({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    employee_id: employee.value.id,
    period_start: payload.period_start,
    period_end: payload.period_end,
    base_pay_centavos: payload.base_pay_centavos,
    commission_centavos: payload.commission_centavos,
    gross_centavos: payload.gross_centavos,
    net_centavos: payload.gross_centavos,
    notes: payload.notes,
  });
  salaryModalOpen.value = false;
  await load();
  salarySaving.value = false;
}

async function submitRecord(record: SalaryRecord) {
  if (!auth.authUser) {
    return;
  }

  await submitSalaryRecord(record.id, auth.authUser.id);
  await load();
}

function salaryRowMenu(row: SalaryRecord) {
  return [{ label: 'Mark paid', hidden: !!row.paid_at, onClick: () => submitRecord(row) }];
}

const salaryColumns: TableColumn<SalaryRecord>[] = [
  { key: 'period', label: 'Period' },
  { key: 'base_pay', label: 'Base pay', class: 'num' },
  { key: 'commission', label: 'Commission', class: 'num' },
  { key: 'gross', label: 'Gross', class: 'num' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '', align: 'right' },
];
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="employee" class="space-y-6">
      <BaseCard padding="none" class="flex flex-col gap-5">
        <div class="flex items-start justify-between gap-4 px-5 pt-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold text-casual-navy">{{ employee.full_name }}</h1>
              <BaseBadge :variant="employee.role === 'admin' ? 'info' : 'default'">{{ employee.role }}</BaseBadge>
            </div>
            <p class="text-xs text-oslo">Employee profile and payroll</p>
          </div>
          <BaseButton :variant="todayAttendance?.status === 'present' ? 'full-white' : 'tampa'" @click="toggleTodayAttendance">
            {{ todayAttendance?.status === 'present' ? 'Mark absent' : 'Mark present' }}
          </BaseButton>
        </div>

        <div class="grid grid-cols-3 gap-3 px-5 pb-5">
          <BaseKpiTile v-for="period in incomePeriods" :key="period.key" :label="period.label" :value="formatMoney(period.income?.grossCentavos ?? 0)">
            <p class="mt-0.5 text-xs text-independence">
              Base: {{ formatMoney(period.income?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(period.income?.commissionCentavos ?? 0) }}
            </p>
            <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary(period.key)">Create salary record</BaseButton>
          </BaseKpiTile>
        </div>
      </BaseCard>

      <BaseCard padding="none" class="flex flex-col gap-5">
        <h2 class="px-5 pt-4 text-lg font-bold text-casual-navy">Salary records</h2>
        <BaseTable :columns="salaryColumns" :data="salaryRecords" empty-title="No salary records yet">
          <template #cell-period="{ row }">{{ row.period_start }} – {{ row.period_end }}</template>
          <template #cell-base_pay="{ row }">{{ formatMoney(row.base_pay_centavos) }}</template>
          <template #cell-commission="{ row }">{{ formatMoney(row.commission_centavos) }}</template>
          <template #cell-gross="{ row }">{{ formatMoney(row.gross_centavos) }}</template>
          <template #cell-status="{ row }">
            <BaseBadge :variant="row.paid_at ? 'success' : 'warning'">
              {{ row.paid_at ? 'Paid' : 'Draft' }}
            </BaseBadge>
          </template>
          <template #cell-actions="{ row }">
            <BaseTableActions :menu="salaryRowMenu(row)" />
          </template>
        </BaseTable>
      </BaseCard>
    </div>

    <EmployeeSalaryRecordModal v-model:open="salaryModalOpen" :initial="salaryInitial" :saving="salarySaving" @submit="saveSalaryRecord" />
  </div>
</template>
