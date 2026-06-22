<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { ExpenseCategory, FilterDefinition, FilterValues } from '@/types';
import { formatMoney } from '@/helpers/money';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

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

const filterValues = ref<FilterValues>({
  from: startOfMonth(),
  to: today(),
  category: '',
});

const categoryOptions = computed(() => CATEGORIES.map((c) => ({ label: CATEGORY_LABEL[c], value: c })));

function toCategory(value: string | undefined): ExpenseCategory | undefined {
  return CATEGORIES.find((c) => c === value);
}

const filterDefinitions = computed<FilterDefinition[]>(() => [
  { label: 'Date', field: 'date-range', keyFrom: 'from', keyTo: 'to' },
  { key: 'category', label: 'Category', field: 'select', options: categoryOptions.value },
]);

type ExpenseRow = Awaited<ReturnType<typeof listExpenses>>['rows'][number];

const {
  data: expenses,
  loading,
  run: load,
} = useAsync(
  () => {
    if (!tenantId.value || !branchId.value) {
      return Promise.resolve({ rows: [], count: 0 });
    }

    return listExpenses({
      tenantId: tenantId.value,
      branchId: branchId.value,
      from: filterValues.value.from ?? '',
      to: filterValues.value.to ?? '',
      category: toCategory(filterValues.value.category),
    });
  },
  {
    immediate: true,
    watch: filterValues,
    defaultValue: { rows: [], count: 0 },
    disableResetValue: true,
  },
);

const totalCentavos = computed(() => expenses.value?.rows.reduce((s, e) => s + e.amount_centavos, 0) ?? 0);

const byCategory = computed(() => {
  const map: Partial<Record<ExpenseCategory, number>> = {};

  for (const e of expenses.value?.rows ?? []) {
    map[e.category] = (map[e.category] ?? 0) + e.amount_centavos;
  }
  return map;
});

const { data } = useAsync(
  () => {
    if (!tenantId.value || !branchId.value) {
      return Promise.resolve([]);
    }

    return getEmployees(tenantId.value, branchId.value);
  },
  {
    immediate: true,
    defaultValue: [],
    disableResetValue: true,
  },
);

const employees = computed(() => data.value ?? []);

const employeeOptions = computed(() => [
  {
    label: 'None / External',
    value: '',
  },
  ...employees.value.map((e) => ({ label: e.full_name, value: e.id })),
]);

const modalOpen = ref(false);
const editingExpense = ref<ExpenseRow>();

function openAdd() {
  editingExpense.value = undefined;
  modalOpen.value = true;
}

function openEdit(expense: ExpenseRow) {
  editingExpense.value = expense;
  modalOpen.value = true;
}

const { loading: saving, run: saveExpense } = useAsync(
  async (payload: {
    expense_date: string;
    category: ExpenseCategory;
    amount_centavos: number;
    payee_employee_id: string | null;
    description: string | null;
    reference_number: string | null;
  }) => {
    if (editingExpense.value) {
      await updateExpense(editingExpense.value.id, payload);
    } else {
      if (!tenantId.value || !branchId.value) {
        return;
      }

      await createExpense(tenantId.value, branchId.value, payload);
    }

    modalOpen.value = false;
    await load();
  },
);

const search = ref('');

const filteredExpenses = computed(() => {
  const q = search.value.trim().toLowerCase();

  if (!q) {
    return expenses.value?.rows ?? [];
  }

  return (expenses.value?.rows ?? []).filter((e) => {
    if (e.description?.toLowerCase().includes(q)) {
      return true;
    }

    const emp = e.employees;

    if (emp && typeof emp === 'object' && 'full_name' in emp) {
      return String(emp.full_name).toLowerCase().includes(q);
    }

    return false;
  });
});

function rowMenu(row: ExpenseRow) {
  return [
    {
      label: 'Edit',
      icon: IconEdit,
      onClick: () => openEdit(row),
    },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete expense?',
          message: `Delete this ${CATEGORY_LABEL[row.category]} expense of ${formatMoney(row.amount_centavos)}?`,
          onConfirm: async () => {
            await deleteExpense(row.id);
            await load();
          },
        }),
    },
  ];
}

const columns: TableColumn<ExpenseRow>[] = [
  { key: 'expense_date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'payee', label: 'Payee' },
  { key: 'reference_number', label: 'Ref #' },
  { key: 'amount', label: 'Amount', align: 'right', class: 'num' },
  { key: 'actions', label: '' },
];
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Expenses" subtitle="Track and categorize operational expenses" :count="filteredExpenses.length">
        <template #actions>
          <BaseButton @click="openAdd">Add Expense</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTableFilterBar v-model="filterValues" :definitions="filterDefinitions" />

      <div class="px-5">
        <div class="flex items-baseline gap-2">
          <span class="text-xs text-independence">Total in range:</span>
          <span class="num text-2xl font-semibold text-casual-navy">{{ formatMoney(totalCentavos) }}</span>
        </div>
        <div v-if="Object.keys(byCategory).length > 0" class="mt-1.5 flex flex-wrap gap-2">
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

      <BaseTable :columns="columns" :data="filteredExpenses" :loading="loading">
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
          <BaseTableActions :menu="rowMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No expenses found" description="Add your first expense or adjust the filters.">
            <template #actions>
              <BaseButton @click="openAdd">Add Expense</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </BaseCard>

    <ExpenseFormModal
      v-model:open="modalOpen"
      :expense="editingExpense"
      :employee-options="employeeOptions"
      :categories="CATEGORIES"
      :category-label="CATEGORY_LABEL"
      :saving="saving"
      @submit="saveExpense"
    />
  </div>
</template>
