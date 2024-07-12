<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 50px; z-index: 999"
      @click="addSkyBoxFun1"
    >
      蓝天
    </button>

    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addSkyBoxFun2"
    >
      晚霞
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeSkyBoxFun"
    >
      移除天空盒
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
    contextOptions: {
      requestWebgl1: true,
    },
  }; //初始化
  ffCesium = new FFCesium("cesiumContainer", viewerOption);
  ffCesium.addTdtImgLayer();
  ffCesium.setView({
    lng: 118.135,
    lat: 24.339,
    height: 20000,
    pitchRadiu: -10,
  });
});
const addSkyBoxFun1 = () => {
  let option = {};
  option.px =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Right.jpg";
  option.nx =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Left.jpg";
  option.py =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Front.jpg";
  option.ny =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Back.jpg";
  option.pz = "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Up.jpg";
  option.nz =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/lantian/Down.jpg";
  ffCesium.addSkyBox(option);
};
const addSkyBoxFun2 = () => {
  let option = {};
  option.px =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetRight.png";
  option.nx =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetLeft.png";
  option.py =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetFront.png";
  option.ny =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetBack.png";
  option.pz =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetUp.png";
  option.nz =
    "./images/FFCesium/MapOperate/mapTool/近地天空盒/wanxia/SunSetDown.png";
  ffCesium.addSkyBox(option);
};
const removeSkyBoxFun = () => {
  ffCesium.removeSkyBox();
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
