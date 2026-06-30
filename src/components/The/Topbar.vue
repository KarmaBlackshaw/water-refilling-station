<script setup lang="ts">
const authStore = useAuthStore();

const displayEmail = computed(() => authStore.authUser?.email ?? '');
const displayName = computed(() => authStore.profile?.full_name ?? displayEmail.value.split('@')[0] ?? 'Admin');
</script>

<template>
  <AppTopbar :name="displayName" :email="displayEmail" />
</template>
