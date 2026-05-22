<script setup lang="ts">
import { formatMoney, parseMoney } from '@/helpers/money';

interface InitialValues {
  period_start: string;
  period_end: string;
  base_pay_centavos: number;
  commission_centavos: number;
  gross_centavos: number;
}

const open = defineModel<boolean>('open', { required: true });

const { initial, saving } = defineProps<{
  initial?: InitialValues;
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      period_start: string;
      period_end: string;
      base_pay_centavos: number;
      commission_centavos: number;
      gross_centavos: number;
      notes: string | undefined;
    },
  ];
}>();

const form = reactive({
  period_start: '',
  period_end: '',
  base_pay_display: '',
  commission_display: '',
  gross_display: '',
  notes: '',
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    if (initial) {
      form.period_start = initial.period_start;
      form.period_end = initial.period_end;
      form.base_pay_display = formatMoney(initial.base_pay_centavos);
      form.commission_display = formatMoney(initial.commission_centavos);
      form.gross_display = formatMoney(initial.gross_centavos);
    } else {
      form.period_start = '';
      form.period_end = '';
      form.base_pay_display = formatMoney(0);
      form.commission_display = formatMoney(0);
      form.gross_display = formatMoney(0);
    }

    form.notes = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    period_start: form.period_start,
    period_end: form.period_end,
    base_pay_centavos: parseMoney(form.base_pay_display),
    commission_centavos: parseMoney(form.commission_display),
    gross_centavos: parseMoney(form.gross_display),
    notes: form.notes || undefined,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="Create salary record">
    <form id="salary-record-form" class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <BaseDatePicker v-model="form.period_start" label="Period start" required />
        <BaseDatePicker v-model="form.period_end" label="Period end" required />
      </div>
      <BaseInput v-model="form.base_pay_display" label="Base pay" placeholder="₱0.00" />
      <BaseInput v-model="form.commission_display" label="Commission" placeholder="₱0.00" />
      <BaseInput v-model="form.gross_display" label="Gross (editable)" placeholder="₱0.00" />
      <BaseTextarea v-model="form.notes" label="Notes" :rows="2" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="salary-record-form" :loading="saving">Save record</BaseButton>
    </template>
  </BaseModal>
</template>
