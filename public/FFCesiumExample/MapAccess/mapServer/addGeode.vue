<template>
  <div id="cesiumContainer"></div>
</template>
<script lang="ts" setup>
import { onMounted, ref, watch, onBeforeUpdate } from "vue";
import FFCesium from "FFCesium";
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
  const ffCesium = new FFCesium("cesiumContainer", viewerOption);
  console.log("ffCesium", ffCesium); //支持原生Cesium开发，其viewer获取方式：ffCesium.viewer //得加高德标准地图
  let mapLayer = ffCesium.addGaodeLayer(
    "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
  ); //定位
  console.log("mapLayer", mapLayer);
});
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
