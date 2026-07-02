<script setup lang="ts">
import { parseMoney } from '@/helpers/money';

const auth = useAuthStore();
const tenant = useTenantStore();
const { success: toastSuccess, error: toastError } = useToast();

const form = reactive({
  staleness_days_delivery: '',
  staleness_days_walkin: '',
  booking_horizon_days: '',
  default_quota_jugs: '',
  commission: '',
});

const saving = ref(false);

onMounted(async () => {
  if (auth.tenantId && auth.branchId) {
    tenant.setContext(auth.tenantId, auth.branchId);
    await tenant.loadSettings();
    form.staleness_days_delivery = String(tenant.stalenessDaysDelivery);
    form.staleness_days_walkin = String(tenant.stalenessDaysWalkin);
    form.booking_horizon_days = String(tenant.bookingHorizonDays);
    form.default_quota_jugs = String(tenant.defaultQuotaJugs);
    form.commission = (tenant.commissionPerJugCentavos / 100).toFixed(2);
  }
});

async function saveAll() {
  saving.value = true;
  try {
    await tenant.saveSetting('staleness_days_delivery', form.staleness_days_delivery);
    await tenant.saveSetting('staleness_days_walkin', form.staleness_days_walkin);
    await tenant.saveSetting('booking_horizon_days', form.booking_horizon_days);
    await tenant.saveSetting('default_quota_jugs', form.default_quota_jugs);
    await tenant.saveSetting('commission_per_jug_centavos', String(parseMoney(form.commission)));
    toastSuccess('Settings saved');
  } catch {
    toastError('Failed to save settings');
  }
  saving.value = false;
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-casual-navy">Settings</h1>
        <p class="text-sm text-oslo">Configure tenant settings and preferences</p>
      </div>

      <BaseCard>
        <form class="space-y-5" @submit.prevent="saveAll">
          <div class="grid gap-5 grid-cols-2">
            <BaseInput
              v-model="form.staleness_days_delivery"
              label="Delivery staleness threshold (days)"
              type="number"
              helper-text="Show staleness chip after this many days since last delivery"
            />
            <BaseInput
              v-model="form.staleness_days_walkin"
              label="Walk-in staleness threshold (days)"
              type="number"
              helper-text="Show staleness chip after this many days since last walk-in"
            />
            <BaseInput
              v-model="form.booking_horizon_days"
              label="Booking materialization horizon (days)"
              type="number"
              helper-text="How many days ahead to materialize recurring bookings"
            />
            <BaseInput
              v-model="form.default_quota_jugs"
              label="Default rider quota (jugs/day)"
              type="number"
              helper-text="Used when no per-rider override is set"
            />
            <BaseInput
              v-model="form.commission"
              label="Commission per jug over quota"
              type="currency"
              placeholder="1.00"
              helper-text="Amount paid to rider for each jug above their daily quota"
            />
          </div>
          <div class="flex justify-end">
            <BaseButton type="submit" :loading="saving">Save settings</BaseButton>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
