<template>
  <div class="fluid-container">
    <div id="sceneContainer" ref="sceneContainerRef"></div>

    <!-- 控制面板 -->
    <div class="toolbar">
      <div style="margin-bottom: 10px;">
        <button @click="onSetBoundary" style="padding: 5px 10px; cursor: pointer; width: 190px;">设置渲染边界</button>
      </div>
      <table>
        <tbody>
          <tr>
            <td>水扩散速度</td>
            <td>
              <input type="number" size="5" step="0.001" min="0" max="1" style="width: 80px;"
                v-model.number="param4" @input="updateParams" />
            </td>
          </tr>
          <tr>
            <td>水源半径</td>
            <td>
              <input type="number" size="5" step="0.001" min="0" max="0.2" style="width: 80px;"
                v-model.number="waterSourceRadius" @input="updateParams" />
            </td>
          </tr>
          <tr>
            <td>水深颜色强度</td>
            <td>
              <input type="number" size="5" step="0.01" min="0" max="2" style="width: 80px;"
                v-model.number="waterDepthColorIntensity" @input="updateParams" />
            </td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top: 10px;">
        <label>
          <input type="checkbox" v-model="allowFlowOut" @change="onAllowFlowOutChange" />
          允许水流出边界
        </label>
      </div>
      <div style="margin-top: 10px;">
        <label>
          <input type="checkbox" v-model="continuousFlow" @change="onContinuousFlowChange" />
          持续出水
        </label>
      </div>
      <div style="margin-top: 5px;">
        <label>流量(m³/s):</label>
        <input type="number" v-model.number="flowRate" step="10000" min="0" max="999999999"
          style="width: 100px;" @input="onFlowRateChange" />
      </div>
    </div>

    <!-- 水体信息面板 -->
    <div class="info-panel">
      <div class="panel-title">水体信息</div>
      <div>总水量: <span>{{ totalVolume.toFixed(2) }}</span> m³</div>
      <div style="margin-top: 5px;">鼠标位置水深: <span>{{ waterDepthDisplay }}</span> m</div>
    </div>

    <!-- 水深图例 -->
    <div class="legend">
      <div class="legend-title">水深图例</div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgb(0, 102, 230);"></div>
        <div class="legend-label">浅水 <span>{{ depthRanges[0] }}</span></div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgb(230, 230, 51);"></div>
        <div class="legend-label">中浅 <span>{{ depthRanges[1] }}</span></div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgb(255, 128, 0);"></div>
        <div class="legend-label">中深 <span>{{ depthRanges[2] }}</span></div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: rgb(230, 0, 0);"></div>
        <div class="legend-label">深水 <span>{{ depthRanges[3] }}</span></div>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载地形数据，请稍候...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { FluidRenderer } from './js/FluidRenderer.js';
import { atmosphereFs } from './js/shaders.js';

// ---- refs ----
const sceneContainerRef = ref(null);

// ---- reactive state ----
const loading = ref(false);
const totalVolume = ref(0);
const waterDepthDisplay = ref('--');
const depthRanges = ref(['0-0.03m', '0.03-0.07m', '0.07-0.10m', '>0.10m']);

// toolbar params
const param4 = ref(0.1);
const waterSourceRadius = ref(0.02);
const waterDepthColorIntensity = ref(1.0);
const allowFlowOut = ref(false);
const continuousFlow = ref(true);
const flowRate = ref(10000000);

let viewer = null;
let waterFluid = null;
let waterSourceHandler = null;
let volumeTimer = null;

// ---- helpers ----
function createSkyEffect() {
  return new Cesium.PostProcessStage({ fragmentShader: atmosphereFs });
}

function updateLegend(intensity) {
  const heightScale = 1000;
  const factor = intensity * 10.0;
  const depth1 = (0.33 / factor * heightScale).toFixed(2);
  const depth2 = (0.66 / factor * heightScale).toFixed(2);
  const depth3 = (1.0 / factor * heightScale).toFixed(2);
  depthRanges.value = [
    `0-${depth1}m`,
    `${depth1}-${depth2}m`,
    `${depth2}-${depth3}m`,
    `>${depth3}m`
  ];
}

function updateParams() {
  if (!waterFluid) return;
  waterFluid._waterSourceStrength = Number(param4.value);
  waterFluid._waterSourceRadius = Number(waterSourceRadius.value);
  waterFluid._waterDepthColorIntensity = Number(waterDepthColorIntensity.value);
  updateLegend(waterFluid._waterDepthColorIntensity);
}

function onAllowFlowOutChange() {
  if (waterFluid) waterFluid._allowFlowOut = allowFlowOut.value;
}

function onContinuousFlowChange() {
  if (!waterFluid) return;
  waterFluid._continuousFlow = continuousFlow.value;
  if (continuousFlow.value) {
    waterFluid._continuousFlowStartTime = performance.now() / 1000;
  } else {
    waterFluid._continuousSourcePos = new Cesium.Cartesian2(-1, -1);
    waterFluid._continuousFlowStartTime = 0;
  }
}

function onFlowRateChange() {
  if (!waterFluid) return;
  waterFluid._flowRate = flowRate.value;
  waterFluid._waterSourceStrength = flowRate.value;
}

async function onSetBoundary() {
  if (waterFluid) return;
  let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(async (movement) => {
    let cartesian = viewer.scene.pickPosition(movement.position);
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    let lon = Cesium.Math.toDegrees(cartographic.longitude);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);

    const boundaryWidth = 10000;
    const boundaryHeight = 10000;

    loading.value = true;

    const sampleSize = 64;
    const positions = [];
    for (let i = 0; i < sampleSize; i++) {
      for (let j = 0; j < sampleSize; j++) {
        const offsetX = (i / (sampleSize - 1) - 0.5) * boundaryWidth;
        const offsetY = (j / (sampleSize - 1) - 0.5) * boundaryHeight;
        positions.push(Cesium.Cartographic.fromDegrees(
          lon + offsetX / 111320,
          lat + offsetY / 110540
        ));
      }
    }

    try {
      await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions);
      await viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, boundaryHeight * 2),
        duration: 0.1,
        orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 }
      });
      await new Promise(resolve => {
        const checkTiles = () => {
          if (viewer.scene.globe.tilesLoaded) resolve();
          else setTimeout(checkTiles, 100);
        };
        checkTiles();
      });
    } catch (error) {
      console.warn('地形数据加载失败，将使用当前可用数据:', error);
    } finally {
      loading.value = false;
    }

    waterFluid = new FluidRenderer(viewer, {
      lonLat: [lon, lat],
      width: 1024,
      height: 1024,
      dimensions: new Cesium.Cartesian3(boundaryWidth, boundaryHeight, 1000),
      minHeight: 0,
      maxHeight: 1000
    });

    waterFluid._continuousFlowStartTime = performance.now() / 1000;

    // 订阅总水量更新
    volumeTimer = setInterval(() => {
      if (waterFluid) totalVolume.value = waterFluid._updateTotalVolume();
    }, 1000);

    // 鼠标点击添加水源
    waterSourceHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    waterSourceHandler.setInputAction((movement) => {
      if (waterFluid._continuousFlow) {
        const cartesian = viewer.scene.pickPosition(movement.position);
        if (Cesium.defined(cartesian)) {
          const center = Cesium.Cartesian3.fromDegrees(...waterFluid.config.lonLat, 0);
          const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
          const inverseEnu = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4());
          const localPos = Cesium.Matrix4.multiplyByPoint(inverseEnu, cartesian, new Cesium.Cartesian3());
          const normalizedU = (localPos.x / waterFluid.config.dimensions.x) + 0.5;
          const normalizedV = 1.0 - ((localPos.y / waterFluid.config.dimensions.y) + 0.5);
          waterFluid._continuousSourcePos = new Cesium.Cartesian2(normalizedU, normalizedV);
          waterFluid._continuousFlowStartTime = performance.now() / 1000;
        }
      } else {
        waterFluid.addWaterSource(movement.position);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动显示水深（节流）
    let lastMouseMoveTime = 0;
    waterSourceHandler.setInputAction((movement) => {
      const now = Date.now();
      if (now - lastMouseMoveTime < 100) return;
      lastMouseMoveTime = now;
      try {
        const depth = waterFluid.getWaterDepthAtScreen(movement.endPosition);
        waterDepthDisplay.value = (depth !== null && depth > 0.001) ? depth.toFixed(3) : '--';
      } catch (e) {
        waterDepthDisplay.value = '--';
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.destroy();
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// ---- lifecycle ----
onMounted(async () => {
  Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzNmI0MDRkZi04NzhjLTQyYmMtYjQxOC1iNzc2MDA1MmM4ZjIiLCJpZCI6OTAwMTAsImlhdCI6MTY1MDA3NTM0MX0.mGMDeDFon6i_AOEfTs3pEq30wRCipCWL3O-bzLHswtw';

  viewer = new Cesium.Viewer(sceneContainerRef.value, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    homeButton: false,
    geocoder: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    showStatusBar: false,
    fullscreenButton: false,
    shouldAnimate: true,
    infoBox: false
  });

  viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
    'http://211.143.193.121:29091/FJDX',
    { requestWaterMask: false, requestVertexNormals: true }
  );

  viewer.shadows = true;
  viewer.resolutionScale = 1.0;
  viewer.scene.msaaSamples = 4;
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.logarithmicDepthBuffer = true;
  viewer.scene.highDynamicRange = true;
  viewer.scene.debugShowFramesPerSecond = true;
  viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('2024-12-29T06:00:00Z');

  viewer.scene.fog.enabled = true;
  viewer.scene.globe.showGroundAtmosphere = false;
  viewer.scene.skyAtmosphere.show = false;
  viewer.scene.globe.enableLighting = true;
  viewer.scene.postProcessStages.add(createSkyEffect());

  updateLegend(waterDepthColorIntensity.value);

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(118.1, 24.5, 50000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0.0
    }
  });
});

onUnmounted(() => {
  if (volumeTimer) clearInterval(volumeTimer);
  if (waterSourceHandler) waterSourceHandler.destroy();
  if (waterFluid) waterFluid.destroy();
  if (viewer && !viewer.isDestroyed()) viewer.destroy();
});
</script>

<style scoped>
.fluid-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #000;
}

#sceneContainer {
  width: 100%;
  height: 100%;
}

.toolbar {
  position: absolute;
  left: 20px;
  top: 20px;
  background: rgba(0, 0, 0, 0.6);
  padding: 15px;
  border-radius: 5px;
  backdrop-filter: blur(5px);
  color: white;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

.toolbar td,
.toolbar label {
  color: white;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

.info-panel {
  position: absolute;
  right: 20px;
  top: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 5px;
  font-family: monospace;
  min-width: 200px;
}

.panel-title {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #fff;
  padding-bottom: 5px;
}

.legend {
  position: absolute;
  left: 20px;
  bottom: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 5px;
  font-family: monospace;
  min-width: 180px;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #fff;
  padding-bottom: 5px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.legend-color {
  width: 30px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.legend-label {
  font-size: 13px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  background: rgba(255, 255, 255, 0.95);
  padding: 30px 50px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}
</style>
