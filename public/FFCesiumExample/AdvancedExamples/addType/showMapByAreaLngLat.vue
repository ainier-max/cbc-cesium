<template>
  <div
    id="cesiumContainer"
    style="
      background-image: url(./FFCesiumExample/AdvancedExamples/addType/images/back.png);
    "
  ></div>
</template>
<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue";
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
    // 透明必须设置true
    orderIndependentTranslucency: true,
    contextOptions: {
      webgl: {
        alpha: true,
      },
    },
  };
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  ffCesium.addTdtImgLayer();
  //定位
  ffCesium.setView({
    lng: 118.08164379,
    lat: 37.1808099,
    height: 85000,
    pitchRadiu: -50,
  });

  //zhanhuaGeojson已在工程进行导入，标准的geojson格式。自行获取
  let pointList = zhanhuaGeojson.features[0].geometry.coordinates[0];
  let latlngArr = [];
  pointList.forEach((item, index) => {
    latlngArr.push(item[0]);
    latlngArr.push(item[1]);
  });
  ffCesium.showMapByAreaLngLat(latlngArr);
});
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
