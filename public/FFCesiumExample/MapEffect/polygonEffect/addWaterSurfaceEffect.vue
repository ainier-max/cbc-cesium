<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addWaterSurfaceEffectFun"
    >
      叠加水面效果
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeWaterSurfaceEffectFun"
    >
      移除水面效果
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";
let ffCesium = null;
onMounted(() => {
  //初始化
  ffCesium = new FFCesium("cesiumContainer");
});
let polygonPrimitive = null;
const addWaterSurfaceEffectFun = () => {
  let lnglatArr = [
    [118.17925038959659, 24.448614020090428],
    [118.1648102175159, 24.436475136885853],
    [118.17045019418286, 24.419280773762722],
    [118.19359437684406, 24.430309905788533],
  ];

  let option = {
    image: "../images/FFCesium/MapEffect/polygonEffect/water.jpg",
    frequency: 1000.0, //频率
    animationSpeed: 0.01, //动画速度
    amplitude: 10, //振幅
  };
  polygonPrimitive = ffCesium.addWaterSurfaceEffect(lnglatArr, option);
};

const removeWaterSurfaceEffectFun = () => {
  ffCesium.removeWaterSurfaceEffect(polygonPrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
