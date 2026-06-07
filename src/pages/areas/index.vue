<script setup lang="ts">
import type { Area } from '@/types/database';
import type { TableColumn } from '@/components/Base/BaseTable.vue';
import IconPlus from '@/components/Icon/IconPlus.vue';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

type AreaRow = Area & { primary_rider: { id: string; full_name: string } | null };

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

const {
  data: pageData,
  loading,
  run: load,
} = useAsync(
  async () => {
    const [areasRes, ridersRes] = await Promise.all([listAreas(tenantId.value, branchId.value), listRiders(tenantId.value, branchId.value)]);

    return { areas: areasRes.data ?? [], riders: ridersRes.data ?? [] };
  },
  {
    immediate: true,
    defaultValue: { areas: [], riders: [] },
    disableResetValue: true,
  },
);

const areas = computed(() => pageData.value?.areas ?? []);
const riderOptions = computed(() => (pageData.value?.riders ?? []).map((r) => ({ label: r.full_name, value: r.id })));

const columns: TableColumn<AreaRow>[] = [
  { key: 'name', label: 'Area', class: 'font-medium text-casual-navy' },
  { key: 'primary_rider', label: 'Primary Rider', class: 'text-independence' },
  { key: 'notes', label: 'Notes', class: 'text-independence' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

const search = ref('');

const filteredAreas = computed(() => {
  const q = search.value.trim().toLowerCase();

  if (!q) {
    return areas.value;
  }

  return areas.value.filter((a) => a.name.toLowerCase().includes(q) || a.primary_rider?.full_name.toLowerCase().includes(q));
});

// Area modal
const areaModalOpen = ref(false);
const editingArea = ref<Area>();

function openAddArea() {
  editingArea.value = undefined;
  areaModalOpen.value = true;
}

function openEditArea(a: Area) {
  editingArea.value = a;
  areaModalOpen.value = true;
}

const { loading: areaSaving, run: saveArea } = useAsync(async (payload: { name: string; notes: string | null; primary_rider_id: string | null }) => {
  if (editingArea.value) {
    await updateArea(editingArea.value.id, payload);
  } else {
    await createArea({ tenant_id: tenantId.value, branch_id: branchId.value, ...payload });
  }

  areaModalOpen.value = false;
  await load();
});

// Coverage modal
const coverageModalOpen = ref(false);
const coverageArea = ref<Area>();

function openCoverage(a: Area) {
  coverageArea.value = a;
  coverageModalOpen.value = true;
}

const { loading: coverageSaving, run: saveCoverage } = useAsync(async (payload: { covering_rider_id: string; starts_on: string; ends_on: string | null }) => {
  if (!coverageArea.value) {
    return;
  }

  await createCoverageRecord({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    area_id: coverageArea.value.id,
    ...payload,
  });
  coverageModalOpen.value = false;
  await load();
});

function rowMenu(row: AreaRow) {
  return [
    { label: 'Add coverage', icon: IconPlus, onClick: () => openCoverage(row) },
    { label: 'Edit', icon: IconEdit, onClick: () => openEditArea(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete area?',
          message: `Delete '${row.name}'? Coverage records will also be removed.`,
          onConfirm: async () => {
            if (!auth.authUser) {
              return;
            }

            await softDeleteArea(row.id, auth.authUser.id);
            await load();
          },
        }),
    },
  ];
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <BaseCard padding="none" class="flex flex-col gap-5">
      <BaseTableHeader v-model:search="search" title="Areas" subtitle="Manage delivery areas and coverage zones" :count="filteredAreas.length">
        <template #actions>
          <BaseButton @click="openAddArea">Add area</BaseButton>
        </template>
      </BaseTableHeader>

      <BaseTable :columns="columns" :data="filteredAreas" :loading="loading" row-key="id">
        <template #cell-primary_rider="{ row }">{{ row.primary_rider?.full_name ?? '—' }}</template>
        <template #cell-notes="{ row }">{{ row.notes || '—' }}</template>
        <template #cell-actions="{ row }">
          <BaseTableActions :menu="rowMenu(row)" />
        </template>
        <template #empty>
          <BaseEmptyState title="No areas yet">
            <template #actions>
              <BaseButton @click="openAddArea">Add first area</BaseButton>
            </template>
          </BaseEmptyState>
        </template>
      </BaseTable>
    </BaseCard>

    <AreaFormModal v-model:open="areaModalOpen" :area="editingArea" :rider-options="riderOptions" :saving="areaSaving" @submit="saveArea" />

    <AreaCoverageModal v-model:open="coverageModalOpen" :area="coverageArea" :rider-options="riderOptions" :saving="coverageSaving" @submit="saveCoverage" />
  </div>
</template>
