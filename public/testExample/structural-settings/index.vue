<template>
  <div style="width: 100%">
    <div style="width: 100%; height: 800px; overflow-y: hidden;margin-bottom: 80px;">
      <div style="padding-top: 15px; display: flex; height: 800px; ">
        <LeftPanel v-model:currentSectionId="currentSectionId" :globalConfig="globalConfig" :sections="sections"
          @syncGlobalAndDraw="syncGlobalAndDraw" @switchSection="switchSection" @addSection="addSection"
          @syncSectionData="syncSectionData" @removeSensor="removeSensor" @addSensor="addSensor"
          @draw="syncSectionData" />

        <div class="main-content">
          <div class="canvas-container" ref="canvasContainer">
            <canvas ref="damCanvas"></canvas>
            <div id="tooltip" class="tooltip-box" ref="tooltip"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import LeftPanel from './leftPanel/index.vue';
import PlineClass from '@/components/views/screen/CommonComponent/Class/PlineClass.js';
import { getReservoirConfig, exportReservoirConfig } from '@/api/systemSettings/index.js'; // 导入导出接口

const globalConfig = reactive({
  reservoir_water_level: 45.0,
  dam_top_elevation: 50,
  dam_bottom_elevation: 10,
  dam_top_width: 8,
  upstream_slope: 2.5,
  downstream_slope: 2.2,
  core_top_elevation: 48,
  core_top_width: 4,
  core_bottom_width: 12,
  core_permeability_coefficient: 1.0e-5,
  material_type: 'earth',
  permeability_coefficient: 1.0e-7,
  prism_top_elevation: 18,
  prism_top_width: 4,
  prism_slope: 1.5,
  step_height: 8,
  step_width: 2,
  coreWallEnabled: true,
  drainElev: 18,
  prism_inner_slope: 0.6
});

const sections = ref([{
  id: 1,
  name: "断面 01",
  localLevel: null,
  sensors: [
    { id: 'P1', x: 10, bottom: 12, water: 43.5 },
    { id: 'P2', x: 20, bottom: 20, water: 39.5 },
    { id: 'P3', x: 40, bottom: 18, water: 22.1 },
    { id: 'P4', x: 50, bottom: 11, water: 16.5 }
  ]
}]);

const currentSectionId = ref(1);
const damCanvas = ref(null);
const canvasContainer = ref(null);
const tooltip = ref(null);
let plineInstance = null;

// 添加导出状态
const exportLoading = ref(false);

// 同步全局配置并重绘
const syncGlobalAndDraw = () => {
  if (plineInstance) {
    // 更新 PlineClass 的 globalConfig
    plineInstance.globalConfig.coreWallEnabled = globalConfig.material_type === 'earth';
    plineInstance.globalConfig.drainElev = globalConfig.prism_top_elevation || 0;
    Object.assign(plineInstance.globalConfig, globalConfig);
    plineInstance.updateAndDraw();
  }
};

// 切换断面
const switchSection = () => {
  if (plineInstance) {
    plineInstance.switchSection(currentSectionId.value);
  }
};

// 同步断面数据并重绘
const syncSectionData = () => {
  if (plineInstance) {
    plineInstance.updateAndDraw();
  }
};

// 监听 material_type 变化，自动更新 coreWallEnabled
watch(() => globalConfig.material_type, (newVal) => {
  globalConfig.coreWallEnabled = newVal === 'earth';
  syncGlobalAndDraw();
});

// 添加断面
const addSection = () => {
  const id = Date.now();
  sections.value.push({
    id,
    name: "断面 " + (sections.value.length + 1).toString().padStart(2, '0'),
    localLevel: null,
    sensors: []
  });
  currentSectionId.value = id;
  nextTick(() => {
    if (plineInstance) {
      // 必须先切换 PlineClass 内部的当前断面引用
      plineInstance.switchSection(currentSectionId.value);
      plineInstance.updateAndDraw(); // 强制重绘
      plineInstance.resetView();     // 重置视图位置
    }
  });
};

// 添加传感器
const addSensor = () => {
  const currentSection = sections.value.find(s => s.id === currentSectionId.value);
  if (currentSection) {
    currentSection.sensors.push({
      id: 'P' + (currentSection.sensors.length + 1),
      x: 0,
      bottom: 15,
      water: 25
    });
    if (plineInstance) {
      plineInstance.updateAndDraw();
    }
  }
};

// 删除传感器
const removeSensor = (index) => {
  const currentSection = sections.value.find(s => s.id === currentSectionId.value);
  if (currentSection) {
    currentSection.sensors.splice(index, 1);
    if (plineInstance) {
      plineInstance.updateAndDraw();
    }
  }
};

// 初始化 PlineClass
const initPlineClass = () => {
  if (!damCanvas.value || !canvasContainer.value || !tooltip.value) return;

  // 设置元素 ID（PlineClass 需要通过 ID 获取元素）
  damCanvas.value.id = 'structural-settings-canvas';
  canvasContainer.value.id = 'structural-settings-container';
  tooltip.value.id = 'structural-settings-tooltip';

  // 创建 PlineClass 实例
  plineInstance = new PlineClass(
    'structural-settings-canvas',
    'structural-settings-container',
    'structural-settings-tooltip'
  );

  // 初始化配置
  plineInstance.init({
    sections: sections.value,
    globalConfig: {
      ...globalConfig,
      coreWallEnabled: globalConfig.material_type === 'earth',
      drainElev: globalConfig.prism_top_elevation || 0
    }
  });
};

// 窗口大小调整处理
const handleResize = () => {
  if (plineInstance) {
    plineInstance.resizeCanvas();
  }
};

onMounted(() => {
  nextTick(() => {
    initPlineClass();
    window.addEventListener('resize', handleResize);

    // 获取水库配置数据
    getReservoirConfig({}).then(res => {
      console.log("getReservoirConfig", res);
      if (res && res.data) {
        const data = res.data;

        // 1. 回显全局配置
        if (data.dam_geometry) {
          const g = data.dam_geometry;
          // 材质类型映射 (后端中文 -> 前端英文key)
          const materialReverseMap = {
            '土石坝 (含防渗心墙)': 'earth',
            '粘土均质坝': 'clay'
          };
          const matType = materialReverseMap[g.material_type] || 'earth';

          // 合并到 globalConfig (保留原有响应式对象引用)
          Object.assign(globalConfig, {
            ...g,
            material_type: matType,
            coreWallEnabled: matType === 'earth',
            // 确保排水棱体参数存在
            prism_inner_slope: g.prism_inner_slope !== undefined ? g.prism_inner_slope : globalConfig.prism_inner_slope,
            prism_top_elevation: g.prism_top_elevation !== undefined ? g.prism_top_elevation : globalConfig.prism_top_elevation,
            prism_top_width: g.prism_top_width !== undefined ? g.prism_top_width : globalConfig.prism_top_width,
            prism_slope: g.prism_slope !== undefined ? g.prism_slope : globalConfig.prism_slope,
            step_height: g.step_height !== undefined ? g.step_height : globalConfig.step_height,
            step_width: g.step_width !== undefined ? g.step_width : globalConfig.step_width,
            core_permeability_coefficient: g.core_permeability_coefficient !== undefined ? g.core_permeability_coefficient : globalConfig.core_permeability_coefficient,
          });
        }

        // 2. 回显断面及测管数据
        if (data.sections && Array.isArray(data.sections)) {
          const newSections = data.sections.map((s, index) => ({
            id: s.section_id || (index + 1), // 如果后端没返回id，临时用索引
            name: s.section_name || `断面 ${index + 1}`,
            localLevel: s.local_reservoir_water_level,
            sensors: (s.piezometers || []).map(p => ({
              id: p.sensor_id,
              x: p.x_distance,
              bottom: p.bottom_elevation,
              //water: p.water_level
              water: p.bottom_elevation
            }))
          }));

          sections.value = newSections;
          console.info("sections", sections.value);

          // 如果有数据，默认选中第一个
          if (sections.value.length > 0) {
            currentSectionId.value = sections.value[0].id;
          } else {
            sections.value.push({
              id: Date.now(),
              name: "默认断面",
              localLevel: null,
              sensors: []
            });
            currentSectionId.value = sections.value[0].id;
          }
        }

        // 3. 更新 PlineClass 实例数据并重绘
        syncGlobalAndDraw();
        if (plineInstance) {
          plineInstance.sections = sections.value;
          plineInstance.switchSection(currentSectionId.value);
        }
      }
    }).catch(err => {
      console.error("Failed to fetch reservoir config:", err);
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

</script>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #cbd5e1;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #cbd5e1;
}

canvas {
  display: block;
  cursor: grab;
}

.tooltip-box {
  position: absolute;
  display: none;
  background: rgba(15, 23, 42, 0.95);
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 100;
}

.export-btn-container {
  z-index: 999;
}
</style>