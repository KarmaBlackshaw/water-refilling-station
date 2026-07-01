<script setup lang="ts">
import { ROLE_OPTIONS, type EmployeeAccountForm, type EmployeeForm } from '@/constants/employee';
import { WEEKDAYS } from '@/constants/rider';

defineOptions({ name: 'EmployeeReviewTab' });

const { form, restDays, showAccount } = defineProps<{
  form: EmployeeForm;
  account: EmployeeAccountForm;
  restDays: Set<number>;
  showAccount?: boolean;
}>();

const initial = computed(() => form.full_name.trim().charAt(0).toUpperCase() || '?');

const roleLabel = computed(() => ROLE_OPTIONS.find((o) => o.value === form.role)?.label ?? form.role);

const restDaysLabel = computed(() => {
  const labels = WEEKDAYS.filter((d) => restDays.has(d.value)).map((d) => d.label);

  return labels.length ? labels.join(', ') : 'None';
});
</script>

<template>
  <div class="space-y-4">
    <BaseCard padding="none">
      <!-- Identity -->
      <div class="flex items-center gap-3 p-4">
        <div aria-hidden="true" class="flex size-12 flex-none items-center justify-center rounded-full bg-tampa/10 text-lg font-semibold text-tampa">
          {{ initial }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-base font-semibold text-casual-navy">{{ form.full_name.trim() || 'Unnamed employee' }}</p>
          <BaseBadge :variant="form.role === 'admin' ? 'info' : 'default'" size="sm" class="mt-1">{{ roleLabel }}</BaseBadge>
        </div>
      </div>

      <!-- Details -->
      <dl class="divide-y divide-sparkling-silver border-t border-sparkling-silver">
        <div class="flex items-start justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-oslo">Phone</dt>
          <dd class="text-right text-sm" :class="form.phone ? 'text-casual-navy num' : 'italic text-oslo'">
            {{ form.phone || 'Not provided' }}
          </dd>
        </div>
        <div class="flex items-start justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-oslo">Hire date</dt>
          <dd class="text-right text-sm" :class="form.hire_date ? 'text-casual-navy num' : 'italic text-oslo'">
            {{ form.hire_date || 'Not set' }}
          </dd>
        </div>
        <div class="flex items-start justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-oslo">Monthly salary</dt>
          <dd class="num text-right text-sm text-casual-navy">{{ form.monthly_salary_display || '₱0.00' }}</dd>
        </div>
        <div v-if="form.role === 'rider'" class="flex items-start justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-oslo">Daily quota (jugs)</dt>
          <dd class="text-right text-sm" :class="form.daily_quota_jugs ? 'text-casual-navy num' : 'italic text-oslo'">
            {{ form.daily_quota_jugs || 'Tenant default' }}
          </dd>
        </div>
        <div class="flex items-start justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-oslo">Rest days</dt>
          <dd class="text-right text-sm text-casual-navy">{{ restDaysLabel }}</dd>
        </div>
      </dl>
    </BaseCard>

    <!-- App account (new / account-less employees only) -->
    <BaseCard v-if="showAccount" padding="none">
      <div class="border-b border-sparkling-silver px-4 py-3">
        <p class="text-sm font-semibold text-casual-navy">App account</p>
      </div>
      <div class="flex items-start justify-between gap-4 px-4 py-3">
        <dt class="text-sm text-oslo">Username</dt>
        <dd class="text-right text-sm" :class="account.username ? 'text-casual-navy' : 'italic text-oslo'">
          {{ account.username || 'Not set' }}
        </dd>
      </div>
    </BaseCard>
  </div>
</template>
