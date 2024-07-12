<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="billboardEditFun"
    >
      图标点进入修改
    </button>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from "vue";
import FFCesium from "FFCesium";

let ffCesium = null;
let billboardObj = null;
onMounted(() => {
  ffCesium = new FFCesium("cesiumContainer");
  let lngLatHeight = [118.1022, 24.4959, 0];
  let option = {
    image: "./images/FFCesium/MapOperate/addOtherElement/favicon.ico",
    pixelOffset: [0, -16], //数组第一个元素是左右方向，负值向左，第二个元素是上下方向，负值向上，
  };
  billboardObj = ffCesium.addBillboardEntity(lngLatHeight, option);
  console.log("billboardObj", billboardObj);
});

const billboardEditFun = () => {
  ffCesium.billboardEdit(billboardObj, billboardEditFunCallback);
};

const billboardEditFunCallback = (billboard) => {
  console.log("集成功,其对象为：", billboard);
  console.log("修改成功,其坐标为：", billboard.FFCoordinates);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
