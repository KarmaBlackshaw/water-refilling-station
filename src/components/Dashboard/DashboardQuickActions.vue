<script setup lang="ts">
import { ROUTES } from '@/constants/routes';

const router = useRouter();
</script>

<template>
  <div>
    <p class="mb-2 text-[10px] font-bold uppercase tracking-widest text-casual-navy">Quick Actions</p>
    <div class="flex flex-col gap-1.5">
      <BaseButton variant="tampa" class="w-full justify-start" @click="router.push(ROUTES.SALES)"> + New Sale </BaseButton>
      <BaseButton variant="independence" class="w-full justify-start" @click="router.push(ROUTES.BOOKINGS)"> + Add Booking </BaseButton>
      <BaseButton variant="independence" class="w-full justify-start" @click="router.push(ROUTES.EXPENSES)"> + Log Expense </BaseButton>
      <BaseButton variant="independence" class="w-full justify-start" @click="router.push(ROUTES.DELIVERIES)"> → View Deliveries </BaseButton>
    </div>
  </div>
</template>
