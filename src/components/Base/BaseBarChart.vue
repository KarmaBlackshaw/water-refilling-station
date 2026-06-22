<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps<{
  labels: string[];
  data: number[];
  title?: string;
  subtitle?: string;
  height?: number;
  highlightIndex?: number;
  tooltip?: { label: string; value: number | string; color: string }[];
  loading?: boolean;
}>();

interface BarChartRef {
  chart?: {
    canvas: HTMLCanvasElement;
    getDatasetMeta: (i: number) => { data: { x: number; y: number }[] };
  };
}

const chartRef = ref<BarChartRef | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipVisible = ref(false);

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      data: props.data,
      backgroundColor: (ctx: { dataIndex: number; chart: { ctx: CanvasRenderingContext2D; chartArea?: { top: number; bottom: number } } }) => {
        if (props.highlightIndex !== undefined && ctx.dataIndex === props.highlightIndex) {
          const chartArea = ctx.chart.chartArea;

          if (!chartArea) {
            return '#00C9F0';
          }

          const gradient = ctx.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

          gradient.addColorStop(0, '#0A0E1A');
          gradient.addColorStop(1, '#00C9F0');
          return gradient;
        }

        return 'rgba(0, 201, 240, 0.18)';
      },
      hoverBackgroundColor: '#00C9F0',
      borderRadius: 8,
      borderSkipped: false,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#94A3B8', font: { size: 11 } },
    },
    y: { display: false },
  },
}));

function placeTooltip() {
  if (props.highlightIndex === undefined || !props.tooltip || !chartRef.value?.chart || !wrapperRef.value) {
    tooltipVisible.value = false;
    return;
  }

  const meta = chartRef.value.chart.getDatasetMeta(0);
  const bar = meta?.data?.[props.highlightIndex];

  if (!bar) {
    tooltipVisible.value = false;
    return;
  }

  const canvas = chartRef.value.chart.canvas;
  const wrapperRect = wrapperRef.value.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const offsetX = canvasRect.left - wrapperRect.left;
  const offsetY = canvasRect.top - wrapperRect.top;

  tooltipX.value = offsetX + bar.x;
  tooltipY.value = offsetY + bar.y - 8;
  tooltipVisible.value = true;
}

onMounted(() => {
  nextTick(placeTooltip);
  window.addEventListener('resize', placeTooltip);
});

onUnmounted(() => {
  window.removeEventListener('resize', placeTooltip);
});

watch(
  () => [props.highlightIndex, props.data, props.labels, props.tooltip],
  () => nextTick(placeTooltip),
  { deep: true },
);
</script>

<template>
  <div>
    <div v-if="title || subtitle || $slots.action" class="mb-3 flex items-start justify-between">
      <div>
        <p v-if="title" class="text-sm font-semibold text-casual-navy">{{ title }}</p>
        <p v-if="subtitle" class="text-xs text-oslo">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </div>

    <div ref="wrapperRef" class="relative">
      <div :style="{ height: `${height ?? 200}px` }">
        <BaseSkeleton v-if="loading" rounded="lg" class="h-full w-full" />
        <Bar v-else ref="chartRef" :data="chartData" :options="chartOptions" />
      </div>

      <div
        v-if="tooltipVisible && tooltip"
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-casual-navy px-3 py-2 shadow-lg"
        :style="{ left: `${tooltipX}px`, top: `${tooltipY}px` }"
      >
        <div class="space-y-1">
          <div v-for="row in tooltip" :key="row.label" class="flex items-center gap-2 text-[10px]">
            <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: row.color }" />
            <span class="text-white/70">{{ row.label }}</span>
            <span class="num font-bold text-white">{{ row.value }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
