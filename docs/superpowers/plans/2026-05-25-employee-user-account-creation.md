# Employee User Account Creation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When creating or editing an employee, automatically create a Supabase auth account + `users` row so the employee can log in and be referenced as a rider/cashier/manager/admin throughout the app.

**Architecture:** A service-role Supabase client handles `auth.admin.createUser`. A new `src/services/users.ts` exposes `createUserAccount` and `hasUserAccount`. `EmployeeFormModal` gains username + password fields (hidden when account already exists). The `save()` handler in `employees/index.vue` calls `createUserAccount` before creating/updating the employee row, then writes the returned `userId` into `employees.user_id`.

**Tech Stack:** Vue 3 + TypeScript, Supabase JS v2 (`@supabase/supabase-js`), Pinia, Vite env vars.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `env.d.ts` | Add `VITE_SUPABASE_SERVICE_ROLE_KEY` to `ImportMetaEnv` |
| Create | `src/helpers/supabaseAdmin.ts` | Service-role Supabase client for `auth.admin` calls |
| Create | `src/services/users.ts` | `createUserAccount` |
| Modify | `src/services/employees.ts` | Add `user_id` to `createEmployee` param type |
| Modify | `src/components/Employee/EmployeeFormModal.vue` | Add account section (username + password) to form |
| Modify | `src/pages/employees/index.vue` | Call `createUserAccount` before employee DB write |

---

### Task 1: Declare `VITE_SUPABASE_SERVICE_ROLE_KEY` in env types

**Files:**
- Modify: `env.d.ts`

- [ ] **Step 1: Add env var to `ImportMetaEnv`**

Replace the entire file content:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
  readonly VITE_MAPBOX_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
cd /Users/admin/Documents/personal/water-refilling-station
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add env.d.ts
git commit -m "feat: declare VITE_SUPABASE_SERVICE_ROLE_KEY in env types"
```

---

### Task 2: Create service-role Supabase client

**Files:**
- Create: `src/helpers/supabaseAdmin.ts`

- [ ] **Step 1: Create the file**

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase service role environment variables');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/helpers/supabaseAdmin.ts
git commit -m "feat: add service-role Supabase client for auth.admin calls"
```

---

### Task 3: Create `src/services/users.ts`

**Files:**
- Create: `src/services/users.ts`

This file exposes `createUserAccount` — creates `auth.users` + `public.users` row, returns the new user's UUID.

- [ ] **Step 1: Create the file**

```ts
import { supabase } from '@/helpers/supabase';
import { supabaseAdmin } from '@/helpers/supabaseAdmin';
import type { UserRole } from '@/types/database';

export async function createUserAccount(params: {
  username: string;
  password: string;
  tenantId: string;
  branchId: string;
  fullName: string;
  role: UserRole;
}): Promise<string> {
  const email = `${params.username}@${params.tenantId}.internal`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: params.password,
    email_confirm: true,
  });

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      throw new Error('Username already taken — choose another.');
    }
    throw authError;
  }

  const userId = authData.user.id;

  const { error: insertError } = await supabase.from('users').insert({
    id: userId,
    tenant_id: params.tenantId,
    branch_id: params.branchId,
    full_name: params.fullName,
    role: params.role,
  });

  if (insertError) {
    console.error('Auth account created but users insert failed. Auth UID:', userId);
    throw insertError;
  }

  return userId;
}

```

- [ ] **Step 2: Verify type-check passes**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/users.ts
git commit -m "feat: add createUserAccount and hasUserAccount service functions"
```

---

### Task 4: Add `user_id` param to `createEmployee`

**Files:**
- Modify: `src/services/employees.ts:26-37`

`createEmployee` needs to accept `user_id` so the employee row is linked to the auth account on creation.

- [ ] **Step 1: Update `createEmployee` signature and call**

Replace:

```ts
export function createEmployee(data: {
  tenant_id: string;
  branch_id: string;
  full_name: string;
  phone?: string;
  hire_date?: string;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs?: number | null;
}) {
  return supabase.from('employees').insert(data).select().single();
}
```

With:

```ts
export function createEmployee(data: {
  tenant_id: string;
  branch_id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  hire_date?: string;
  role: UserRole;
  monthly_salary_centavos: number;
  daily_quota_jugs?: number | null;
}) {
  return supabase.from('employees').insert(data).select().single();
}
```

Also update `updateEmployee` to allow setting `user_id` on an existing employee (for future edits where account is created post-hoc). Replace:

```ts
export function updateEmployee(
  id: string,
  data: Partial<Pick<Employee, 'full_name' | 'phone' | 'hire_date' | 'monthly_salary_centavos' | 'daily_quota_jugs' | 'active'>>,
) {
  return supabase.from('employees').update(data).eq('id', id).select().single();
}
```

With:

```ts
export function updateEmployee(
  id: string,
  data: Partial<Pick<Employee, 'full_name' | 'phone' | 'hire_date' | 'monthly_salary_centavos' | 'daily_quota_jugs' | 'active' | 'user_id'>>,
) {
  return supabase.from('employees').update(data).eq('id', id).select().single();
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx vue-tsc --noEmit
```

Expected: no errors (the `employees/index.vue` save handler will error until Task 6, so fix that now or ignore until then).

- [ ] **Step 3: Commit**

```bash
git add src/services/employees.ts
git commit -m "feat: add user_id to createEmployee and updateEmployee param types"
```

---

### Task 5: Update `EmployeeFormModal.vue` with account section

**Files:**
- Modify: `src/components/Employee/EmployeeFormModal.vue`

Add username + password fields that appear for new employees and for existing employees without an account. Show a read-only "Account exists" badge when account already present.

The modal receives a new optional prop `hasAccount?: boolean` from the parent (parent calls `hasUserAccount` when opening edit modal). The `submit` emit payload gains an optional `account` field.

- [ ] **Step 1: Update the full component**

Replace the entire file with:

```vue
<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney, parseMoney } from '@/helpers/money';

const open = defineModel<boolean>('open', { required: true });

const { employee, saving, hasAccount } = defineProps<{
  employee?: Employee;
  saving?: boolean;
  hasAccount?: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      full_name: string;
      phone: string | undefined;
      hire_date: string | undefined;
      role: UserRole;
      monthly_salary_centavos: number;
      daily_quota_jugs: number | null;
      account?: { username: string; password: string };
    },
  ];
}>();

type FormState = {
  full_name: string;
  phone: string;
  hire_date: string;
  role: UserRole;
  monthly_salary_display: string;
  daily_quota_jugs: string;
  username: string;
  password: string;
};

const form = reactive<FormState>({
  full_name: '',
  phone: '',
  hire_date: '',
  role: 'rider',
  monthly_salary_display: '',
  daily_quota_jugs: '',
  username: '',
  password: '',
});

const roleOptions = [
  { label: 'Rider', value: 'rider' },
  { label: 'Cashier', value: 'cashier' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

const showAccountFields = computed(() => !hasAccount);

const usernameError = computed(() => {
  if (!form.username) return null;
  return /^[a-zA-Z0-9_.]{3,30}$/.test(form.username)
    ? null
    : 'Username must be 3–30 characters: letters, numbers, underscore, dot only.';
});

watch(
  () => open.value,
  (isOpen) => {
    if (!isOpen) return;

    if (employee) {
      form.full_name = employee.full_name;
      form.phone = employee.phone ?? '';
      form.hire_date = employee.hire_date ?? '';
      form.role = employee.role;
      form.monthly_salary_display = formatMoney(employee.monthly_salary_centavos);
      form.daily_quota_jugs = employee.daily_quota_jugs != null ? String(employee.daily_quota_jugs) : '';
    } else {
      form.full_name = '';
      form.phone = '';
      form.hire_date = '';
      form.role = 'rider';
      form.monthly_salary_display = formatMoney(0);
      form.daily_quota_jugs = '';
    }
    form.username = '';
    form.password = '';
  },
  { immediate: true },
);

function submit() {
  emit('submit', {
    full_name: form.full_name,
    phone: form.phone || undefined,
    hire_date: form.hire_date || undefined,
    role: form.role,
    monthly_salary_centavos: parseMoney(form.monthly_salary_display),
    daily_quota_jugs: form.daily_quota_jugs ? parseInt(form.daily_quota_jugs, 10) : null,
    account: showAccountFields.value ? { username: form.username, password: form.password } : undefined,
  });
}
</script>

<template>
  <BaseModal v-model:open="open" :title="employee ? 'Edit employee' : 'Add employee'">
    <form id="employee-form" class="space-y-4" @submit.prevent="submit">
      <BaseInput v-model="form.full_name" label="Full name" required />
      <BaseInput v-model="form.phone" label="Phone" type="tel" />
      <BaseDatePicker v-model="form.hire_date" label="Hire date" />
      <BaseSelect v-model="form.role" label="Role" :options="roleOptions" />
      <BaseInput v-model="form.monthly_salary_display" label="Monthly salary" placeholder="₱0.00" />
      <BaseInput v-model="form.daily_quota_jugs" label="Daily quota (jugs) — riders only" type="number" helper-text="Leave blank to use the tenant default" />

      <template v-if="showAccountFields">
        <div class="border-t pt-4">
          <p class="mb-3 text-sm font-medium text-casual-navy">App account</p>
          <p class="mb-3 text-xs text-oslo">Sets up login credentials for this employee.</p>
          <div class="space-y-3">
            <BaseInput
              v-model="form.username"
              label="Username"
              required
              :error="usernameError ?? undefined"
              helper-text="Short, simple — e.g. juan or dela_cruz"
            />
            <BaseInput v-model="form.password" label="Password" type="password" required minlength="8" />
          </div>
        </div>
      </template>
      <template v-else-if="employee">
        <div class="border-t pt-4 flex items-center gap-2">
          <p class="text-sm font-medium text-casual-navy">App account</p>
          <BaseBadge variant="success">Account exists</BaseBadge>
        </div>
      </template>
    </form>
    <template #footer>
      <BaseButton variant="independence" @click="open = false">Cancel</BaseButton>
      <BaseButton type="submit" form="employee-form" :loading="saving">Save</BaseButton>
    </template>
  </BaseModal>
</template>
```

- [ ] **Step 2: Verify type-check passes**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Employee/EmployeeFormModal.vue
git commit -m "feat: add username/password account section to EmployeeFormModal"
```

---

### Task 6: Update `employees/index.vue` save handler

**Files:**
- Modify: `src/pages/employees/index.vue`

The save handler must:
1. If `payload.account` is present: call `createUserAccount`, get back `userId`
2. Pass `user_id` into `createEmployee` or set it via `updateEmployee`
3. Pass `hasAccount` prop to `EmployeeFormModal` (check `employee.user_id` for edit, `false` for new)
4. Surface username-taken errors as a toast/alert

- [ ] **Step 1: Update the `<script setup>` section**

Replace the current `<script setup>` block:

```vue
<script setup lang="ts">
import type { Employee, UserRole } from '@/types/database';
import { formatMoney } from '@/helpers/money';
import IconEdit from '@/components/Icon/IconEdit.vue';
import IconTrash from '@/components/Icon/IconTrash.vue';

const auth = useAuthStore();
const { confirm } = useConfirm();
const { tenantId, branchId } = storeToRefs(auth);

const {
  data,
  loading,
  run: load,
} = useAsync(() => getEmployees(tenantId.value, branchId.value), {
  immediate: true,
  defaultValue: [],
  disableResetValue: true,
});

const employees = computed(() => data.value ?? []);

const modalOpen = ref(false);
const editingEmployee = ref<Employee>();
const saveError = ref<string>();

function openAdd() {
  editingEmployee.value = undefined;
  saveError.value = undefined;
  modalOpen.value = true;
}

function openEdit(e: Employee) {
  editingEmployee.value = e;
  saveError.value = undefined;
  modalOpen.value = true;
}

const hasAccount = computed(() => !!editingEmployee.value?.user_id);

const { loading: saving, run: save } = useAsync(
  async (payload: {
    full_name: string;
    phone: string | undefined;
    hire_date: string | undefined;
    role: UserRole;
    monthly_salary_centavos: number;
    daily_quota_jugs: number | null;
    account?: { username: string; password: string };
  }) => {
    saveError.value = undefined;
    let userId: string | undefined;

    if (payload.account) {
      try {
        userId = await createUserAccount({
          username: payload.account.username,
          password: payload.account.password,
          tenantId: tenantId.value,
          branchId: branchId.value,
          fullName: payload.full_name,
          role: payload.role,
        });
      } catch (err) {
        saveError.value = err instanceof Error ? err.message : 'Failed to create account.';
        return;
      }
    }

    if (editingEmployee.value) {
      await updateEmployee(editingEmployee.value.id, {
        full_name: payload.full_name,
        phone: payload.phone,
        hire_date: payload.hire_date,
        monthly_salary_centavos: payload.monthly_salary_centavos,
        daily_quota_jugs: payload.daily_quota_jugs,
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
        full_name: payload.full_name,
        phone: payload.phone,
        hire_date: payload.hire_date,
        role: payload.role,
        monthly_salary_centavos: payload.monthly_salary_centavos,
        daily_quota_jugs: payload.daily_quota_jugs,
      });
    }

    modalOpen.value = false;
    await load();
  },
);

function rowMenu(row: Employee) {
  return [
    { label: 'Edit', icon: IconEdit, onClick: () => openEdit(row) },
    {
      label: 'Delete',
      icon: IconTrash,
      danger: true,
      onClick: () =>
        confirm({
          title: 'Delete employee?',
          message: `Delete '${row.full_name}'?`,
          onConfirm: async () => {
            if (!auth.authUser) return;
            await softDeleteEmployee(row.id, auth.authUser.id);
            await load();
          },
        }),
    },
  ];
}
</script>
```

- [ ] **Step 2: Update the `<template>` to pass `hasAccount` and show `saveError`**

Replace the `<EmployeeFormModal>` line and add error display. The full template footer area should be:

```vue
    <EmployeeFormModal
      v-model:open="modalOpen"
      :employee="editingEmployee"
      :saving="saving"
      :has-account="hasAccount"
      @submit="save"
    />
    <p v-if="saveError" class="mt-2 text-sm text-blaze-red">{{ saveError }}</p>
```

Find this in the template:
```vue
    <EmployeeFormModal v-model:open="modalOpen" :employee="editingEmployee" :saving="saving" @submit="save" />
```

And replace it with:
```vue
    <EmployeeFormModal
      v-model:open="modalOpen"
      :employee="editingEmployee"
      :saving="saving"
      :has-account="hasAccount"
      @submit="save"
    />
    <p v-if="saveError" class="mt-2 text-sm text-blaze-red">{{ saveError }}</p>
```

- [ ] **Step 3: Verify type-check passes**

```bash
npx vue-tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/employees/index.vue
git commit -m "feat: wire up createUserAccount in employee save handler"
```

---

### Task 7: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test new employee creation**

1. Navigate to Employees page
2. Click "Add employee"
3. Fill in Full name, Role = Rider
4. In "App account" section: enter a username (e.g. `testjuan`) and password (min 8 chars)
5. Click Save
6. Verify employee appears in list
7. In Supabase Studio → Authentication → Users: confirm auth user `testjuan@<tenantId>.internal` exists
8. In Supabase Studio → Table Editor → `users`: confirm row with `role='rider'` exists
9. In Supabase Studio → Table Editor → `employees`: confirm `user_id` is populated

- [ ] **Step 3: Test duplicate username**

1. Add another employee with same username
2. Verify "Username already taken" error appears inline, employee is NOT created

- [ ] **Step 4: Test edit existing employee (account already exists)**

1. Click Edit on the employee created in Step 2
2. Verify "App account — Account exists" badge shows, no username/password fields
3. Edit the name, save — verify only the name changed

- [ ] **Step 5: Test Areas "Add area" → Primary rider dropdown**

1. Navigate to Areas → Add area
2. Verify the newly created rider appears in the "Primary rider" dropdown
