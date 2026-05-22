<script setup lang="ts">
import { ROUTES } from '@/constants/routes';

const auth = useAuthStore();

const email = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const loading = ref(false);

async function handleSubmit() {
  if (!email.value) {
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  const { error } = await auth.requestPasswordReset(email.value);

  if (error) {
    errorMsg.value = 'Could not send reset email. Try again.';
  } else {
    successMsg.value = 'Check your email for a reset link.';
  }

  loading.value = false;
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
          <h1 class="text-xl font-bold text-casual-navy">Forgot Password</h1>
          <p class="mt-1 text-sm text-independence">Enter your email to receive a reset link</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <BaseInput v-model="email" label="Email" type="email" placeholder="admin@example.com" required />
          <p v-if="errorMsg" class="text-sm text-blaze-red">{{ errorMsg }}</p>
          <p v-if="successMsg" class="text-sm text-dark-green-turquoise">{{ successMsg }}</p>
          <BaseButton size="xl" type="submit" class="w-full" :loading="loading"> Send reset link </BaseButton>
          <div class="text-center">
            <RouterLink :to="ROUTES.LOGIN" class="text-sm text-casual-navy hover:underline"> Back to login </RouterLink>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
