<template>
  <div id="cesiumContainer">
    <button
      style="position: absolute; left: 100px; top: 100px; z-index: 999"
      @click="addPolylineMovePointFun"
    >
      叠加闪烁线
    </button>

    <button
      style="position: absolute; left: 100px; top: 150px; z-index: 999"
      @click="removePolylineFlickerFun"
    >
      移除闪烁线
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
let polylineObj = null;
const addPolylineMovePointFun = () => {
  //叠加线
  let lnglatArr = [
    [118.10755933952464, 24.499075709713203, 100],
    [118.09021022013071, 24.46599111683894, 100],
    [118.1359583350454, 24.43919395273641, 100],
  ];
  let option = {
    width: 10,
    color: "#58D4DE",
    addType: "entity", //可选值：entity,primitive
  };
  polylineObj = ffCesium.addPolylineFlicker(lnglatArr, option);
};

const removePolylineFlickerFun = () => {
  ffCesium.removePolylineFlicker(polylineObj);
};
</script>
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
