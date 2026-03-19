# FFCesium 介绍

## 定位

FFCesium 是对 CesiumJS 的二次封装，目标是降低业务项目接入三维地图的复杂度。

它保留了原生 Cesium 的能力，同时补充了更直接的业务方法，适合以下场景：

- 需要快速初始化三维地球
- 需要统一加载底图、地形、GeoJSON、KML、WMS、倾斜摄影
- 需要快速添加点、线、面、模型、HTML 标注
- 需要图形采集、编辑、空间关系判断、天气和线面特效
- 需要在 FFCesium 和原生 Cesium 能力之间混合开发

## 当前版本

- FFCesium：`V1.0.0`
- Cesium：`1.120`

## 核心特性

### 1. 初始化简单

常见情况下只需要一行代码即可创建地图实例：

```js
const ffCesium = new FFCesium("cesiumContainer", viewerOption);
```

如果不传 `viewerOption`，FFCesium 会使用内置默认配置创建 `Viewer`，并加载默认底图和初始视角。

### 2. 支持原生 Cesium 混合开发

实例初始化后，可以直接访问：

- `ffCesium.viewer`
- `ffCesium.Cesium`

这意味着封装方法不满足需求时，可以继续调用原生 Cesium API。

## 能力模块

FFCesium 实例初始化完成后，会挂载以下能力对象：

- `mapServerClass`：底图服务加载
- `dataServerClass`：地形、GeoJSON、KML、WMS、倾斜摄影
- `mapToolClass`：坐标转换、比例尺、指北针、测距测面、天空盒、鼠标提示
- `mapActionClass`：飞行定位、设置视角、相机事件
- `entityClass`：Entity 方式添加点、线、面、矩形、图标
- `primitiveClass`：Primitive 方式添加点、线、面、模型、图标
- `elementClass`：贴地标签、HTML 覆盖物、圆柱体
- `elementGatherClass`：点线面圆矩形图形采集
- `elementEditClass`：点线面圆矩形图形编辑
- `militaryPlottingGatherClass`：军事标绘采集
- `militaryPlottingEditClass`：军事标绘编辑
- `particleEffectClass`：粒子效果
- `weatherEffectClass`：雨、雪、雾、云效果
- `polygonEffectClass`：水面、水体等面特效
- `polylineEffectClass`：流动线、闪烁线、移动点、线段标签
- `spatialAnalysisClass`：点面、线面、面面空间关系判断
- `mapUtilClass`：常用几何和坐标工具
- `addTypeClass`：高级叠加示例能力
- `rotateTool`、`flyRoam`、`flyRoamNew`：高级工具

## 初始化完成时机

默认情况下实例创建后即可使用。

如果启用了缓存配置 `customOption.cacheUrl`，初始化过程会先打开本地缓存，再继续创建地图。此时建议等待：

```js
await ffCesium.whenReady();
```

## 适用人群

- 前端开发
- GIS 开发
- 需要在业务系统中集成三维地图的研发团队
