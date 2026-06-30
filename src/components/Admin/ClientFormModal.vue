<script setup lang="ts">
import type { Option } from '@/types';
import type { SubscriptionPlan, TenantOverview } from '@/types/database';
import type { ClientSubscriptionInput, CreateClientInput } from '@/services/admin';

defineOptions({ name: 'AdminClientFormModal' });

const open = defineModel<boolean>('open', { required: true });

const { client, saving } = defineProps<{
  client?: TenantOverview;
  saving?: boolean;
}>();

const emit = defineEmits<{
  create: [payload: CreateClientInput];
  update: [payload: ClientSubscriptionInput];
}>();

const PLAN_OPTIONS: Option<SubscriptionPlan>[] = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Lifetime', value: 'lifetime' },
];

type FormState = {
  name: string;
  contact_name: string;
  contact_phone: string;
  subscription_plan: SubscriptionPlan;
  priceInput: string;
  subscription_started_on: string;
  subscription_expires_on: string;
  branch_name: string;
  admin_username: string;
  admin_full_name: string;
  admin_password: string;
};

function blankForm(): FormState {
  return {
    name: '',
    contact_name: '',
    contact_phone: '',
    subscription_plan: 'monthly',
    priceInput: '',
    subscription_started_on: today(),
    subscription_expires_on: addDays(today(), 30),
    branch_name: '',
    admin_username: '',
    admin_full_name: '',
    admin_password: '',
  };
}

const form = reactive<FormState>(blankForm());

const isLifetime = computed(() => form.subscription_plan === 'lifetime');

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    Object.assign(form, blankForm());

    if (client) {
      form.name = client.name;
      form.contact_name = client.contact_name ?? '';
      form.contact_phone = client.contact_phone ?? '';
      form.subscription_plan = client.subscription_plan;
      form.priceInput = (client.subscription_price_centavos / 100).toFixed(2);
      form.subscription_started_on = client.subscription_started_on;
      form.subscription_expires_on = client.subscription_expires_on ?? '';
    }
  },
  { immediate: true },
);

// Re-suggest the expiry date when the plan changes while creating a client.
watch(
  () => form.subscription_plan,
  (plan) => {
    if (client) {
      return;
    }

    form.subscription_expires_on = plan === 'lifetime' ? '' : addDays(form.subscription_started_on, plan === 'yearly' ? 365 : 30);
  },
);

function submit() {
  const base: ClientSubscriptionInput = {
    name: form.name.trim(),
    contact_name: form.contact_name.trim() || null,
    contact_phone: form.contact_phone.trim() || null,
    subscription_plan: form.subscription_plan,
    subscription_price_centavos: parseMoney(form.priceInput),
    subscription_started_on: form.subscription_started_on,
    subscription_expires_on: isLifetime.value ? null : form.subscription_expires_on || null,
  };

  if (client) {
    emit('update', base);
    return;
  }

  emit('create', {
    ...base,
    branch_name: form.branch_name.trim(),
    admin_username: form.admin_username.trim(),
    admin_full_name: form.admin_full_name.trim(),
    admin_password: form.admin_password,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="client ? 'Edit Client' : 'New Client'" size="lg">
    <form id="client-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.name" label="Business name" required placeholder="e.g. Aquaverde Refilling" />

      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.contact_name" label="Contact name" placeholder="Optional" />
        <BaseInput v-model="form.contact_phone" label="Contact phone" placeholder="Optional" />
      </div>

      <div class="border-t border-sparkling-silver pt-4">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-oslo">Subscription</p>

        <div class="grid grid-cols-2 gap-3">
          <BaseSelect v-model="form.subscription_plan" label="Plan" :options="PLAN_OPTIONS" />
          <BaseInput v-model="form.priceInput" label="Price" type="currency" placeholder="0.00" />
        </div>

        <div class="mt-3 grid grid-cols-2 gap-3">
          <BaseDatePicker v-model="form.subscription_started_on" label="Start date" required />
          <BaseDatePicker v-if="!isLifetime" v-model="form.subscription_expires_on" label="Expiry date" required />
        </div>
      </div>

      <div v-if="!client" class="border-t border-sparkling-silver pt-4">
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-oslo">First branch & admin login</p>

        <BaseInput v-model="form.branch_name" label="Branch name" required placeholder="e.g. Main Branch" />

        <div class="mt-3 grid grid-cols-2 gap-3">
          <BaseInput v-model="form.admin_username" label="Admin username" required placeholder="e.g. owner" />
          <BaseInput v-model="form.admin_full_name" label="Admin full name" required placeholder="e.g. Juan Dela Cruz" />
        </div>

        <BaseInput v-model="form.admin_password" label="Admin password" type="password" required placeholder="••••••••" class="mt-3" />
      </div>
    </form>

    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="client-form" :loading="saving">
        {{ client ? 'Save changes' : 'Create client' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
