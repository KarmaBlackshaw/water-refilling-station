<script setup lang="ts">
import { ROUTES } from '@/constants/routes';

const router = useRouter();
const auth = useAuthStore();

const password = ref('');
const confirm = ref('');
const errorMsg = ref('');
const loading = ref(false);

async function handleSubmit() {
  if (!password.value || !confirm.value) {
    return;
  }

  if (password.value !== confirm.value) {
    errorMsg.value = 'Passwords do not match';

    return;
  }

  if (password.value.length < 8) {
    errorMsg.value = 'Password must be at least 8 characters';

    return;
  }

  loading.value = true;
  errorMsg.value = '';

  const { error } = await auth.updatePassword(password.value);

  if (error) {
    errorMsg.value = 'Could not update password. The reset link may have expired.';
    loading.value = false;

    return;
  }

  await auth.logout();
  router.push(ROUTES.LOGIN);
}
</script>

<template>
  <div
    class="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-bright-chrome via-american-diamond to-sparkling-silver p-4"
  >
    <TheWaterBlobBackground />

    <div class="relative z-10 w-full max-w-sm">
      <BaseCard padding="lg">
        <div class="mb-8 text-center">
          <h1 class="text-xl font-bold text-casual-navy">Reset Password</h1>
          <p class="mt-1 text-sm text-independence">Enter your new password</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <BaseInput v-model="password" label="New password" type="password" placeholder="••••••••" required />
          <BaseInput v-model="confirm" label="Confirm password" type="password" placeholder="••••••••" required />
          <p v-if="errorMsg" class="text-sm text-blaze-red">{{ errorMsg }}</p>
          <BaseButton size="xl" type="submit" class="w-full" :loading="loading"> Update password </BaseButton>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
