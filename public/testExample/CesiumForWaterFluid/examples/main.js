import { WaterEffectMaterial } from "../lib/index.js";

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmODUzYTQzYi1jMWM2LTQ2MTEtYWE4OS0wYzIwNTkyNjk1NDMiLCJpZCI6MjU5LCJpYXQiOjE3NzcwOTU1MzF9.pWL_6uenO0yB3nCXJNs8wWT9mic_UBo_d1CYDpwaXdQ";

/** @type {{longitude: number, latitude: number, height: number}} 示例水面中心点。 */
const WATER_CENTER = {
  longitude: 121.62,
  latitude: 23.52,
  height: 8.0,
};

/** @type {{waterWidth: number, waterLength: number, segmentsX: number, segmentsY: number}} 水面网格配置。 */
const WATER_MESH = {
  waterWidth: 950.0,
  waterLength: 2400.0,
  segmentsX: 96,
  segmentsY: 192,
};

/** @type {object} GUI 和 shader 共用的水面参数。 */
const waterParams = {
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
  sunIntensity: 2.7,
};

/** @type {Cesium.Viewer} Cesium Viewer 实例。 */
const viewer = createViewer();
/** @type {{centerCartesian: Cesium.Cartesian3, transform: Cesium.Matrix4}} 水面局部坐标工具。 */
const localBasis = createLocalBasis(WATER_CENTER);
/** @type {Cesium.Geometry} Shadertoy 河流水面平面网格。 */
const waterGeometry = createWaterPlaneGeometry(WATER_MESH);
/** @type {WaterEffectMaterial} 河流水面材质。 */
const riverWater = new WaterEffectMaterial({
  geometry: waterGeometry,
  modelMatrix: localBasis.transform,
  uniforms: waterParams,
});

viewer.scene.primitives.add(riverWater);
createReferenceRiverBanks(viewer, localBasis.transform, waterParams);
createGui(waterParams, riverWater);
flyToWater(viewer);

/**
 * 创建 Cesium Viewer。
 *
 * @returns {Cesium.Viewer} Cesium Viewer 实例。
 */
function createViewer() {
  /** @type {Cesium.Viewer} Cesium Viewer 实例。 */
  const createdViewer = new Cesium.Viewer("cesiumContainer", {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
  });

  createdViewer.scene.globe.depthTestAgainstTerrain = true;
  createdViewer.scene.highDynamicRange = false;
  createdViewer.scene.debugShowFramesPerSecond = true;
  createdViewer.scene.skyAtmosphere.show = true;
  createdViewer.scene.requestRenderMode = false;
  createdViewer.clock.shouldAnimate = true;

  return createdViewer;
}

/**
 * 创建水面局部 ENU 坐标工具。
 *
 * @param {{longitude: number, latitude: number, height: number}} center - 水面中心经纬度和高度。
 * @returns {{centerCartesian: Cesium.Cartesian3, transform: Cesium.Matrix4}} 局部坐标工具。
 */
function createLocalBasis(center) {
  /** @type {Cesium.Cartesian3} 水面中心世界坐标。 */
  const centerCartesian = Cesium.Cartesian3.fromDegrees(
    center.longitude,
    center.latitude,
    center.height,
  );
  /** @type {Cesium.Matrix4} ENU 局部坐标到世界坐标矩阵。 */
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

  return {
    centerCartesian,
    transform,
  };
}

/**
 * 创建有细分的水面平面几何。
 *
 * @param {{waterWidth: number, waterLength: number, segmentsX: number, segmentsY: number}} mesh - 水面网格配置。
 * @returns {Cesium.Geometry} Cesium 平面几何。
 */
function createWaterPlaneGeometry(mesh) {
  /** @type {number} X 方向顶点数量。 */
  const vertexCountX = mesh.segmentsX + 1;
  /** @type {number} Y 方向顶点数量。 */
  const vertexCountY = mesh.segmentsY + 1;
  /** @type {number} 总顶点数量。 */
  const vertexCount = vertexCountX * vertexCountY;
  /** @type {Float64Array} 水面局部坐标顶点数组。 */
  const positions = new Float64Array(vertexCount * 3);
  /** @type {Float32Array} 水面 UV 顶点数组。 */
  const textureCoordinates = new Float32Array(vertexCount * 2);
  /** @type {Uint16Array} 水面三角形索引数组。 */
  const indices = new Uint16Array(mesh.segmentsX * mesh.segmentsY * 6);
  /** @type {number} 水面半宽。 */
  const halfWidth = mesh.waterWidth * 0.5;
  /** @type {number} 水面半长。 */
  const halfLength = mesh.waterLength * 0.5;
  /** @type {number} 当前顶点写入下标。 */
  let vertexIndex = 0;

  for (let yIndex = 0; yIndex < vertexCountY; yIndex += 1) {
    /** @type {number} Y 方向归一化进度。 */
    const yRatio = yIndex / mesh.segmentsY;

    for (let xIndex = 0; xIndex < vertexCountX; xIndex += 1) {
      /** @type {number} X 方向归一化进度。 */
      const xRatio = xIndex / mesh.segmentsX;
      /** @type {number} 当前顶点数组基础下标。 */
      const positionOffset = vertexIndex * 3;
      /** @type {number} 当前 UV 数组基础下标。 */
      const uvOffset = vertexIndex * 2;

      positions[positionOffset] = xRatio * mesh.waterWidth - halfWidth;
      positions[positionOffset + 1] = yRatio * mesh.waterLength - halfLength;
      positions[positionOffset + 2] = 0.0;
      textureCoordinates[uvOffset] = xRatio;
      textureCoordinates[uvOffset + 1] = yRatio;
      vertexIndex += 1;
    }
  }

  /** @type {number} 当前索引写入下标。 */
  let indexOffset = 0;
  for (let yIndex = 0; yIndex < mesh.segmentsY; yIndex += 1) {
    for (let xIndex = 0; xIndex < mesh.segmentsX; xIndex += 1) {
      /** @type {number} 当前格子左下顶点。 */
      const lowerLeft = yIndex * vertexCountX + xIndex;
      /** @type {number} 当前格子右下顶点。 */
      const lowerRight = lowerLeft + 1;
      /** @type {number} 当前格子左上顶点。 */
      const upperLeft = lowerLeft + vertexCountX;
      /** @type {number} 当前格子右上顶点。 */
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
        values: positions,
      }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: textureCoordinates,
      }),
    }),
    indices,
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    boundingSphere: new Cesium.BoundingSphere(
      Cesium.Cartesian3.ZERO,
      Math.sqrt(mesh.waterWidth * mesh.waterWidth + mesh.waterLength * mesh.waterLength) * 0.5,
    ),
  });
}

/**
 * 创建河岸参考线，帮助观察 shader 河道边界。
 *
 * @param {Cesium.Viewer} targetViewer - Cesium Viewer 实例。
 * @param {Cesium.Matrix4} transform - 水面局部坐标到世界坐标矩阵。
 * @param {object} params - 水面参数对象。
 * @returns {void}
 */
function createReferenceRiverBanks(targetViewer, transform, params) {
  /** @type {Cesium.Cartesian3[]} 左侧河岸点。 */
  const leftBankPositions = [];
  /** @type {Cesium.Cartesian3[]} 右侧河岸点。 */
  const rightBankPositions = [];
  /** @type {number} 河岸采样数量。 */
  const bankSampleCount = 160;
  /** @type {number} 水面半长。 */
  const halfLength = params.waterLength * 0.5;

  for (let index = 0; index <= bankSampleCount; index += 1) {
    /** @type {number} 河流长度方向进度。 */
    const ratio = index / bankSampleCount;
    /** @type {number} 当前河流前进方向坐标。 */
    const along = ratio * params.waterLength - halfLength;
    /** @type {number} 当前 shader 坐标里的河流前进方向。 */
    const shaderAlong = (along / params.waterLength) * params.waveScale * 8.0;
    /** @type {number} shader 坐标转米制坐标的比例。 */
    const shaderToMeters = params.waterLength / (params.waveScale * 8.0);
    /** @type {number} 当前河道中心偏移。 */
    const centerOffset = Math.sin(shaderAlong * params.meanderFrequency) * params.meanderAmount * shaderToMeters;
    /** @type {number} 当前河岸半宽。 */
    const bankHalfWidth = params.riverWidth * 0.5 * shaderToMeters;

    leftBankPositions.push(transformLocalPoint(transform, centerOffset - bankHalfWidth, along, 0.08));
    rightBankPositions.push(transformLocalPoint(transform, centerOffset + bankHalfWidth, along, 0.08));
  }

  targetViewer.entities.add({
    name: "左侧河岸参考线",
    polyline: {
      positions: leftBankPositions,
      width: 2,
      material: Cesium.Color.fromCssColorString("#7d6040").withAlpha(0.65),
    },
  });

  targetViewer.entities.add({
    name: "右侧河岸参考线",
    polyline: {
      positions: rightBankPositions,
      width: 2,
      material: Cesium.Color.fromCssColorString("#7d6040").withAlpha(0.65),
    },
  });
}

/**
 * 把水面局部点转换为 Cesium 世界坐标。
 *
 * @param {Cesium.Matrix4} transform - 局部到世界矩阵。
 * @param {number} x - 局部 X 坐标。
 * @param {number} y - 局部 Y 坐标。
 * @param {number} z - 局部 Z 坐标。
 * @returns {Cesium.Cartesian3} Cesium 世界坐标。
 */
function transformLocalPoint(transform, x, y, z) {
  /** @type {Cesium.Cartesian3} 局部坐标。 */
  const localPoint = new Cesium.Cartesian3(x, y, z);
  return Cesium.Matrix4.multiplyByPoint(transform, localPoint, new Cesium.Cartesian3());
}

/**
 * 创建 dat.GUI 参数面板。
 *
 * @param {object} params - GUI 参数对象。
 * @param {WaterEffectMaterial} primitive - 河流水面材质。
 * @returns {dat.GUI} dat.GUI 实例。
 */
function createGui(params, primitive) {
  /** @type {dat.GUI} dat.GUI 实例。 */
  const gui = new dat.GUI({ width: 330 });
  /** @type {dat.GUI} 流动参数分组。 */
  const flowFolder = gui.addFolder("流动 / 波纹");
  /** @type {dat.GUI} 泡沫参数分组。 */
  const foamFolder = gui.addFolder("泡沫");
  /** @type {dat.GUI} 光照参数分组。 */
  const lightFolder = gui.addFolder("光照 / 菲涅尔");
  /** @type {dat.GUI} 颜色参数分组。 */
  const colorFolder = gui.addFolder("颜色");
  /** @type {dat.GUI} 河道参数分组。 */
  const riverFolder = gui.addFolder("河道");

  flowFolder.add(params, "timeScale", 0.0, 3.0, 0.01).name("时间倍率");
  flowFolder.add(params, "flowSpeed", 0.0, 3.0, 0.01).name("流速");
  flowFolder.add(params, "flowStrength", 0.0, 3.0, 0.01).name("流场强度");
  flowFolder.add(params, "waveScale", 0.5, 12.0, 0.01).name("波纹尺度");
  flowFolder.add(params, "waveStrength", 0.2, 6.0, 0.01).name("法线强度");

  foamFolder.add(params, "foamAmount", 0.0, 3.0, 0.01).name("泡沫强度");
  foamFolder.add(params, "foamContrast", 0.1, 4.0, 0.01).name("泡沫对比");
  foamFolder.add(params, "foamCoverage", 0.05, 0.6, 0.01).name("泡沫覆盖");

  lightFolder.add(params, "reflectivity", 0.0, 1.5, 0.01).name("反射强度");
  lightFolder.add(params, "specularStrength", 0.0, 5.0, 0.01).name("太阳高光");
  lightFolder.add(params, "gloss", 0.0, 1.0, 0.01).name("光泽度");
  lightFolder.add(params, "fresnelPower", 1.0, 9.0, 0.01).name("菲涅尔指数");
  lightFolder.add(params, "refractionStrength", 0.0, 1.0, 0.01).name("折射扰动");
  lightFolder.add(params, "sunIntensity", 0.0, 8.0, 0.01).name("太阳强度");

  riverFolder.add(params, "meanderAmount", 0.0, 4.0, 0.01).name("河道摆动");
  riverFolder.add(params, "meanderFrequency", 0.02, 0.8, 0.01).name("摆动频率");
  riverFolder.add(params, "riverWidth", 2.0, 14.0, 0.01).name("河道宽度");
  riverFolder.add(params, "bankSoftness", 0.05, 4.0, 0.01).name("岸线柔和");
  riverFolder.add(params, "alpha", 0.1, 1.0, 0.01).name("透明度");
  riverFolder.add(params, "exposure", 0.5, 8.0, 0.01).name("曝光");

  colorFolder.addColor(params, "shallowColor").name("浅水色");
  colorFolder.addColor(params, "deepColor").name("深水色");
  colorFolder.addColor(params, "foamColor").name("泡沫色");
  colorFolder.addColor(params, "skyTopColor").name("天空顶色");
  colorFolder.addColor(params, "skyHorizonColor").name("天空地平线");
  colorFolder.addColor(params, "sunColor").name("太阳色");

  flowFolder.open();
  foamFolder.open();
  lightFolder.open();
  riverFolder.open();

  /** @type {{重置参数: Function}} GUI 操作对象。 */
  const actions = {
    重置参数() {
      Object.assign(params, {
        timeScale: 1.0,
        flowSpeed: 0.82,
        flowStrength: 1.18,
        waveScale: 5.5,
        waveStrength: 2.5,
        foamAmount: 1.25,
        foamContrast: 1.2,
        foamCoverage: 0.2,
        reflectivity: 0.72,
        specularStrength: 1.65,
        gloss: 0.94,
        fresnelPower: 5.0,
        refractionStrength: 0.35,
        alpha: 0.94,
        exposure: 3.0,
      });
      gui.updateDisplay();
      primitive.show = true;
    },
  };

  gui.add(primitive, "show").name("显示水面");
  gui.add(actions, "重置参数");

  return gui;
}

/**
 * 把相机飞到水面观察角度。
 *
 * @param {Cesium.Viewer} targetViewer - Cesium Viewer 实例。
 * @returns {void}
 */
function flyToWater(targetViewer) {
  targetViewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      WATER_CENTER.longitude + 0.007,
      WATER_CENTER.latitude - 0.012,
      WATER_CENTER.height + 1450.0,
    ),
    orientation: {
      heading: Cesium.Math.toRadians(22.0),
      pitch: Cesium.Math.toRadians(-48.0),
      roll: 0.0,
    },
  });
}
