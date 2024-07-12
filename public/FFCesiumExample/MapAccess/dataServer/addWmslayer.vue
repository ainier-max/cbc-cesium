<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addWmslayerFun"
    >
      叠加土地资源(wms服务)
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeWmslayerFun"
    >
      移除土地资源(wms服务)
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
  let mapLayer = ffCesium.addTdtImgLayer();
  ffCesium.setView({
    lng: 118.135,
    lat: 24.339,
    height: 20000,
    pitchRadiu: -50,
  });
});
let wmslayer;
const addWmslayerFun = () => {
  let url = "http://192.168.15.228:8078/geoserver/cbc/wms";
  let layerName = "cbc:ground";
  wmslayer = ffCesium.addWmslayer(url, layerName);
  console.log("wmslayer", wmslayer);
};
const removeWmslayerFun = () => {
  ffCesium.removeMapLayer(wmslayer);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
