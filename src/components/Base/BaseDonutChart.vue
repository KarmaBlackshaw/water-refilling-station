<script setup lang="ts">
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

const props = defineProps<{
  segments: { label: string; value: number; color: string }[];
  title?: string;
  centerLabel?: string;
}>();

const chartData = computed(() => ({
  labels: props.segments.map((s) => s.label),
  datasets: [
    {
      data: props.segments.map((s) => s.value),
      backgroundColor: props.segments.map((s) => s.color),
      borderWidth: 0,
      hoverOffset: 4,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
};
</script>

<template>
  <div>
    <p v-if="title" class="mb-2 text-sm font-semibold text-casual-navy">{{ title }}</p>
    <div class="flex items-center gap-4">
      <div class="relative shrink-0" style="width: 80px; height: 80px">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div v-if="centerLabel" class="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-casual-navy">
          {{ centerLabel }}
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <div v-for="seg in props.segments" :key="seg.label" class="flex items-center gap-2 text-xs text-independence">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: seg.color }" />
          <span>{{ seg.label }} ({{ seg.value }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
