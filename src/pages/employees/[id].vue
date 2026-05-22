<script setup lang="ts">
import { formatMoney } from '@/helpers/money';
import { computeIncome, getPeriodDates } from '@/services/payroll';
import type { Employee, EmployeeAttendance, SalaryRecord } from '@/types/database';

const route = useRoute();
const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

type EmployeePageData = {
  employee: Employee | null;
  attendance: EmployeeAttendance[];
  salaryRecords: SalaryRecord[];
};

const {
  data,
  loading,
  run: load,
} = useAsync<EmployeePageData>(
  async () => {
    const id = route.params.id as string;
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

const salaryModalOpen = ref(false);
const salaryInitial = ref<{
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
} | null>(null);
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
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="employee" class="space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">{{ employee.full_name }}</h1>
          <p class="text-sm text-oslo">Employee profile and payroll</p>
          <BaseBadge :variant="employee.role === 'admin' ? 'info' : 'default'" class="mt-1">{{ employee.role }}</BaseBadge>
        </div>
        <div class="flex gap-2">
          <BaseButton :variant="todayAttendance?.status === 'present' ? 'full-white' : 'turquoise-stone'" @click="toggleTodayAttendance">
            {{ todayAttendance?.status === 'present' ? 'Mark absent' : 'Mark present' }}
          </BaseButton>
        </div>
      </div>

      <div class="grid gap-3 grid-cols-3">
        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">Today</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(todayIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(todayIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(todayIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('today')">Create salary record</BaseButton>
        </BaseCard>

        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">This week</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(weekIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(weekIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(weekIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('this_week')">Create salary record</BaseButton>
        </BaseCard>

        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">This month</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(monthIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(monthIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(monthIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('this_month')">Create salary record</BaseButton>
        </BaseCard>
      </div>

      <div>
        <h2 class="mb-3 text-sm font-medium text-independence uppercase tracking-wide">Salary records</h2>
        <BaseCard padding="none">
          <BaseTable
            :columns="[
              { key: 'period', label: 'Period' },
              { key: 'base_pay', label: 'Base pay', class: 'num' },
              { key: 'commission', label: 'Commission', class: 'num' },
              { key: 'gross', label: 'Gross', class: 'num' },
              { key: 'status', label: 'Status' },
              { key: 'actions', label: '', align: 'right' },
            ]"
            :data="salaryRecords"
            empty-title="No salary records yet"
          >
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
    </div>

    <EmployeeSalaryRecordModal v-model:open="salaryModalOpen" :initial="salaryInitial" :saving="salarySaving" @submit="saveSalaryRecord" />
  </div>
</template>
