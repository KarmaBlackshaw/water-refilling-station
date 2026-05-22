<script setup lang="ts">
import type { ExpenseCategory } from '@/types/database';

type ExpenseLike = {
  id: string;
  expense_date: string;
  category: ExpenseCategory;
  amount_centavos: number;
  payee_employee_id: string | null;
  description: string | null;
  reference_number: string | null;
};

const open = defineModel<boolean>('open', { required: true });

const { expense, employeeOptions, categories, categoryLabel, saving } = defineProps<{
  expense: ExpenseLike | null;
  employeeOptions: { label: string; value: string }[];
  categories: ExpenseCategory[];
  categoryLabel: Record<ExpenseCategory, string>;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      expense_date: string;
      category: ExpenseCategory;
      amount_centavos: number;
      payee_employee_id: string | null;
      description: string | null;
      reference_number: string | null;
    },
  ];
}>();

type FormState = {
  expense_date: string;
  category: ExpenseCategory | '';
  amountInput: string;
  payee_employee_id: string;
  description: string;
  reference_number: string;
};

const form = reactive<FormState>({
  expense_date: today(),
  category: '',
  amountInput: '',
  payee_employee_id: '',
  description: '',
  reference_number: '',
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (expense) {
      form.expense_date = expense.expense_date;
      form.category = expense.category;
      form.amountInput = (expense.amount_centavos / 100).toFixed(2);
      form.payee_employee_id = expense.payee_employee_id ?? '';
      form.description = expense.description ?? '';
      form.reference_number = expense.reference_number ?? '';
    } else {
      form.expense_date = today();
      form.category = '';
      form.amountInput = '';
      form.payee_employee_id = '';
      form.description = '';
      form.reference_number = '';
    }
  },
  { immediate: true },
);

function submit() {
  if (!form.category) {
    return;
  }

  const category = form.category;

  emit('submit', {
    expense_date: form.expense_date,
    category,
    amount_centavos: Math.round(parseFloat(form.amountInput) * 100),
    payee_employee_id: form.payee_employee_id || null,
    description: form.description || null,
    reference_number: form.reference_number || null,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="expense ? 'Edit Expense' : 'Add Expense'">
    <form id="expense-form" class="space-y-4" @submit.prevent="submit">
      <BaseDatePicker v-model="form.expense_date" label="Date" required />

      <BaseSelect
        v-model="form.category"
        label="Category"
        :options="categories.map((c) => ({ label: categoryLabel[c], value: c }))"
        placeholder="Select category..."
        required
      />

      <BaseInput v-model="form.amountInput" label="Amount (₱)" type="number" required placeholder="0.00" step="0.01" min="0" />

      <BaseSelect v-model="form.payee_employee_id" label="Payee Employee" :options="employeeOptions" />

      <BaseTextarea v-model="form.description" label="Description" :rows="2" placeholder="Optional notes..." />

      <BaseInput v-model="form.reference_number" label="Reference #" placeholder="Optional receipt or reference number" />
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="expense-form" :loading="saving">
        {{ expense ? 'Update' : 'Add' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
