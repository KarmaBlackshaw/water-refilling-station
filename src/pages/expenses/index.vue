<script setup lang="ts">
import type { ExpenseCategory } from '@/types/database';
import { formatMoney } from '@/helpers/money';

// ────────────────────────────────────────────────────────────
// Auth / tenant context
// ────────────────────────────────────────────────────────────
const auth = useAuthStore();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

// ────────────────────────────────────────────────────────────
// Category metadata
// ────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const CATEGORIES: ExpenseCategory[] = ['gasoline', 'parts', 'supplies', 'utilities', 'other'];

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  gasoline: 'Gasoline',
  parts: 'Parts',
  supplies: 'Supplies',
  utilities: 'Utilities',
  other: 'Other',
};

const CATEGORY_VARIANT: Record<ExpenseCategory, BadgeVariant> = {
  gasoline: 'warning',
  parts: 'info',
  supplies: 'default',
  utilities: 'default',
  other: 'default',
};

// ────────────────────────────────────────────────────────────
// Filters
// ────────────────────────────────────────────────────────────
const filterFrom = ref(startOfMonth());
const filterTo = ref(today());
const filterCategory = ref('');

const categoryOptions = computed(() => [{ label: 'All Categories', value: '' }, ...CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: c }))]);

// ────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────
type ExpenseRow = Awaited<ReturnType<typeof listExpenses>>[number];

const {
  data: expenses,
  loading,
  run: load,
} = useAsync<ExpenseRow[]>(
  () => {
    if (!tenantId.value || !branchId.value) {
      return Promise.resolve([]);
    }

    return listExpenses({
      tenantId: tenantId.value,
      branchId: branchId.value,
      from: filterFrom.value,
      to: filterTo.value,
      category: filterCategory.value || undefined,
    });
  },
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
  },
);

// ────────────────────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────────────────────
const totalCentavos = computed(() => expenses.value.reduce((s, e) => s + e.amount_centavos, 0));

const byCategory = computed(() => {
  const map: Partial<Record<ExpenseCategory, number>> = {};

  for (const e of expenses.value) {
    map[e.category] = (map[e.category] ?? 0) + e.amount_centavos;
  }
  return map;
});

// ────────────────────────────────────────────────────────────
// Employees (for payee select)
// ────────────────────────────────────────────────────────────
type EmployeeOption = { id: string; full_name: string };

const { data: employees } = useAsync<EmployeeOption[]>(
  async () => {
    if (!tenantId.value || !branchId.value) {
      return [];
    }

    const { data } = await listEmployees(tenantId.value, branchId.value);

    return (data ?? []) as EmployeeOption[];
  },
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
  },
);

const employeeOptions = computed(() => [{ label: 'None / External', value: '' }, ...employees.value.map((e) => ({ label: e.full_name, value: e.id }))]);

// ────────────────────────────────────────────────────────────
// Modal state
// ────────────────────────────────────────────────────────────
const modalOpen = ref(false);
const editingExpense = ref<ExpenseRow | null>(null);
const saving = ref(false);

const form = reactive({
  expense_date: today(),
  category: '' as ExpenseCategory | '',
  amountInput: '',
  payee_employee_id: '',
  description: '',
  reference_number: '',
});

function openAdd() {
  editingExpense.value = null;
  form.expense_date = today();
  form.category = '';
  form.amountInput = '';
  form.payee_employee_id = '';
  form.description = '';
  form.reference_number = '';
  modalOpen.value = true;
}

function openEdit(expense: ExpenseRow) {
  editingExpense.value = expense;
  form.expense_date = expense.expense_date;
  form.category = expense.category;
  form.amountInput = (expense.amount_centavos / 100).toFixed(2);
  form.payee_employee_id = expense.payee_employee_id ?? '';
  form.description = expense.description ?? '';
  form.reference_number = expense.reference_number ?? '';
  modalOpen.value = true;
}

async function saveExpense() {
  if (!form.category) {
    return;
  }

  saving.value = true;
  try {
    const amount_centavos = Math.round(parseFloat(form.amountInput) * 100);
    const payload = {
      expense_date: form.expense_date,
      category: form.category as ExpenseCategory,
      amount_centavos,
      payee_employee_id: form.payee_employee_id || null,
      description: form.description || null,
      reference_number: form.reference_number || null,
    };

    if (editingExpense.value) {
      await updateExpense(editingExpense.value.id, payload);
    } else {
      await createExpense(tenantId.value, branchId.value, payload);
    }

    modalOpen.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

// ────────────────────────────────────────────────────────────
// Delete
// ────────────────────────────────────────────────────────────
const deleteTarget = ref<ExpenseRow | null>(null);
const deleting = ref(false);

async function confirmDelete() {
  if (!deleteTarget.value) {
    return;
  }

  deleting.value = true;
  try {
    await deleteExpense(deleteTarget.value.id);
    deleteTarget.value = null;
    await load();
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Expenses</h1>
          <p class="text-sm text-oslo">Track and categorize operational expenses</p>
        </div>
        <BaseButton size="sm" @click="openAdd">Add Expense</BaseButton>
      </div>

      <!-- Filters -->
      <BaseCard padding="sm">
        <div class="flex flex-wrap items-end gap-3">
          <BaseDatePicker v-model="filterFrom" label="From" class="w-36" />
          <BaseDatePicker v-model="filterTo" label="To" class="w-36" />
          <BaseSelect v-model="filterCategory" label="Category" :options="categoryOptions" class="w-44" />
          <div class="flex items-end">
            <BaseButton size="sm" @click="load">Filter</BaseButton>
          </div>
        </div>
      </BaseCard>

      <!-- Summary -->
      <BaseCard padding="sm">
        <div class="space-y-2">
          <div class="flex items-baseline gap-2">
            <span class="text-xs text-independence">Total in range:</span>
            <span class="num text-2xl font-semibold text-casual-navy">
              {{ formatMoney(totalCentavos) }}
            </span>
          </div>

          <div v-if="Object.keys(byCategory).length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="cat in CATEGORIES"
              v-show="byCategory[cat] !== undefined"
              :key="cat"
              class="inline-flex items-center gap-1 rounded bg-bright-chrome px-2 py-0.5 text-xs text-independence"
            >
              <span class="font-medium text-casual-navy">{{ CATEGORY_LABEL[cat] }}:</span>
              <span class="num">{{ formatMoney(byCategory[cat] ?? 0) }}</span>
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseTable
        :columns="[
          { key: 'expense_date', label: 'Date' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'payee', label: 'Payee' },
          { key: 'reference_number', label: 'Ref #' },
          { key: 'amount', label: 'Amount', align: 'right', class: 'num' },
          { key: 'actions', label: '' },
        ]"
        :data="expenses"
        :loading="loading"
      >
        <template #cell-category="{ row }">
          <BaseBadge :variant="CATEGORY_VARIANT[row.category]">
            {{ CATEGORY_LABEL[row.category] }}
          </BaseBadge>
        </template>
        <template #cell-description="{ row }">
          <span class="text-independence">{{ row.description ?? '—' }}</span>
        </template>
        <template #cell-payee="{ row }">
          <span v-if="row.employees">{{ (row.employees as { full_name: string }).full_name }}</span>
          <span v-else class="text-independence">—</span>
        </template>
        <template #cell-reference_number="{ row }">
          <span class="text-independence">{{ row.reference_number ?? '—' }}</span>
        </template>
        <template #cell-amount="{ row }">{{ formatMoney(row.amount_centavos) }}</template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <BaseButton variant="independence" size="sm" @click="openEdit(row)">Edit</BaseButton>
            <BaseButton variant="independence" size="sm" class="text-blaze-red" @click="deleteTarget = row">Delete</BaseButton>
          </div>
        </template>
        <template #empty>
          <BaseEmptyState title="No expenses found" description="Add your first expense or adjust the filters.">
            <template #actions>
              <BaseButton size="sm" @click="openAdd">Add Expense</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </div>

    <!-- Add / Edit Modal -->
    <BaseModal :open="modalOpen" :title="editingExpense ? 'Edit Expense' : 'Add Expense'" @close="modalOpen = false">
      <form id="expense-form" class="space-y-4" @submit.prevent="saveExpense">
        <BaseDatePicker v-model="form.expense_date" label="Date" :required="true" />

        <BaseSelect
          v-model="form.category"
          label="Category"
          :options="CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: c }))"
          placeholder="Select category..."
          :required="true"
        />

        <BaseInput v-model="form.amountInput" label="Amount (₱)" type="number" :required="true" placeholder="0.00" step="0.01" min="0" />

        <BaseSelect v-model="form.payee_employee_id" label="Payee Employee" :options="employeeOptions" />

        <BaseTextarea v-model="form.description" label="Description" :rows="2" placeholder="Optional notes..." />

        <BaseInput v-model="form.reference_number" label="Reference #" placeholder="Optional receipt or reference number" />
      </form>

      <template #footer>
        <BaseButton variant="independence" @click="modalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="expense-form" :loading="saving">
          {{ editingExpense ? 'Update' : 'Add' }}
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Delete confirm -->
    <BaseConfirm
      :open="deleteTarget !== null"
      title="Delete expense?"
      :message="`Delete this ${deleteTarget ? CATEGORY_LABEL[deleteTarget.category] : ''} expense of ${deleteTarget ? formatMoney(deleteTarget.amount_centavos) : ''}?`"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>
