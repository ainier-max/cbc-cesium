<template>
  <div id="cesiumContainer">
    <button style="position: absolute; left: 100px; top: 100px; z-index: 999" @click="addTerrainFun">
      叠加地形服务
    </button>

    <button style="position: absolute; left: 100px; top: 150px; z-index: 999" @click="removeTerrainFun">
      移除地形服务
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
    baseLayer: false,
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
  }; //初始化
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  let mapLayer = ffCesium.mapServerClass.addTdtImgLayer();
  ffCesium.mapActionClass.setView({ lng: 118.1, lat: 24.37, height: 10000, pitchRadiu: -50 });
});
const addTerrainFun = () => {
  let terrainLayer = ffCesium.dataServerClass.addTerrain("http://data.marsgis.cn/terrain");
  console.log("terrainLayer", terrainLayer);
};
const removeTerrainFun = () => {
  ffCesium.dataServerClass.removeTerrain();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
