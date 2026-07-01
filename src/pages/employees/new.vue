<script setup lang="ts">
import type { FullPageTab } from '@/components/Base/BaseFullPageTabs.vue';
import { USERNAME_PATTERN, type EmployeeAccountForm, type EmployeeForm } from '@/constants/employee';
import { ROUTES } from '@/constants/routes';
import { formatMoney, parseMoney } from '@/helpers/money';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();
const { tenantId, branchId } = storeToRefs(auth);

const employeeId = typeof route.query.id === 'string' ? route.query.id : undefined;
const isEdit = !!employeeId;

const { data: employeeRes, loading: fetching } = useAsync(() => getEmployee(employeeId!), { immediate: isEdit });

const employee = computed(() => employeeRes.value?.data ?? null);

const form = reactive<EmployeeForm>({
  full_name: '',
  phone: '',
  hire_date: '',
  role: 'rider',
  monthly_salary_display: formatMoney(0),
  daily_quota_jugs: '',
});

/** Selected rest-day weekdays (0=Sun..6=Sat). Serialised to sorted number[] on save. */
const restDays = ref<Set<number>>(new Set([0]));

const account = reactive<EmployeeAccountForm>({ username: '', password: '' });

const saveError = ref<string>();

/** Existing employees may already have a login account; account fields only show when they don't. */
const hasAccount = computed(() => !!employee.value?.user_id);
const showAccount = computed(() => !hasAccount.value);

const hasName = () => !!form.full_name.trim();

const detailsTab: FullPageTab = {
  label: 'Details',
  value: 'details',
  title: isEdit ? 'Edit employee' : 'Add employee',
  subtitle: isEdit ? 'Update employee details' : 'Create a new employee',
};

const accountTab: FullPageTab = {
  label: 'Account',
  value: 'account',
  title: 'App account',
  subtitle: 'Login credentials for this employee',
  canNavigateTo: hasName,
};

const reviewTab: FullPageTab = {
  label: 'Review',
  value: 'review',
  title: 'Review',
  subtitle: isEdit ? 'Confirm the changes before saving' : 'Confirm the details before adding the employee',
  canNavigateTo: hasName,
};

const tabs = computed<FullPageTab[]>(() => (showAccount.value ? [detailsTab, accountTab, reviewTab] : [detailsTab, reviewTab]));

const activeTab = ref<FullPageTab>(detailsTab);

const disableSave = computed(() => {
  if (!hasName()) {
    return true;
  }

  if (showAccount.value) {
    return !USERNAME_PATTERN.test(account.username) || account.password.length < 8;
  }

  return false;
});

watch(
  employee,
  (e) => {
    if (!e) {
      return;
    }

    form.full_name = e.full_name;
    form.phone = e.phone ?? '';
    form.hire_date = e.hire_date ?? '';
    form.role = e.role;
    form.monthly_salary_display = formatMoney(e.monthly_salary_centavos);
    form.daily_quota_jugs = e.daily_quota_jugs != null ? String(e.daily_quota_jugs) : '';
    restDays.value = new Set(e.rest_days ?? []);
  },
  { immediate: true },
);

function cancel() {
  router.push(ROUTES.EMPLOYEES);
}

const { loading: saving, run: save } = useAsync(async () => {
  saveError.value = undefined;

  const monthly_salary_centavos = parseMoney(form.monthly_salary_display);
  const daily_quota_jugs = form.role === 'rider' && form.daily_quota_jugs ? parseInt(form.daily_quota_jugs, 10) : null;
  const rest_days = [...restDays.value].sort((a, b) => a - b);

  let userId: string | undefined;

  if (showAccount.value) {
    try {
      userId = await createUserAccount({
        username: account.username,
        password: account.password,
        tenantId: tenantId.value,
        branchId: branchId.value,
        fullName: form.full_name,
        role: form.role,
      });
    } catch (err) {
      saveError.value = err instanceof Error ? err.message : 'Failed to create account.';
      return;
    }
  }

  if (isEdit) {
    await updateEmployee(employeeId!, {
      full_name: form.full_name,
      phone: form.phone || undefined,
      hire_date: form.hire_date || undefined,
      monthly_salary_centavos,
      daily_quota_jugs,
      rest_days,
      ...(userId ? { user_id: userId } : {}),
    });
  } else {
    if (!userId) {
      saveError.value = 'Account creation is required for new employees.';
      return;
    }

    await createEmployee({
      tenant_id: tenantId.value,
      branch_id: branchId.value,
      user_id: userId,
      full_name: form.full_name,
      phone: form.phone || undefined,
      hire_date: form.hire_date || undefined,
      role: form.role,
      monthly_salary_centavos,
      daily_quota_jugs,
      rest_days,
    });
  }

  toast.success(isEdit ? 'Employee updated' : 'Employee added');
  await router.push(ROUTES.EMPLOYEES);
});
</script>

<template>
  <BaseFullPageTabs
    v-model:tab="activeTab"
    :tabs="tabs"
    :loading="saving"
    :disable-save="disableSave"
    :save-button-text="isEdit ? 'Update employee' : 'Add employee'"
    @close="cancel"
    @save="save"
  >
    <template #content>
      <div v-if="fetching" class="flex justify-center py-12">
        <BaseSpinner size="lg" />
      </div>

      <div v-else class="mx-auto max-w-2xl space-y-4 p-6">
        <BaseFullPageTabsHeader :title="activeTab.title" :subtitle="activeTab.subtitle" />

        <EmployeeDetailsTab v-show="activeTab.value === 'details'" v-model="form" v-model:rest-days="restDays" />

        <EmployeeAccountTab v-if="showAccount" v-show="activeTab.value === 'account'" v-model="account" />

        <EmployeeReviewTab v-show="activeTab.value === 'review'" :form="form" :account="account" :rest-days="restDays" :show-account="showAccount" />

        <p v-if="saveError" class="text-sm text-blaze-red">{{ saveError }}</p>
      </div>
    </template>
  </BaseFullPageTabs>
</template>
