<template>
  <div class="water-fluid-page">
    <div ref="sceneContainerRef" class="scene-container"></div>

    <div class="control-panel">
      <div class="panel-header">
        <div class="panel-title">Cesium 水流</div>
        <button class="reset-button" @click="resetParams">重置参数</button>
      </div>

      <div class="section">
        <div class="section-title">显示</div>
        <label class="toggle-row">
          <span>显示水面</span>
          <input v-model="showWater" type="checkbox" />
        </label>
      </div>

      <div class="section">
        <div class="section-title">流动 / 波纹</div>
        <div v-for="control in flowControls" :key="control.key" class="control-row">
          <label :for="control.key">{{ control.label }}</label>
          <input
            :id="control.key"
            v-model.number="waterParams[control.key]"
            type="number"
            :min="control.min"
            :max="control.max"
            :step="control.step"
          />
        </div>
      </div>

      <div class="section">
        <div class="section-title">泡沫</div>
        <div v-for="control in foamControls" :key="control.key" class="control-row">
          <label :for="control.key">{{ control.label }}</label>
          <input
            :id="control.key"
            v-model.number="waterParams[control.key]"
            type="number"
            :min="control.min"
            :max="control.max"
            :step="control.step"
          />
        </div>
      </div>

      <div class="section">
        <div class="section-title">光照 / 透明</div>
        <div v-for="control in lightControls" :key="control.key" class="control-row">
          <label :for="control.key">{{ control.label }}</label>
          <input
            :id="control.key"
            v-model.number="waterParams[control.key]"
            type="number"
            :min="control.min"
            :max="control.max"
            :step="control.step"
          />
        </div>
      </div>

      <div class="section">
        <div class="section-title">河道</div>
        <div v-for="control in riverControls" :key="control.key" class="control-row">
          <label :for="control.key">{{ control.label }}</label>
          <input
            :id="control.key"
            v-model.number="waterParams[control.key]"
            type="number"
            :min="control.min"
            :max="control.max"
            :step="control.step"
          />
        </div>
      </div>

      <div class="section">
        <div class="section-title">颜色</div>
        <div v-for="control in colorControls" :key="control.key" class="control-row">
          <label :for="control.key">{{ control.label }}</label>
          <input :id="control.key" v-model="waterParams[control.key]" type="color" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { WaterEffectMaterial } from "./lib/index.js";

const CESIUM_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmODUzYTQzYi1jMWM2LTQ2MTEtYWE4OS0wYzIwNTkyNjk1NDMiLCJpZCI6MjU5LCJpYXQiOjE3NzcwOTU1MzF9.pWL_6uenO0yB3nCXJNs8wWT9mic_UBo_d1CYDpwaXdQ";

const WATER_CENTER = {
  longitude: 121.52,
  latitude: 23.52,
  height: 8.0
};

const WATER_MESH = {
  waterWidth: 950.0,
  waterLength: 2400.0,
  segmentsX: 96,
  segmentsY: 192
};

function createDefaultWaterParams() {
  return {
    waterWidth: WATER_MESH.waterWidth,
    waterLength: WATER_MESH.waterLength,
    timeScale: 1.0,
    flowSpeed: 0.82,
    flowStrength: 1.18,
    waveScale: 5.5,
    waveStrength: 2.5,
    foamAmount: 1.25,
    foamContrast: 1.2,
    foamCoverage: 0.2,
    meanderAmount: 1.5,
    meanderFrequency: 0.3,
    riverWidth: 6.0,
    bankSoftness: 1.4,
    reflectivity: 0.72,
    specularStrength: 1.65,
    gloss: 0.94,
    fresnelPower: 5.0,
    refractionStrength: 0.35,
    alpha: 0.94,
    exposure: 3.0,
    shallowColor: "#2b8e8f",
    deepColor: "#062f43",
    foamColor: "#edf7fb",
    skyTopColor: "#4aa2ff",
    skyHorizonColor: "#cfe5ff",
    sunColor: "#ffe0a0",
    sunIntensity: 2.7
  };
}

const flowControls = [
  { key: "timeScale", label: "时间倍率", min: 0, max: 3, step: 0.01 },
  { key: "flowSpeed", label: "流速", min: 0, max: 3, step: 0.01 },
  { key: "flowStrength", label: "流场强度", min: 0, max: 3, step: 0.01 },
  { key: "waveScale", label: "波纹尺度", min: 0.5, max: 12, step: 0.01 },
  { key: "waveStrength", label: "法线强度", min: 0.2, max: 6, step: 0.01 }
];

const foamControls = [
  { key: "foamAmount", label: "泡沫强度", min: 0, max: 3, step: 0.01 },
  { key: "foamContrast", label: "泡沫对比", min: 0.1, max: 4, step: 0.01 },
  { key: "foamCoverage", label: "泡沫覆盖", min: 0.05, max: 0.6, step: 0.01 }
];

const lightControls = [
  { key: "reflectivity", label: "反射强度", min: 0, max: 1.5, step: 0.01 },
  { key: "specularStrength", label: "太阳高光", min: 0, max: 5, step: 0.01 },
  { key: "gloss", label: "光泽度", min: 0, max: 1, step: 0.01 },
  { key: "fresnelPower", label: "菲涅尔指数", min: 1, max: 9, step: 0.01 },
  { key: "refractionStrength", label: "折射扰动", min: 0, max: 1, step: 0.01 },
  { key: "alpha", label: "透明度", min: 0.1, max: 1, step: 0.01 },
  { key: "exposure", label: "曝光", min: 0.5, max: 8, step: 0.01 },
  { key: "sunIntensity", label: "太阳强度", min: 0, max: 8, step: 0.01 }
];

const riverControls = [
  { key: "meanderAmount", label: "河道摆动", min: 0, max: 4, step: 0.01 },
  { key: "meanderFrequency", label: "摆动频率", min: 0.02, max: 0.8, step: 0.01 },
  { key: "riverWidth", label: "河道宽度", min: 2, max: 14, step: 0.01 },
  { key: "bankSoftness", label: "岸线柔和", min: 0.05, max: 4, step: 0.01 }
];

const colorControls = [
  { key: "shallowColor", label: "浅水色" },
  { key: "deepColor", label: "深水色" },
  { key: "foamColor", label: "泡沫色" },
  { key: "skyTopColor", label: "天空顶部色" },
  { key: "skyHorizonColor", label: "天空地平线色" },
  { key: "sunColor", label: "太阳色" }
];

const sceneContainerRef = ref(null);
const showWater = ref(true);
const waterParams = reactive(createDefaultWaterParams());

let viewer = null;
let riverWater = null;
let referenceBankEntities = [];
let localBasis = null;

function resetParams() {
  Object.assign(waterParams, createDefaultWaterParams());
  showWater.value = true;
}

function createViewer() {
  Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

  return new Cesium.Viewer(sceneContainerRef.value, {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    homeButton: false,
    geocoder: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
    shouldAnimate: true
  });
}

function createLocalBasis(center) {
  const centerCartesian = Cesium.Cartesian3.fromDegrees(
    center.longitude,
    center.latitude,
    center.height
  );
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

  return {
    centerCartesian,
    transform
  };
}

function createWaterPlaneGeometry(mesh) {
  const vertexCountX = mesh.segmentsX + 1;
  const vertexCountY = mesh.segmentsY + 1;
  const vertexCount = vertexCountX * vertexCountY;
  const positions = new Float64Array(vertexCount * 3);
  const textureCoordinates = new Float32Array(vertexCount * 2);
  const indices = new Uint16Array(mesh.segmentsX * mesh.segmentsY * 6);
  const halfWidth = mesh.waterWidth * 0.5;
  const halfLength = mesh.waterLength * 0.5;
  let vertexIndex = 0;

  for (let yIndex = 0; yIndex < vertexCountY; yIndex += 1) {
    const yRatio = yIndex / mesh.segmentsY;

    for (let xIndex = 0; xIndex < vertexCountX; xIndex += 1) {
      const xRatio = xIndex / mesh.segmentsX;
      const positionOffset = vertexIndex * 3;
      const uvOffset = vertexIndex * 2;

      positions[positionOffset] = xRatio * mesh.waterWidth - halfWidth;
      positions[positionOffset + 1] = yRatio * mesh.waterLength - halfLength;
      positions[positionOffset + 2] = 0.0;
      textureCoordinates[uvOffset] = xRatio;
      textureCoordinates[uvOffset + 1] = yRatio;
      vertexIndex += 1;
    }
  }

  let indexOffset = 0;
  for (let yIndex = 0; yIndex < mesh.segmentsY; yIndex += 1) {
    for (let xIndex = 0; xIndex < mesh.segmentsX; xIndex += 1) {
      const lowerLeft = yIndex * vertexCountX + xIndex;
      const lowerRight = lowerLeft + 1;
      const upperLeft = lowerLeft + vertexCountX;
      const upperRight = upperLeft + 1;

      indices[indexOffset] = lowerLeft;
      indices[indexOffset + 1] = lowerRight;
      indices[indexOffset + 2] = upperRight;
      indices[indexOffset + 3] = lowerLeft;
      indices[indexOffset + 4] = upperRight;
      indices[indexOffset + 5] = upperLeft;
      indexOffset += 6;
    }
  }

  return new Cesium.Geometry({
    attributes: new Cesium.GeometryAttributes({
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: positions
      }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: textureCoordinates
      })
    }),
    indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: new Cesium.BoundingSphere(
      Cesium.Cartesian3.ZERO,
      Math.sqrt(mesh.waterWidth * mesh.waterWidth + mesh.waterLength * mesh.waterLength) * 0.5
    )
  });
}

function transformLocalPoint(transform, x, y, z) {
  const localPoint = new Cesium.Cartesian3(x, y, z);
  return Cesium.Matrix4.multiplyByPoint(transform, localPoint, new Cesium.Cartesian3());
}

function createReferenceRiverBanks(transform, params) {
  const leftBankPositions = [];
  const rightBankPositions = [];
  const bankSampleCount = 160;
  const halfLength = params.waterLength * 0.5;

  for (let index = 0; index <= bankSampleCount; index += 1) {
    const ratio = index / bankSampleCount;
    const along = ratio * params.waterLength - halfLength;
    const shaderAlong = (along / params.waterLength) * params.waveScale * 8.0;
    const shaderToMeters = params.waterLength / (params.waveScale * 8.0);
    const centerOffset =
      Math.sin(shaderAlong * params.meanderFrequency) * params.meanderAmount * shaderToMeters;
    const bankHalfWidth = params.riverWidth * 0.5 * shaderToMeters;

    leftBankPositions.push(transformLocalPoint(transform, centerOffset - bankHalfWidth, along, 0.08));
    rightBankPositions.push(transformLocalPoint(transform, centerOffset + bankHalfWidth, along, 0.08));
  }

  return [
    viewer.entities.add({
      name: "左侧河岸参考线",
      polyline: {
        positions: leftBankPositions,
        width: 2,
        material: Cesium.Color.fromCssColorString("#7d6040").withAlpha(0.65)
      }
    }),
    viewer.entities.add({
      name: "右侧河岸参考线",
      polyline: {
        positions: rightBankPositions,
        width: 2,
        material: Cesium.Color.fromCssColorString("#7d6040").withAlpha(0.65)
      }
    })
  ];
}

function refreshReferenceRiverBanks() {
  if (!viewer || !localBasis) {
    return;
  }

  referenceBankEntities.forEach((entity) => {
    viewer.entities.remove(entity);
  });
  referenceBankEntities = createReferenceRiverBanks(localBasis.transform, waterParams);
}

function flyToWater(targetViewer) {
  const center = Cesium.Cartesian3.fromDegrees(
    WATER_CENTER.longitude,
    WATER_CENTER.latitude,
    WATER_CENTER.height
  );
  const radius = Math.max(WATER_MESH.waterWidth, WATER_MESH.waterLength) * 0.8;

  targetViewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(center, radius), {
    duration: 0,
    offset: new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(18.0),
      Cesium.Math.toRadians(-42.0),
      WATER_MESH.waterLength * 1.4
    )
  });
}

watch(showWater, (value) => {
  if (riverWater) {
    riverWater.show = value;
  }
});

watch(
  [
    () => waterParams.meanderAmount,
    () => waterParams.meanderFrequency,
    () => waterParams.riverWidth,
    () => waterParams.waveScale,
    () => waterParams.waterLength
  ],
  () => {
    refreshReferenceRiverBanks();
  }
);

onMounted(() => {
  window.Cesium = Cesium;
  viewer = createViewer();
  localBasis = createLocalBasis(WATER_CENTER);
  const waterGeometry = createWaterPlaneGeometry(WATER_MESH);

  riverWater = new WaterEffectMaterial({
    geometry: waterGeometry,
    modelMatrix: localBasis.transform,
    uniforms: waterParams
  });

  viewer.scene.primitives.add(riverWater);
  viewer.scene.globe.depthTestAgainstTerrain = true;
  viewer.scene.highDynamicRange = false;
  viewer.scene.debugShowFramesPerSecond = true;
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.requestRenderMode = false;
  viewer.clock.shouldAnimate = true;

  refreshReferenceRiverBanks();
  flyToWater(viewer);
});

onUnmounted(() => {
  referenceBankEntities = [];

  if (riverWater && !riverWater.isDestroyed()) {
    viewer.scene.primitives.remove(riverWater);
    riverWater.destroy();
  }

  riverWater = null;

  if (viewer && !viewer.isDestroyed()) {
    viewer.destroy();
  }

  viewer = null;
  localBasis = null;
});
</script>

<style scoped>
.water-fluid-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(72, 134, 196, 0.28), transparent 30%),
    linear-gradient(180deg, #08111c 0%, #02070c 100%);
}

.scene-container {
  width: 100%;
  height: 100%;
}

.control-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100% - 32px);
  overflow-y: auto;
  padding: 16px;
  border: 1px solid rgba(150, 195, 224, 0.25);
  border-radius: 14px;
  background: rgba(5, 13, 22, 0.78);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  color: #eaf6ff;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
}

.reset-button {
  border: 1px solid rgba(139, 200, 255, 0.4);
  border-radius: 8px;
  background: rgba(34, 88, 132, 0.55);
  color: #f3fbff;
  padding: 6px 10px;
  cursor: pointer;
}

.section {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid rgba(150, 195, 224, 0.15);
}

.section-title {
  margin-bottom: 10px;
  font-size: 13px;
  color: #8fd1ff;
  letter-spacing: 0.08em;
}

.control-row,
.toggle-row {
  display: grid;
  grid-template-columns: 1fr 110px;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.control-row input,
.toggle-row input {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(150, 195, 224, 0.28);
  border-radius: 8px;
  background: rgba(3, 10, 17, 0.85);
  color: #eaf6ff;
  padding: 6px 8px;
  box-sizing: border-box;
}

.toggle-row input {
  width: 20px;
  justify-self: end;
  accent-color: #56b4ff;
}

.control-row input[type="color"] {
  height: 34px;
  padding: 3px;
}

.control-panel::-webkit-scrollbar {
  width: 8px;
}

.control-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(143, 209, 255, 0.3);
}
</style>
