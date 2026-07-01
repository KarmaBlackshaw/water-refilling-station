<script setup lang="ts">
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import type { TenantOverview } from '@/types/database';
import type { ClientSubscriptionInput, CreateClientInput } from '@/services/admin';
import IconCheck from '@/components/Icon/IconCheck.vue';
import IconClose from '@/components/Icon/IconClose.vue';
import IconEdit from '@/components/Icon/IconEdit.vue';
import { ROUTES } from '@/constants/routes';
import { clientState, PLAN_LABEL, STATE_META } from '@/helpers/clients';
import { useRouteQueryStrings } from '@/composables/useRouteQueryStrings';

const router = useRouter();
const toast = useToast();
const { confirm } = useConfirm();

const { q: search } = useRouteQueryStrings({ q: '' });

const {
  data: clientsRes,
  loading,
  run: load,
} = useAsync(() => listClients({ search: search.value || undefined }), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
  watch: [search],
});

const clients = computed(() => clientsRes.value?.data ?? []);

const stats = computed(() => ({
  total: clients.value.length,
  active: clients.value.filter((c) => c.status === 'active').length,
  suspended: clients.value.filter((c) => c.status === 'suspended').length,
  expiringSoon: clients.value.filter((c) => clientState(c) === 'expiring').length,
}));

const columns: TableColumn<TenantOverview>[] = [
  { key: 'name', label: 'Client', class: 'font-medium text-casual-navy' },
  { key: 'subscription_plan', label: 'Plan' },
  { key: 'subscription_price_centavos', label: 'Price', align: 'right' },
  { key: 'state', label: 'Status' },
  { key: 'subscription_expires_on', label: 'Expires' },
  { key: 'counts', label: 'Branches / Users', align: 'right' },
  { key: 'actions', label: '', align: 'right', width: '48px' },
];

const modalOpen = ref(false);
const editingClient = ref<TenantOverview>();
const saving = ref(false);

function openCreate() {
  editingClient.value = undefined;
  modalOpen.value = true;
}

function openEdit(client: TenantOverview) {
  editingClient.value = client;
  modalOpen.value = true;
}

function goToDetail(client: TenantOverview) {
  router.push(ROUTES.ADMIN_CLIENT_DETAIL(client.id));
}

async function persist(fn: () => Promise<void>, successMsg: string, failMsg: string) {
  saving.value = true;

  try {
    await fn();
    modalOpen.value = false;
    await load();
    toast.success(successMsg);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : failMsg);
  } finally {
    saving.value = false;
  }
}

function onCreate(payload: CreateClientInput) {
  persist(() => createClient(payload).then(() => undefined), 'Client created', 'Failed to create client');
}

function onUpdate(payload: ClientSubscriptionInput) {
  const target = editingClient.value;

  if (!target) {
    return;
  }

  persist(
    async () => {
      const { error } = await updateClient(target.id, payload);

      if (error) {
        throw error;
      }
    },
    'Client updated',
    'Failed to update client',
  );
}

function toggleStatus(client: TenantOverview) {
  const next = client.status === 'active' ? 'suspended' : 'active';

  confirm({
    title: next === 'suspended' ? 'Suspend client?' : 'Reactivate client?',
    message:
      next === 'suspended'
        ? `Suspend "${client.name}"? Their users will be blocked from signing in.`
        : `Reactivate "${client.name}"? Their users can sign in again.`,
    variant: next === 'suspended' ? 'blaze-red' : 'tampa',
    confirmLabel: next === 'suspended' ? 'Suspend' : 'Reactivate',
    onConfirm: async () => {
      const { error } = await setClientStatus(client.id, next);

      if (error) {
        toast.error('Failed to update status');
        return;
      }

      await load();
      toast.success(next === 'suspended' ? 'Client suspended' : 'Client reactivated');
    },
  });
}

function rowMenu(client: TenantOverview) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(client) },
    client.status === 'active'
      ? { label: 'Suspend', icon: IconClose, danger: true, onClick: () => toggleStatus(client) }
      : { label: 'Reactivate', icon: IconCheck, onClick: () => toggleStatus(client) },
  ];
}
</script>

<template>
  <div class="h-full space-y-6 overflow-y-auto p-6">
    <AdminClientStats :total="stats.total" :active="stats.active" :suspended="stats.suspended" :expiring-soon="stats.expiringSoon" :loading="loading" />

    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Clients" subtitle="Manage client accounts and subscriptions" :count="clients.length">
        <template #actions>
          <BaseButton @click="openCreate">New client</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTable :columns="columns" :data="clients" :loading="loading" row-key="id" @row-click="goToDetail">
        <template #cell-subscription_plan="{ row }">{{ PLAN_LABEL[row.subscription_plan] }}</template>
        <template #cell-subscription_price_centavos="{ row }">{{ formatMoney(row.subscription_price_centavos) }}</template>
        <template #cell-state="{ row }">
          <BaseBadge :variant="STATE_META[clientState(row)].badge" size="sm">{{ STATE_META[clientState(row)].label }}</BaseBadge>
        </template>
        <template #cell-subscription_expires_on="{ row }">
          {{ row.subscription_plan === 'lifetime' ? 'Lifetime' : row.subscription_expires_on ? formatDateDisplay(row.subscription_expires_on) : '—' }}
        </template>
        <template #cell-counts="{ row }">{{ row.branches_count }} / {{ row.users_count }}</template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="rowMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No clients yet">
            <template #actions>
              <BaseButton @click="openCreate">Add first client</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </BaseCard>

    <AdminClientFormModal v-model:open="modalOpen" :client="editingClient" :saving="saving" @create="onCreate" @update="onUpdate" />
  </div>
</template>
