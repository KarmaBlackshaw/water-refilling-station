<script setup lang="ts">
import { ROUTES } from '@/constants/routes';
import { AUTH_BLOCK } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

function messageFor(error: { message: string }): string {
  if (error.message === AUTH_BLOCK.SUSPENDED) {
    return 'This account has been suspended. Please contact your provider.';
  }

  if (error.message === AUTH_BLOCK.EXPIRED) {
    return 'Your subscription has expired. Please contact your provider to renew.';
  }

  return 'Invalid email or password';
}

async function handleLogin() {
  if (!email.value || !password.value) {
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  const result = await auth.login(email.value, password.value);

  if (result.error) {
    errorMsg.value = messageFor(result.error);
  } else {
    router.push(auth.isSuperadmin ? ROUTES.ADMIN_CLIENTS : ROUTES.DASHBOARD);
  }

  loading.value = false;
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden">
    <TheWaterBlobBackground />

    <div class="relative z-10 w-full max-w-sm">
      <BaseCard padding="lg">
        <div class="mb-8 text-center">
          <h1 class="text-xl font-bold text-casual-navy">WRS Management</h1>
          <p class="mt-1 text-sm text-independence">Water Refilling Station</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <BaseInput v-model="email" label="Email" type="email" placeholder="admin@example.com" required />

          <BaseInput v-model="password" label="Password" type="password" placeholder="••••••••" required />

          <p v-if="errorMsg" class="text-sm text-blaze-red">{{ errorMsg }}</p>

          <BaseButton size="xl" type="submit" class="w-full" :loading="loading"> Sign in </BaseButton>
          <div class="text-center">
            <RouterLink to="/forgot-password" class="text-sm text-casual-navy hover:underline"> Forgot password? </RouterLink>
          </div>
        </form>
      </BaseCard>
    </div>
  </div>
</template>
