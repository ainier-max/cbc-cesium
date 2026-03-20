<template>
  <div class="page">
    <StructuralSettingsPanel
      v-model:currentSectionId="currentSectionId"
      :globalConfig="globalConfig"
      :sections="sections"
      @syncGlobalAndDraw="syncGlobalAndDraw"
      @switchSection="switchSection"
      @addSection="addSection"
      @syncSectionData="syncSectionData"
      @removeSensor="removeSensor"
      @addSensor="addSensor"
      @draw="syncSectionData"
      @saveConfig="saveConfig"
      @exportConfig="exportConfig"
      @resetConfig="resetConfig"
    />

    <div class="main-content">
      <div class="toolbar">
        <div>
          <h1>坝体断面建模</h1>
          <p>基于 PlineClass 的前端示例，保留断面参数编辑、测压管配置和本地配置管理能力。</p>
        </div>
        <div class="toolbar-actions">
          <el-button @click="plineInstance?.resetView()">重置视图</el-button>
        </div>
      </div>

      <div
        id="structural-settings-container"
        ref="canvasContainer"
        class="canvas-container"
      >
        <canvas
          id="structural-settings-canvas"
          ref="damCanvas"
        ></canvas>
        <div
          id="structural-settings-tooltip"
          ref="tooltip"
          class="tooltip-box"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import StructuralSettingsPanel from "./leftPanel/index.vue";
import PlineClass from "./class/PlineClass.js";
import {
  STORAGE_KEY,
  cloneDefaults,
  createDefaultGlobalConfig,
  createDefaultSections
} from "./defaults.js";

const damCanvas = ref(null);
const canvasContainer = ref(null);
const tooltip = ref(null);

const globalConfig = reactive(createDefaultGlobalConfig());
const sections = ref(createDefaultSections());
const currentSectionId = ref(sections.value[0]?.id ?? null);

let plineInstance = null;
let resizeObserver = null;

function normalizeGlobalConfig() {
  globalConfig.coreWallEnabled = globalConfig.material_type === "earth";
  globalConfig.drainElev = globalConfig.prism_top_elevation || 0;
}

function syncInstanceData() {
  if (!plineInstance) return;
  normalizeGlobalConfig();
  plineInstance.globalConfig = globalConfig;
  plineInstance.sections = sections.value;
}

function applyStoredConfig(payload) {
  if (!payload) return;

  Object.assign(globalConfig, createDefaultGlobalConfig(), payload.globalConfig || {});
  normalizeGlobalConfig();

  const nextSections = Array.isArray(payload.sections) && payload.sections.length > 0
    ? payload.sections
    : createDefaultSections();

  sections.value = cloneDefaults(nextSections);

  const storedSectionId = payload.currentSectionId;
  const hasStoredSection = sections.value.some((item) => item.id === storedSectionId);
  currentSectionId.value = hasStoredSection ? storedSectionId : sections.value[0]?.id ?? null;
}

function buildPayload() {
  return {
    globalConfig: cloneDefaults(globalConfig),
    sections: cloneDefaults(sections.value),
    currentSectionId: currentSectionId.value
  };
}

function syncGlobalAndDraw() {
  syncInstanceData();
  plineInstance?.updateAndDraw();
}

function switchSection(sectionId = currentSectionId.value) {
  if (sectionId !== undefined && sectionId !== null) {
    currentSectionId.value = sectionId;
  }
  syncInstanceData();
  if (currentSectionId.value !== undefined && currentSectionId.value !== null) {
    plineInstance?.switchSection(currentSectionId.value);
  }
}

function syncSectionData() {
  syncInstanceData();
  plineInstance?.updateAndDraw();
}

function addSection() {
  const nextId = Date.now();
  sections.value = [
    ...sections.value,
    {
      id: nextId,
      name: `断面 ${String(sections.value.length + 1).padStart(2, "0")}`,
      localLevel: null,
      sensors: []
    }
  ];
  currentSectionId.value = nextId;

  nextTick(() => {
    syncInstanceData();
    plineInstance?.switchSection(nextId);
  });
}

function addSensor() {
  const currentSection = sections.value.find((item) => item.id === currentSectionId.value);
  if (!currentSection) return;

  currentSection.sensors.push({
    id: `P${currentSection.sensors.length + 1}`,
    x: 0,
    bottom: 15,
    water: 25
  });

  syncSectionData();
}

function removeSensor(index) {
  const currentSection = sections.value.find((item) => item.id === currentSectionId.value);
  if (!currentSection) return;

  currentSection.sensors.splice(index, 1);
  syncSectionData();
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPayload()));
  ElMessage.success("已保存到本地浏览器缓存");
}

function exportConfig() {
  const payload = {
    globalConfig: cloneDefaults(globalConfig),
    sections: cloneDefaults(sections.value)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "structural-settings.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetConfig() {
  Object.assign(globalConfig, createDefaultGlobalConfig());
  normalizeGlobalConfig();
  sections.value = createDefaultSections();
  currentSectionId.value = sections.value[0]?.id ?? null;
  localStorage.removeItem(STORAGE_KEY);

  nextTick(() => {
    syncInstanceData();
    if (currentSectionId.value !== undefined && currentSectionId.value !== null) {
      plineInstance?.switchSection(currentSectionId.value);
    } else {
      plineInstance?.resetView();
    }
  });

  ElMessage.success("已恢复默认配置");
}

function initPlineClass() {
  if (!damCanvas.value || !canvasContainer.value || !tooltip.value) return;

  plineInstance?.destroy?.();
  normalizeGlobalConfig();

  plineInstance = new PlineClass(
    "structural-settings-canvas",
    "structural-settings-container",
    "structural-settings-tooltip"
  );

  plineInstance.init({
    sections: sections.value,
    globalConfig
  });

  if (currentSectionId.value !== undefined && currentSectionId.value !== null) {
    plineInstance.switchSection(currentSectionId.value);
  }
}

watch(
  () => globalConfig.material_type,
  () => {
    syncGlobalAndDraw();
  }
);

onMounted(() => {
  const storedRaw = localStorage.getItem(STORAGE_KEY);
  if (storedRaw) {
    try {
      applyStoredConfig(JSON.parse(storedRaw));
    } catch (error) {
      console.error("Failed to parse structural-settings cache", error);
    }
  } else {
    normalizeGlobalConfig();
  }

  nextTick(() => {
    initPlineClass();
    resizeObserver = new ResizeObserver(() => {
      plineInstance?.resizeCanvas(false);
      plineInstance?.resetView();
    });
    if (canvasContainer.value) {
      resizeObserver.observe(canvasContainer.value);
    }
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  plineInstance?.destroy?.();
  plineInstance = null;
});
</script>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  display: flex;
  background: #e2e8f0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  background: rgba(248, 250, 252, 0.92);
  border-bottom: 1px solid #cbd5e1;
}

.toolbar h1 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #0f172a;
}

.toolbar p {
  margin: 0;
  font-size: 13px;
  color: #475569;
}

.canvas-container {
  position: relative;
  flex: 1;
  min-height: 0;
  background: linear-gradient(180deg, #dbeafe 0%, #bfdbfe 45%, #e2e8f0 100%);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

.tooltip-box {
  position: absolute;
  display: none;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.94);
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
}
</style>
