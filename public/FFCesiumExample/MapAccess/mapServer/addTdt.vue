<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 50px; z-index: 999"
      @click="clearAllLayerFun"
    >
      清除所有地图
    </button>

    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addTdtVecLayerFun"
    >
      天地图平面地图加载
    </button>
    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="addTdtCvaLayerFun"
    >
      加载天地图平面注记地图加载
    </button>

    <button
      style="position: absolute; left: 100px; top: 200px; z-index: 999"
      @click="addTdtImgLayerFun"
    >
      天地图影像地图加载
    </button>

    <button
      style="position: absolute; left: 100px; top: 250px; z-index: 999"
      @click="addTdtCiaLayerFun"
    >
      加载天地图影像注记地图加载
    </button>

    <button
      style="position: absolute; left: 100px; top: 300px; z-index: 999"
      @click="addTdtCtaLayerFun"
    >
      天地图道路地图加载
    </button>

    <button
      style="position: absolute; left: 100px; top: 350px; z-index: 999"
      @click="addTdtLayerFun"
    >
      其他天地图服务（如地形服务）
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  let viewerOption = {
    animation: false, //是否创建动画小器件，左下角仪表
    baseLayerPicker: false, //是否显示图层选择器
    fullscreenButton: false, //是否显示全屏按钮
    geocoder: false, //是否显示geocoder小器件，右上角查询按钮
    homeButton: false, //是否显示Home按钮
    infoBox: false, //是否显示信息框
    sceneModePicker: false, //是否显示3D/2D选择器
    scene3DOnly: false, //如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
    selectionIndicator: false, //是否显示选取指示器组件
    timeline: false, //是否显示时间轴
    navigationHelpButton: false, //是否显示右上角的帮助按钮
    shadows: true, //是否显示背影
    shouldAnimate: true,
    baseLayer: false,
  }; //初始化
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  ffCesium.mapActionClass.setView({ lng: 118, lat: 24, height: 10000000, pitchRadiu: -90 });
});
let mapLayerArr = [];
const clearAllLayerFun = () => {
  mapLayerArr.forEach((layer, index) => {
    ffCesium.mapServerClass.removeMapLayer(layer);
  });
};

const addTdtVecLayerFun = () => {
  let mapLayer = ffCesium.mapServerClass.addTdtVecLayer();
  mapLayerArr.push(mapLayer);
};

const addTdtCvaLayerFun = () => {
  let mapLayer = ffCesium.mapServerClass.addTdtCvaLayer();
  mapLayerArr.push(mapLayer);
};

const addTdtImgLayerFun = () => {
  let mapLayer = ffCesium.mapServerClass.addTdtImgLayer();
  mapLayerArr.push(mapLayer);
};

const addTdtCiaLayerFun = () => {
  let mapLayer = ffCesium.mapServerClass.addTdtCiaLayer();
  mapLayerArr.push(mapLayer);
};

const addTdtCtaLayerFun = () => {
  let mapLayer = ffCesium.mapServerClass.addTdtCtaLayer();
  mapLayerArr.push(mapLayer);
};

const addTdtLayerFun = () => {
  let url =
    "https://t4.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=2cf56b2e77c1be9a456ef411d808daad";
  let mapLayer = ffCesium.mapServerClass.addTdtLayer(url);
  mapLayerArr.push(mapLayer);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
