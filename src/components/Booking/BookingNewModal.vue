<script setup lang="ts">
import type { Customer, Product, ContainerType, User } from '@/types/database';

interface ItemRow {
  product_id: string;
  container_type_id: string;
  quantity: number;
  is_new_container: boolean;
}

const open = defineModel<boolean>('open', { required: true });

const { customers, riders, products, containerTypes, saving } = defineProps<{
  customers: Customer[];
  riders: Pick<User, 'id' | 'full_name'>[];
  products: Product[];
  containerTypes: ContainerType[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      customer_id: string;
      address_id: string | null;
      rider_id: string | null;
      scheduled_date: string;
      items: ItemRow[];
    },
  ];
}>();

const toast = useToast();

const customerOptions = computed(() => customers.map((c) => ({ label: c.name, value: c.id })));
const riderOptions = computed(() => riders.map((r) => ({ label: r.full_name, value: r.id })));
const productOptions = computed(() => products.map((p) => ({ label: p.name, value: p.id })));
const containerTypeOptions = computed(() => containerTypes.map((ct) => ({ label: ct.name, value: ct.id })));

const form = reactive({
  customer_id: '',
  address_id: '',
  rider_id: '',
  scheduled_date: today(),
  items: [] as ItemRow[],
});

const addressOptions = ref<{ label: string; value: string }[]>([]);

watch(
  () => form.customer_id,
  async (customerId) => {
    form.address_id = '';
    addressOptions.value = [];
    if (!customerId) {
      return;
    }

    const { data } = await listAddresses(customerId);

    addressOptions.value = (data ?? []).map((a) => ({
      label: `${a.label} — ${a.address_line}`,
      value: a.id,
    }));
  },
);

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    form.customer_id = '';
    form.address_id = '';
    form.rider_id = '';
    form.scheduled_date = today();
    form.items = [{ product_id: '', container_type_id: '', quantity: 1, is_new_container: false }];
  },
  { immediate: true },
);

function addItem() {
  form.items.push({ product_id: '', container_type_id: '', quantity: 1, is_new_container: false });
}
function removeItem(idx: number) {
  form.items.splice(idx, 1);
}

function submit() {
  if (!form.customer_id || !form.scheduled_date) {
    return;
  }

  if (form.items.length === 0) {
    toast.error('Add at least one item.');
    return;
  }

  emit('submit', {
    customer_id: form.customer_id,
    address_id: form.address_id || null,
    rider_id: form.rider_id || null,
    scheduled_date: form.scheduled_date,
    items: form.items.filter((i) => i.product_id && i.container_type_id),
  });
}
</script>

<template>
  <BaseModal v-model:open="open" title="New Booking" size="lg">
    <form id="new-booking-form" class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="form.customer_id" label="Customer" :options="customerOptions" placeholder="Select customer..." required />
        <BaseSelect v-model="form.address_id" label="Address" :options="addressOptions" placeholder="Select address..." :disabled="!form.customer_id" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <BaseSelect v-model="form.rider_id" label="Rider" :options="riderOptions" placeholder="Select rider..." />
        <BaseDatePicker v-model="form.scheduled_date" label="Date" required />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-oslo">Items</span>
          <BaseButton variant="independence" type="button" @click="addItem"> + Add item </BaseButton>
        </div>
        <div v-for="(item, idx) in form.items" :key="idx" class="grid grid-cols-[1fr_1fr_72px_auto] gap-2 items-end">
          <BaseSelect v-model="item.product_id" :options="productOptions" placeholder="Product..." />
          <BaseSelect v-model="item.container_type_id" :options="containerTypeOptions" placeholder="Container..." />
          <BaseInput v-model="item.quantity" type="number" placeholder="Qty" />
          <BaseButton variant="independence" type="button" class="text-blaze-red mb-0.5" @click="removeItem(idx)"> ✕ </BaseButton>
        </div>
        <p v-if="form.items.length === 0" class="text-xs text-independence">No items added yet.</p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="new-booking-form" :loading="saving"> Create Booking </BaseButton>
    </template>
  </BaseModal>
</template>
