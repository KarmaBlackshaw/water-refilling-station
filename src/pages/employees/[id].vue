<script setup lang="ts">
import { formatMoney, parseMoney } from '@/helpers/money';
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

// Income computations (commission shown as 0 — TODO in T10)
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

// Salary record creation
const salaryModalOpen = ref(false);
const salaryForm = reactive({
  period_start: '',
  period_end: '',
  base_pay_display: '',
  commission_display: '',
  gross_display: '',
  notes: '',
});
const salarySaving = ref(false);

function openCreateSalary(period: 'today' | 'this_week' | 'this_month') {
  const breakdown = getIncomeBreakdown(period);
  const { start, end } = getPeriodDates(period);

  salaryForm.period_start = start;
  salaryForm.period_end = end;
  salaryForm.base_pay_display = formatMoney(breakdown?.basePayCentavos ?? 0);
  salaryForm.commission_display = formatMoney(breakdown?.commissionCentavos ?? 0);
  salaryForm.gross_display = formatMoney(breakdown?.grossCentavos ?? 0);
  salaryForm.notes = '';
  salaryModalOpen.value = true;
}

async function saveSalaryRecord() {
  if (!employee.value) {
    return;
  }

  salarySaving.value = true;
  const base = parseMoney(salaryForm.base_pay_display);
  const commission = parseMoney(salaryForm.commission_display);
  const gross = parseMoney(salaryForm.gross_display);

  await createSalaryRecord({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    employee_id: employee.value.id,
    period_start: salaryForm.period_start,
    period_end: salaryForm.period_end,
    base_pay_centavos: base,
    commission_centavos: commission,
    gross_centavos: gross,
    net_centavos: gross,
    notes: salaryForm.notes || undefined,
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
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div v-if="loading" class="flex justify-center py-12">
      <BaseSpinner size="lg" />
    </div>

    <div v-else-if="employee" class="space-y-6">
      <!-- Header -->
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

      <!-- Income cards -->
      <div class="grid gap-3 grid-cols-3">
        <!-- Today -->
        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">Today</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(todayIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(todayIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(todayIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('today')">Create salary record</BaseButton>
        </BaseCard>

        <!-- This week -->
        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">This week</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(weekIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(weekIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(weekIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('this_week')">Create salary record</BaseButton>
        </BaseCard>

        <!-- This month -->
        <BaseCard padding="sm">
          <p class="text-xs font-medium text-oslo uppercase tracking-wide">This month</p>
          <p class="mt-1 text-xl font-semibold num text-casual-navy">{{ formatMoney(monthIncome?.grossCentavos ?? 0) }}</p>
          <p class="mt-0.5 text-xs text-independence">
            Base: {{ formatMoney(monthIncome?.basePayCentavos ?? 0) }} · Commission: {{ formatMoney(monthIncome?.commissionCentavos ?? 0) }}
          </p>
          <BaseButton variant="independence" class="mt-2 w-full" @click="openCreateSalary('this_month')">Create salary record</BaseButton>
        </BaseCard>
      </div>

      <!-- Salary records -->
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
              <BaseButton v-if="!row.paid_at" variant="independence" @click="submitRecord(row)">Mark paid</BaseButton>
            </template>
          </BaseTable>
        </BaseCard>
      </div>
    </div>

    <!-- Salary modal -->
    <BaseModal :open="salaryModalOpen" title="Create salary record" @close="salaryModalOpen = false">
      <form id="salary-record-form" class="space-y-4" @submit.prevent="saveSalaryRecord">
        <div class="grid grid-cols-2 gap-3">
          <BaseDatePicker v-model="salaryForm.period_start" label="Period start" :required="true" />
          <BaseDatePicker v-model="salaryForm.period_end" label="Period end" :required="true" />
        </div>
        <BaseInput v-model="salaryForm.base_pay_display" label="Base pay" placeholder="₱0.00" />
        <BaseInput v-model="salaryForm.commission_display" label="Commission" placeholder="₱0.00" />
        <BaseInput v-model="salaryForm.gross_display" label="Gross (editable)" placeholder="₱0.00" />
        <BaseTextarea v-model="salaryForm.notes" label="Notes" :rows="2" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="salaryModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="salary-record-form" :loading="salarySaving">Save record</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
