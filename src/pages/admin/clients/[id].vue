<script setup lang="ts">
import type { Ref } from 'vue';
import type { ClientSubscriptionInput } from '@/services/admin';
import type { ProvisionUserPayload } from '@/components/Admin/UserFormModal.vue';
import IconChevronRight from '@/components/Icon/IconChevronRight.vue';
import { ROUTES } from '@/constants/routes';
import { clientState, PLAN_LABEL, STATE_META } from '@/helpers/clients';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const clientId = computed(() => String(route.params.id));

const {
  data: pageData,
  loading,
  run: load,
} = useAsync(
  async () => {
    const id = clientId.value;
    const [overview, branches, users] = await Promise.all([getClientOverview(id), listClientBranches(id), listClientUsers(id)]);

    return { overview, branches, users };
  },
  { immediate: true, watch: [clientId] },
);

const client = computed(() => pageData.value?.overview.data?.[0] ?? null);
const branches = computed(() => pageData.value?.branches.data ?? []);
const users = computed(() => pageData.value?.users.data ?? []);
const branchOptions = computed(() => branches.value.map((b) => ({ label: b.name, value: b.id })));

const editModalOpen = ref(false);
const branchModalOpen = ref(false);
const userModalOpen = ref(false);
const saving = ref(false);

async function persist(fn: () => Promise<void>, successMsg: string, failMsg: string, close: Ref<boolean>) {
  saving.value = true;

  try {
    await fn();
    close.value = false;
    await load();
    toast.success(successMsg);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : failMsg);
  } finally {
    saving.value = false;
  }
}

function onUpdate(payload: ClientSubscriptionInput) {
  persist(
    async () => {
      const { error } = await updateClient(clientId.value, payload);

      if (error) {
        throw error;
      }
    },
    'Client updated',
    'Failed to update client',
    editModalOpen,
  );
}

function onAddBranch(name: string) {
  persist(() => createClientBranch(clientId.value, name).then(() => undefined), 'Branch added', 'Failed to add branch', branchModalOpen);
}

function onAddUser(payload: ProvisionUserPayload) {
  persist(
    () =>
      provisionUser({
        tenantId: clientId.value,
        branchId: payload.branchId,
        username: payload.username,
        fullName: payload.fullName,
        password: payload.password,
        role: payload.role,
      }).then(() => undefined),
    'User added',
    'Failed to add user',
    userModalOpen,
  );
}

function toggleStatus() {
  const current = client.value;

  if (!current) {
    return;
  }

  const next = current.status === 'active' ? 'suspended' : 'active';

  confirm({
    title: next === 'suspended' ? 'Suspend client?' : 'Reactivate client?',
    message:
      next === 'suspended'
        ? `Suspend "${current.name}"? Their users will be blocked from signing in.`
        : `Reactivate "${current.name}"? Their users can sign in again.`,
    variant: next === 'suspended' ? 'blaze-red' : 'tampa',
    confirmLabel: next === 'suspended' ? 'Suspend' : 'Reactivate',
    onConfirm: async () => {
      const { error } = await setClientStatus(current.id, next);

      if (error) {
        toast.error('Failed to update status');
        return;
      }

      await load();
      toast.success(next === 'suspended' ? 'Client suspended' : 'Client reactivated');
    },
  });
}
</script>

<template>
  <div class="h-full space-y-6 overflow-y-auto p-6">
    <button type="button" class="flex items-center gap-1 text-sm text-independence hover:text-casual-navy" @click="router.push(ROUTES.ADMIN_CLIENTS)">
      <IconChevronRight class="size-4 rotate-180" />
      Back to clients
    </button>

    <div v-if="loading && !client" class="space-y-4">
      <BaseSkeleton class="h-10 w-64" />
      <BaseSkeleton class="h-32 w-full" />
    </div>

    <BaseEmptyState v-else-if="!client" title="Client not found" description="This client may have been removed." />

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <h1 class="text-xl font-bold text-casual-navy">{{ client.name }}</h1>
          <BaseBadge :variant="STATE_META[clientState(client)].badge" size="sm">{{ STATE_META[clientState(client)].label }}</BaseBadge>
        </div>
        <div class="flex items-center gap-2">
          <BaseButton variant="full-white" size="sm" @click="editModalOpen = true">Edit</BaseButton>
          <BaseButton :variant="client.status === 'active' ? 'blaze-red' : 'tampa'" size="sm" @click="toggleStatus">
            {{ client.status === 'active' ? 'Suspend' : 'Reactivate' }}
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <BaseKpiCard label="Branches" :value="client.branches_count">
          <template #icon><IconBuilding :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard label="Users" :value="client.users_count" icon-tone="gray">
          <template #icon><IconEmployees :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard label="Customers" :value="client.customers_count" icon-tone="gray">
          <template #icon><IconCustomers :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard label="Sales" :value="client.sales_count" icon-tone="gray">
          <template #icon><IconSales :size="18" /></template>
        </BaseKpiCard>
        <BaseKpiCard label="Revenue" :value="formatMoney(client.revenue_centavos)">
          <template #icon><IconMoney :size="18" /></template>
        </BaseKpiCard>
      </div>

      <BaseCard padding="md">
        <h3 class="mb-4 text-sm font-semibold text-casual-navy">Subscription</h3>
        <dl class="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <dt class="text-xs text-oslo">Plan</dt>
            <dd class="mt-1 text-sm font-medium text-casual-navy">{{ PLAN_LABEL[client.subscription_plan] }}</dd>
          </div>
          <div>
            <dt class="text-xs text-oslo">Price</dt>
            <dd class="mt-1 text-sm font-medium text-casual-navy">{{ formatMoney(client.subscription_price_centavos) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-oslo">Started</dt>
            <dd class="mt-1 text-sm font-medium text-casual-navy">{{ formatDateDisplay(client.subscription_started_on) }}</dd>
          </div>
          <div>
            <dt class="text-xs text-oslo">Expires</dt>
            <dd class="mt-1 text-sm font-medium text-casual-navy">
              {{
                client.subscription_plan === 'lifetime' ? 'Lifetime' : client.subscription_expires_on ? formatDateDisplay(client.subscription_expires_on) : '—'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-oslo">Contact</dt>
            <dd class="mt-1 text-sm font-medium text-casual-navy">
              {{ client.contact_name || '—' }}{{ client.contact_phone ? ` · ${client.contact_phone}` : '' }}
            </dd>
          </div>
        </dl>
      </BaseCard>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminBranchesCard :branches="branches" :loading="loading" @add="branchModalOpen = true" />
        <AdminUsersCard :users="users" :loading="loading" @add="userModalOpen = true" />
      </div>
    </template>

    <AdminClientFormModal v-model:open="editModalOpen" :client="client ?? undefined" :saving="saving" @update="onUpdate" />
    <AdminBranchFormModal v-model:open="branchModalOpen" :saving="saving" @submit="onAddBranch" />
    <AdminUserFormModal v-model:open="userModalOpen" :branch-options="branchOptions" :saving="saving" @submit="onAddUser" />
  </div>
</template>
