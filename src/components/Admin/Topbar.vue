<script setup lang="ts">
defineOptions({ name: 'AdminTopbar' });

const auth = useAuthStore();

const email = computed(() => auth.superadminEmail || auth.authUser?.email || 'Superadmin');
</script>

<template>
  <AppTopbar name="Superadmin" :email="email" />
</template>
