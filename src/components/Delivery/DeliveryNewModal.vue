<script setup lang="ts">
const open = defineModel<boolean>({ required: true });

const { defaultDate } = defineProps<{
  defaultDate: string;
}>();

const emit = defineEmits<{
  created: [saleDate: string];
}>();

const auth = useAuthStore();

const form = reactive({
  customer_id: '',
  rider_id: '',
  address_id: '',
  sale_date: defaultDate,
  notes: '',
  payment_method: 'cash',
  payment_amount: '',
  payment_gcash_ref: '',
});

const lines = ref<
  Array<{
    product_id: string;
    container_type_id: string;
    quantity: number;
    unit_price_centavos: number;
    is_new_container: boolean;
  }>
>([]);

function emptyLine() {
  return {
    product_id: '',
    container_type_id: '',
    quantity: 1,
    unit_price_centavos: 0,
    is_new_container: false,
  };
}

function addLine() {
  lines.value.push(emptyLine());
}

function removeLine(idx: number) {
  lines.value.splice(idx, 1);
}

const { data: customersRes, run: loadCustomers } = useAsync(() => listCustomers(auth.tenantId, auth.branchId));
const customers = computed(() => customersRes.value?.data ?? []);

const { data: ridersRes, run: loadRiders } = useAsync(() => listRiders(auth.tenantId, auth.branchId));
const riders = computed(() => ridersRes.value?.data ?? []);

const { data: productsRes, run: loadProducts } = useAsync(() => listProducts(auth.tenantId, auth.branchId));
const products = computed(() => productsRes.value?.data ?? []);

const { data: containerTypesRes, run: loadContainerTypes } = useAsync(() => listContainerTypes(auth.tenantId, auth.branchId));
const containerTypes = computed(() => containerTypesRes.value?.data ?? []);

const { data: customerAddressesRes } = useAsync(
  () => {
    if (!form.customer_id) {
      return Promise.resolve(null);
    }

    return listAddresses(form.customer_id);
  },
  { watch: () => form.customer_id },
);
const customerAddresses = computed(() => customerAddressesRes.value?.data ?? []);

watch(customerAddresses, (list) => {
  const def = (list ?? []).find((a) => a.is_default);

  form.address_id = def?.id ?? '';
});

watch(open, (isOpen) => {
  if (!isOpen) {
    return;
  }

  form.customer_id = '';
  form.rider_id = '';
  form.address_id = '';
  form.sale_date = defaultDate;
  form.notes = '';
  form.payment_method = 'cash';
  form.payment_amount = '';
  form.payment_gcash_ref = '';
  lines.value = [emptyLine()];
  Promise.all([loadCustomers(), loadRiders(), loadProducts(), loadContainerTypes()]);
});

const customerOptions = computed(() => (customers.value ?? []).map((c) => ({ label: c.name, value: c.id })));
const riderOptions = computed(() => [{ label: '— No rider —', value: '' }, ...(riders.value ?? []).map((r) => ({ label: r.full_name, value: r.id }))]);
const addressOptions = computed(() =>
  (customerAddresses.value ?? []).map((a) => ({
    label: `${a.label} — ${a.address_line}`,
    value: a.id,
  })),
);
const productOptions = computed(() => (products.value ?? []).map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => (containerTypes.value ?? []).map((c) => ({ label: c.name, value: c.id })));

const total = computed(() => lines.value.reduce((s, l) => s + l.quantity * l.unit_price_centavos, 0));

const { loading: saving, run: submit } = useAsync(async () => {
  const amountCentavos = Math.round(parseFloat(form.payment_amount || '0') * 100);

  await createDeliverySale({
    tenant_id: auth.tenantId,
    branch_id: auth.branchId,
    customer_id: form.customer_id,
    address_id: form.address_id || null,
    rider_id: form.rider_id || null,
    sale_date: form.sale_date,
    notes: form.notes || null,
    lines: lines.value.filter((l) => l.product_id && l.container_type_id),
    payments:
      amountCentavos > 0
        ? [
            {
              method: form.payment_method,
              amount_centavos: amountCentavos,
              gcash_ref: form.payment_method === 'gcash' ? form.payment_gcash_ref || null : null,
            },
          ]
        : [],
  });

  const saleDate = form.sale_date;

  open.value = false;
  emit('created', saleDate);
});
</script>

<template>
  <BaseModal v-model:open="open" title="New Delivery" size="xl">
    <form id="new-delivery-form" class="space-y-5" @submit.prevent="submit">
      <BaseSelect
        v-model="form.customer_id"
        label="Customer"
        :options="customerOptions"
        placeholder="Select customer..."
        search-placeholder="Search customer..."
        searchable
        required
      />
      <div class="grid gap-4 grid-cols-2">
        <BaseSelect v-model="form.rider_id" label="Rider" :options="riderOptions" placeholder="Select rider..." />
        <BaseSelect
          v-model="form.address_id"
          label="Delivery Address"
          :options="addressOptions"
          placeholder="Select address..."
          :disabled="!form.customer_id"
        />
      </div>
      <BaseDatePicker v-model="form.sale_date" label="Delivery Date" required />
      <div class="space-y-2">
        <p class="text-sm font-medium text-casual-navy">Items</p>
        <div v-for="(line, idx) in lines" :key="idx" class="grid grid-cols-[1fr_1fr_4rem_6rem_auto] items-end gap-2">
          <BaseSelect v-model="line.product_id" :options="productOptions" placeholder="Product..." />
          <BaseSelect v-model="line.container_type_id" :options="containerTypeOptions" placeholder="Container..." />
          <BaseInput v-model="line.quantity" type="number" placeholder="Qty" />
          <BaseInput
            :model-value="(line.unit_price_centavos / 100).toFixed(2)"
            type="number"
            placeholder="Price (₱)"
            @update:model-value="(v) => (line.unit_price_centavos = Math.round(Number(v) * 100))"
          />
          <button type="button" class="pb-1 text-independence hover:text-blaze-red focus:outline-none" aria-label="Remove line" @click="removeLine(idx)">
            <IconClose class="size-4" />
          </button>
        </div>
        <BaseButton type="button" variant="independence" @click="addLine">+ Add item</BaseButton>
        <p class="text-right text-sm font-semibold text-casual-navy">
          Total: <span class="num">{{ formatMoney(total) }}</span>
        </p>
      </div>
      <div class="space-y-3">
        <p class="text-sm font-medium text-casual-navy">Payment</p>
        <div class="grid gap-3 grid-cols-2">
          <BaseSelect
            v-model="form.payment_method"
            label="Method"
            :options="[
              { label: 'Cash', value: 'cash' },
              { label: 'GCash', value: 'gcash' },
              { label: 'On Account', value: 'on_account' },
            ]"
          />
          <BaseInput v-model="form.payment_amount" label="Amount (₱)" type="number" placeholder="0.00" />
        </div>
        <BaseInput v-if="form.payment_method === 'gcash'" v-model="form.payment_gcash_ref" label="GCash Reference #" placeholder="e.g. 1234567890" />
      </div>
      <BaseTextarea v-model="form.notes" label="Notes" :rows="2" />
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="new-delivery-form" :loading="saving">Create Delivery</BaseButton>
    </template>
  </BaseModal>
</template>
