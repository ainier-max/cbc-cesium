<template>
  <div class="page">
    <div class="toolbar">
      <h1>图表示例</h1>
    </div>

    <div class="chart-card">
      <div ref="chartRef" id="echartID" style="width: 100%; height: 100%"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import EchartClass from "./echartClass";
let echartClass=new EchartClass();

// ---- 静态模拟数据 ----
const START_TIME = "2025-01-01 00:00:00";
const END_TIME = "2025-01-03 00:00:00";

function generateMockData() {
  const data = [];
  const start = new Date(START_TIME).getTime();
  const end = new Date(END_TIME).getTime();
  const step = 30 * 60 * 1000;

  for (let t = start; t <= end; t += step) {
    const value = 20 + Math.sin(t / 3600000) * 5 + (Math.random() - 0.5) * 2;
    data.push([new Date(t).toISOString().replace("T", " ").slice(0, 19), +value.toFixed(2)]);
  }
  return data;
}

const mockChartData = generateMockData();
const chartRef = ref(null);
let chartInstance = null;
function initChart() {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  const seriesData = mockChartData.map((item) => ({
    name: item[0],
    value: [new Date(item[0]), item[1]],
  }));
  const { minVlaue: min, maxVlaue: max } = echartClass.getMaxAndMin([mockChartData.map((item) => item[1])]);

  chartInstance.setOption({
    tooltip: {
      trigger: "axis",
      valueFormatter: (v) => (typeof v === "number" ? v.toFixed(2) : v),
    },
    grid: { left: 60, right: 30, top: 30, bottom: 50 },
    toolbox: {
      // 隐藏图标，仅用于启用 dataZoom 功能
      iconStyle: {
        borderColor: "transparent",
        color: "transparent",
        emphasis: { borderColor: "transparent", color: "transparent" },
      },
      feature: {
        dataZoom: { show: true, yAxisIndex: "none" },
      },
    },
    xAxis: {
      type: "time",
      min: new Date(START_TIME),
      max: new Date(END_TIME),
      axisLabel: {
        color: "#ccc",
        formatter(value) {
          const d = new Date(value);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const mi = String(d.getMinutes()).padStart(2, "0");
          return `${mm}-${dd}\n${hh}:${mi}`;
        },
      },
    },
    yAxis: {
      type: "value",
      min,
      max,
      axisLabel: { color: "#ccc" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "传感器A - 温度",
        type: "line",
        data: seriesData,
      },
    ],
  });
  echartClass.useZoomTool(chartInstance, "echartID");
}

function handleResize() {
  chartInstance?.resize();
}

onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  background: #0e1621;
  color: #fff;
  padding: 20px;
  box-sizing: border-box;
}

.toolbar {
  margin-bottom: 16px;
}

.toolbar h1 {
  margin: 0 0 4px;
  font-size: 20px;
}

.chart-card {
  width: 100%;
  height: 350px;
  background-color: #1a222a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 10px;
  box-sizing: border-box;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}
</style>
