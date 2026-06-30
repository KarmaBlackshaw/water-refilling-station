<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ROUTES } from '@/constants/routes';
const route = useRoute();
const publicPaths: string[] = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD];
const isPublic = computed(() => publicPaths.includes(route.path));
const isAdmin = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <RouterView v-if="isPublic" />
  <AdminLayout v-else-if="isAdmin" />
  <MainLayout v-else />
</template>
