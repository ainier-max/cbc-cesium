<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="billboardGatherFun"
    >
      图标点采集
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
});

const billboardGatherFun = () => {
  ffCesium.billboardGather(billboardGatherFunCallback, {
    image: "./images/FFCesium/MapOperate/addOtherElement/favicon.ico",
    pixelOffset: [0, -16], //数组第一个元素是左右方向，负值向左，第二个元素是上下方向，负值向上，
  });
};

const billboardGatherFunCallback = (billboard) => {
  console.log("坐标采集成功,其对象为：", billboard);
  console.log("坐标采集成功,其坐标为：", billboard.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
