<script setup lang="ts">
import type { Area } from '@/types/database';
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
const areaForm = reactive({ name: '', notes: '', primary_rider_id: '' });

function openAddArea() {
  editingArea.value = undefined;
  areaForm.name = '';
  areaForm.notes = '';
  areaForm.primary_rider_id = '';
  areaModalOpen.value = true;
}

function openEditArea(a: Area) {
  editingArea.value = a;
  areaForm.name = a.name;
  areaForm.notes = a.notes ?? '';
  areaForm.primary_rider_id = a.primary_rider_id ?? '';
  areaModalOpen.value = true;
}

const { loading: areaSaving, run: saveArea } = useAsync(async () => {
  const payload = {
    name: areaForm.name,
    notes: areaForm.notes || null,
    primary_rider_id: areaForm.primary_rider_id || null,
  };

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
const coverageForm = reactive({ covering_rider_id: '', starts_on: '', ends_on: '' });

function openCoverage(a: Area) {
  coverageArea.value = a;
  coverageForm.covering_rider_id = '';
  coverageForm.starts_on = today();
  coverageForm.ends_on = '';
  coverageModalOpen.value = true;
}

const { loading: coverageSaving, run: saveCoverage } = useAsync(async () => {
  if (!coverageArea.value) {
    return;
  }

  await createCoverageRecord({
    tenant_id: tenantId.value,
    branch_id: branchId.value,
    area_id: coverageArea.value.id,
    covering_rider_id: coverageForm.covering_rider_id,
    starts_on: coverageForm.starts_on,
    ends_on: coverageForm.ends_on || null,
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

      <BaseTable
        :columns="[
          { key: 'name', label: 'Area', class: 'font-medium text-casual-navy' },
          { key: 'primary_rider', label: 'Primary Rider', class: 'text-independence' },
          { key: 'notes', label: 'Notes', class: 'text-independence' },
          { key: 'actions', label: 'Actions', align: 'right' },
        ]"
        :data="filteredAreas"
        :loading="loading"
        row-key="id"
      >
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

    <!-- Area modal -->
    <BaseModal v-model:open="areaModalOpen" :title="editingArea ? 'Edit area' : 'Add area'">
      <form id="area-form" class="space-y-4" @submit.prevent="saveArea">
        <BaseInput v-model="areaForm.name" label="Area name" required />
        <BaseSelect v-model="areaForm.primary_rider_id" label="Primary rider" :options="riderOptions" placeholder="Select rider..." />
        <BaseTextarea v-model="areaForm.notes" label="Notes" :rows="2" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="areaModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="area-form" :loading="areaSaving">Save</BaseButton>
      </template>
    </BaseModal>

    <!-- Coverage modal -->
    <BaseModal v-model:open="coverageModalOpen" :title="`Add coverage — ${coverageArea?.name ?? ''}`">
      <form id="coverage-form" class="space-y-4" @submit.prevent="saveCoverage">
        <BaseSelect v-model="coverageForm.covering_rider_id" label="Covering rider" :options="riderOptions" required />
        <BaseDatePicker v-model="coverageForm.starts_on" label="Starts on" required />
        <BaseDatePicker v-model="coverageForm.ends_on" label="Ends on (leave blank for open-ended)" />
      </form>
      <template #footer>
        <BaseButton variant="independence" @click="coverageModalOpen = false">Cancel</BaseButton>
        <BaseButton type="submit" form="coverage-form" :loading="coverageSaving">Add coverage</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
