<script setup lang="ts"></script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-american-diamond p-4">
    <div class="w-full max-w-sm">
      <!-- Logo/brand area -->
      <div class="mb-8 text-center">
        <h1 class="text-xl font-bold text-casual-navy">WRS Management</h1>
        <p class="mt-1 text-sm text-independence">Water Refilling Station</p>
      </div>
      <slot />
    </div>
  </div>
</template>
