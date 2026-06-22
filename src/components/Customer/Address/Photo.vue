<script setup lang="ts">
defineOptions({ name: 'CustomerAddressPhoto' });

const { photoPath } = defineProps<{
  photoPath: string;
}>();

const photoUrl = computedAsync(() => getAddressPhotoUrl(photoPath));
</script>

<template>
  <img v-if="photoUrl" :src="photoUrl" alt="Address photo" class="size-12 rounded object-cover" />
</template>
