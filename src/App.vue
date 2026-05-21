<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue';
import { ROUTES } from '@/constants/routes';
const route = useRoute();
const publicPaths: string[] = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD];
const isPublic = computed(() => publicPaths.includes(route.path));
</script>

<template>
  <RouterView v-if="isPublic" />
  <MainLayout v-else />
</template>
