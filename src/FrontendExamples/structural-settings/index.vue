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
          <p>纯前端版本，保留断面参数编辑、测压管配置、剖面绘制和本地导出能力。</p>
        </div>
        <div class="toolbar-actions">
          <el-button @click="scene?.resetView()">重置视图</el-button>
        </div>
      </div>

      <div class="canvas-container" ref="canvasContainer">
        <canvas ref="damCanvas"></canvas>
        <div class="tooltip-box" ref="tooltip"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import StructuralSettingsPanel from "./leftPanel/index.vue";
import { STORAGE_KEY, cloneDefaults, createDefaultGlobalConfig, createDefaultSections } from "./defaults.js";
import { createStructuralScene } from "./scene.js";

const damCanvas = ref(null);
const canvasContainer = ref(null);
const tooltip = ref(null);

const globalConfig = reactive(createDefaultGlobalConfig());
const sections = ref(createDefaultSections());
const currentSectionId = ref(sections.value[0].id);

let scene = null;
let resizeObserver = null;

function applyStoredConfig(payload) {
  if (!payload) return;
  Object.assign(globalConfig, createDefaultGlobalConfig(), payload.globalConfig || {});
  const nextSections = Array.isArray(payload.sections) && payload.sections.length > 0
    ? payload.sections
    : createDefaultSections();
  sections.value = cloneDefaults(nextSections);
  const sectionExists = sections.value.some((item) => item.id === payload.currentSectionId);
  currentSectionId.value = sectionExists ? payload.currentSectionId : sections.value[0].id;
}

function syncGlobalAndDraw() {
  globalConfig.coreWallEnabled = globalConfig.material_type === "earth";
  globalConfig.drainElev = globalConfig.prism_top_elevation || 0;
  scene?.draw();
}

function switchSection() {
  scene?.draw();
}

function syncSectionData() {
  scene?.draw();
}

function addSection() {
  const nextId = Date.now();
  sections.value.push({
    id: nextId,
    name: `断面 ${String(sections.value.length + 1).padStart(2, "0")}`,
    localLevel: null,
    sensors: []
  });
  currentSectionId.value = nextId;
  nextTick(() => {
    scene?.resetView();
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
  scene?.draw();
}

function removeSensor(index) {
  const currentSection = sections.value.find((item) => item.id === currentSectionId.value);
  if (!currentSection) return;
  currentSection.sensors.splice(index, 1);
  scene?.draw();
}

function saveConfig() {
  const payload = {
    globalConfig: cloneDefaults(globalConfig),
    sections: cloneDefaults(sections.value),
    currentSectionId: currentSectionId.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  ElMessage.success("已保存到本地浏览器缓存");
}

function exportConfig() {
  const payload = {
    globalConfig: cloneDefaults(globalConfig),
    sections: cloneDefaults(sections.value)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
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
  sections.value = createDefaultSections();
  currentSectionId.value = sections.value[0].id;
  localStorage.removeItem(STORAGE_KEY);
  nextTick(() => {
    scene?.resetView();
  });
  ElMessage.success("已恢复默认配置");
}

function initScene() {
  if (!damCanvas.value || !canvasContainer.value || !tooltip.value) return;
  scene?.destroy?.();
  scene = createStructuralScene({
    canvas: damCanvas.value,
    container: canvasContainer.value,
    tooltip: tooltip.value,
    getGlobalConfig: () => globalConfig,
    getSections: () => sections.value,
    getCurrentSectionId: () => currentSectionId.value
  });
  scene.resizeCanvas();
  scene.resetView();
}

watch(
  () => globalConfig.material_type,
  (value) => {
    globalConfig.coreWallEnabled = value === "earth";
    syncGlobalAndDraw();
  }
);

watch(
  [sections, currentSectionId],
  () => {
    scene?.draw();
  },
  { deep: true }
);

watch(
  globalConfig,
  () => {
    scene?.draw();
  },
  { deep: true }
);

onMounted(() => {
  const storedRaw = localStorage.getItem(STORAGE_KEY);
  if (storedRaw) {
    try {
      applyStoredConfig(JSON.parse(storedRaw));
    } catch (error) {
      console.error("Failed to parse structural-settings cache", error);
    }
  }

  nextTick(() => {
    initScene();
    resizeObserver = new ResizeObserver(() => {
      scene?.resizeCanvas();
      scene?.resetView();
    });
    resizeObserver.observe(canvasContainer.value);
  });
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  scene?.destroy?.();
  scene = null;
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
