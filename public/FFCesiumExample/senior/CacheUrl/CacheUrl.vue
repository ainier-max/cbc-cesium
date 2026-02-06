<template>
  <div id="cesiumContainer">
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(async () => {
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
    customOption: {
      cacheUrl: [
        '/webst04.is.autonavi.com/appmaptile',
        '/YTGLB',//3D模型
        '/YTFSGQ',//倾斜摄影
        '/YTBGQ1',//倾斜摄影
        '/YTTYGQ',//倾斜摄影
        '/YTHZJGJH',//倾斜摄影
        '/YTQSQXSY2',//倾斜摄影
        '/YTDOM220',//正射影像
        '/terrain',//地形服务
        '/YTBingmap',//影像地图
        'http://t0.tianditu.gov.cn/cia_c',//天地图注记
        'layers=sl%3Aqx',//geoserver服务
        'layers=sl%3Ajmssx',//geoserver服务
        'layers=sl%3Aytgq',//geoserver服务
        'layers=sl%3Atyxbj',//geoserver服务
        '/cesium/Assets/'//cesium资源
      ]
    }
  }; //初始化
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  // wait until FFCesium completes initialization (including cache open)
  await ffCesium.whenReady();
  console.log("FFCesium ready");
  ffCesium.mapActionClass.setView({ lng: 118.1022, lat: 24.4959, height: 100000, pitchRadiu: -90 });

  let url = "https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
  ffCesium.mapServerClass.addCustomLayer(url);
});

</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
