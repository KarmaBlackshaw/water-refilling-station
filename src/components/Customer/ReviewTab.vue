<script setup lang="ts">
import { CUSTOMER_TYPE_OPTIONS, type CustomerForm } from '@/constants/customer';

defineOptions({ name: 'CustomerReviewTab' });

const { form, isEdit, addressSummary } = defineProps<{
  form: CustomerForm;
  isEdit?: boolean;
  addressSummary?: string;
  addressLabel?: string;
}>();

const typeLabel = computed(() => CUSTOMER_TYPE_OPTIONS.find((o) => o.value === form.type)?.label ?? form.type);

const initial = computed(() => form.name.trim().charAt(0).toUpperCase() || '?');
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
          <p class="truncate text-base font-semibold text-casual-navy">{{ form.name.trim() || 'Unnamed customer' }}</p>
          <BaseBadge :variant="form.type === 'commercial' ? 'info' : 'default'" size="sm" class="mt-1">{{ typeLabel }}</BaseBadge>
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
        <div v-if="form.notes" class="px-4 py-3">
          <dt class="mb-1 text-sm text-oslo">Notes</dt>
          <dd class="text-sm whitespace-pre-line text-casual-navy">{{ form.notes }}</dd>
        </div>
      </dl>
    </BaseCard>

    <!-- Default address (new customer only) -->
    <BaseCard v-if="!isEdit" padding="none">
      <div class="border-b border-sparkling-silver px-4 py-3">
        <p class="text-sm font-semibold text-casual-navy">Default address</p>
      </div>
      <div class="px-4 py-3">
        <template v-if="addressSummary">
          <p class="text-sm text-casual-navy">{{ addressSummary }}</p>
          <p v-if="addressLabel" class="mt-0.5 text-xs text-oslo">{{ addressLabel }}</p>
        </template>
        <p v-else class="text-sm italic text-oslo">No address added — you can add one later from the customer profile.</p>
      </div>
    </BaseCard>
  </div>
</template>
