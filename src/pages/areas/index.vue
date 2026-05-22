<script setup lang="ts">
import type { Area, User } from '@/types/database';

const auth = useAuthStore();
const { confirm } = useConfirm();
const tenantId = computed(() => auth.tenantId ?? '');
const branchId = computed(() => auth.branchId ?? '');

// Areas list
const areas = ref<Array<Area & { primary_rider: { id: string; full_name: string } | null }>>([]);
const areasLoading = ref(false);

// Riders list for select options
const riders = ref<Array<Pick<User, 'id' | 'full_name'>>>([]);

// Area modal
const areaModalOpen = ref(false);
const editingArea = ref<Area>();
const areaForm = reactive({ name: '', notes: '', primary_rider_id: '' });

// Coverage modal
const coverageModalOpen = ref(false);
const coverageArea = ref<Area>();
const coverageForm = reactive({ covering_rider_id: '', starts_on: '', ends_on: '' });

async function load() {
  areasLoading.value = true;
  const [areasRes, ridersRes] = await Promise.all([listAreas(tenantId.value, branchId.value), listRiders(tenantId.value, branchId.value)]);

  areas.value = areasRes.data ?? [];
  riders.value = ridersRes.data ?? [];
  areasLoading.value = false;
}

onMounted(load);

const riderOptions = computed(() => riders.value.map((r) => ({ label: r.full_name, value: r.id })));

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
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-casual-navy">Areas</h1>
          <p class="text-sm text-oslo">Manage delivery areas and coverage zones</p>
        </div>
        <BaseButton @click="openAddArea">Add area</BaseButton>
      </div>

      <BaseSpinner v-if="areasLoading" class="mx-auto mt-8" />
      <BaseEmptyState v-else-if="areas.length === 0" title="No areas yet">
        <template #actions>
          <BaseButton @click="openAddArea">Add first area</BaseButton>
        </template>
      </BaseEmptyState>

      <div v-else class="space-y-3">
        <BaseCard v-for="a in areas" :key="a.id" padding="sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-medium text-casual-navy">{{ a.name }}</p>
              <p v-if="a.primary_rider" class="mt-0.5 text-sm text-independence">Primary rider: {{ a.primary_rider.full_name }}</p>
              <p v-else class="mt-0.5 text-sm text-independence">No primary rider assigned</p>
              <p v-if="a.notes" class="mt-1 text-xs text-independence">{{ a.notes }}</p>
            </div>
            <div class="flex shrink-0 gap-2">
              <BaseButton variant="independence" @click="openCoverage(a)">Add coverage</BaseButton>
              <BaseButton variant="independence" @click="openEditArea(a)">Edit</BaseButton>
              <BaseButton
                variant="independence"
                class="text-blaze-red"
                @click="
                  confirm({
                    title: 'Delete area?',
                    message: `Delete '${a.name}'? Coverage records will also be removed.`,
                    onConfirm: async () => {
                      if (!auth.authUser) {
                        return;
                      }

                      await softDeleteArea(a.id, auth.authUser.id);
                      await load();
                    },
                  })
                "
              >
                Delete
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

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
