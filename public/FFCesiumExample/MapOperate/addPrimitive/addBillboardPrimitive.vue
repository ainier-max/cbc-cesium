<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addBillboardPrimitiveFun"
    >
      叠加图标（广告牌）
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removeBillboardPrimitiveFun"
    >
      移除图标（广告牌）
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
let billboardPrimitive = null;
const addBillboardPrimitiveFun = () => {
  let lngLatHeight = [118.1022, 24.4959, 100];
  let option = {
    image: "./images/FFCesium/MapOperate/addOtherElement/favicon.ico",
    pixelOffset: [0, -50], //数组第一个元素是左右方向，负值向左，第二个元素是上下方向，负值向上，
  };
  billboardPrimitive = ffCesium.addBillboardPrimitive(lngLatHeight, option);
};
const removeBillboardPrimitiveFun = () => {
  ffCesium.removeFFPrimitive(billboardPrimitive);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
